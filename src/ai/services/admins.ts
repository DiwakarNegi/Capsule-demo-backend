import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import appConfig from '@config/app';
import aiConfig from '@config/ai';
import { ConfigType, getConfigToken } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AdminProcessInventoryDto } from '../dtos';
import { InventoryRepository } from '@app/src/inventory/repositories';
import { FilesService } from '@app/core/files/services';
import { UsersRepository } from '@app/src/users/repositories';
import { Categories } from '@app/src/taxonaomy/entities';
import { BrandsRepository } from '@app/src/brands/repositories';
import { CategoriesRepository } from '@app/src/taxonaomy/repositories';
import { PromptsRepository } from '@app/src/prompts/repositories';
import { ChatVertexAI } from '@langchain/google-vertexai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import * as z from 'zod';

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

@Injectable()
export class AdminAiService {
  private geminiImage: ChatVertexAI;

  constructor(
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
    @Inject(getConfigToken('ai'))
    private readonly ai: ConfigType<typeof aiConfig>,
    private readonly inventory: InventoryRepository,
    private readonly vendor: UsersRepository,
    private readonly brands: BrandsRepository,
    private readonly categories: CategoriesRepository,
    private readonly files: FilesService,
    private readonly prompts: PromptsRepository,
  ) {
    this.geminiImage = new ChatVertexAI({
      model: ai.gemini.imageModel,
      location: 'us-central1',
      temperature: 1,
    });
  }

  private async getPromptValue(key: string): Promise<string> {
    const prompt = await this.prompts.findOneOrFail({ where: { promptKey: key } });
    return prompt.promptValue;
  }

  private async getVariations(key: string): Promise<string[]> {
    const value = await this.getPromptValue(key);
    return value.split(',').map((v) => v.trim());
  }

  private async generateText(
    categories: Partial<Categories[]>,
    supportingText?: string,
  ): Promise<{
    title: string;
    description: string;
    brandId: number;
    categoryId: number;
  }> {
    const systemPrompt = await this.getPromptValue(this.app.systemPromptKeys.textGeneration);

    const geminiText = new ChatVertexAI({
      model: this.ai.gemini.textModel,
      location: 'us-central1',
      temperature: 0,
      maxOutputTokens: 4096,
      thinkingBudget: 0,
    } as any);

    const validCategoryIds = new Set(categories.map((c) => c?.id));
    const fallbackCategoryId = categories[0]?.id ?? 1;

    const schema = z.object({
      title: z.string().describe('Concise product name, 50-70 characters'),
      description: z.string().describe('Product description, 40-60 words. Key features, materials, and use-case only. No filler sentences.'),
      categoryId: z.number().describe('Single best-matching category ID from the allowed list below'),
    });

    const structured = geminiText.withStructuredOutput(schema, { name: 'ProductCopy' });

    const userContent = [
      supportingText ? `Product: ${supportingText}` : '',
      '',
      'Allowed categories (id + name) — pick one id from this list:',
      JSON.stringify(categories),
    ].filter(Boolean).join('\n');

    const result = await structured.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userContent),
    ] as any[]);

    const categoryId = validCategoryIds.has(Number(result.categoryId))
      ? Number(result.categoryId)
      : fallbackCategoryId;

    return {
      title: String(result.title ?? 'Product'),
      description: String(result.description ?? ''),
      brandId: 0,
      categoryId,
    };
  }

  // Asks Gemini vision to confirm a generated shot still shows the same
  // physical product as the reference photo (shape, proportions, color,
  // material) — used to catch generations where Imagen drifted or dropped
  // the subject before they reach a customer-facing listing.
  // Returns true when verification passes OR is inconclusive (transient
  // errors must not block image generation — the guard is a quality
  // improvement, not a hard gate the primary feature can fail on).
  private async productPreserved(
    geminiText: ChatVertexAI,
    reference: { mimeType: string; data: string },
    candidate: { mimeType: string; data: string },
  ): Promise<boolean> {
    try {
      const result = await geminiText.invoke([
        new HumanMessage({
          content: [
            {
              type: 'text',
              text: 'Image 1 is a reference product photo. Image 2 is a generated photo that should show the SAME physical product — same shape, proportions, color, and material — placed in a different setting. Reply with exactly one word: YES if image 2 clearly shows the same product as image 1, or NO if the product is a different shape, different color, a different item, or missing/replaced.',
            },
            { type: 'image_url', image_url: { url: `data:${reference.mimeType};base64,${reference.data}` } },
            { type: 'image_url', image_url: { url: `data:${candidate.mimeType};base64,${candidate.data}` } },
          ] as any[],
        }),
      ] as any[]);

      const text = (typeof result.content === 'string'
        ? result.content
        : ((result.content[0] as Record<string, any>).text as string) ?? '').trim().toUpperCase();

      return text.startsWith('YES');
    } catch {
      return true;
    }
  }

  private async generateImage(
    content: Array<any>,
    supportingText?: string,
    dimensions?: { width?: number; length?: number; unit?: string },
  ) {
    if (!content.length) throw new BadRequestException('No source image provided for enhancement');

    // Step 1: Gemini vision — one precise sentence for use in Imagen prompts
    // thinkingBudget: 0 — gemini-2.5-flash burns its output-token budget on internal
    // reasoning before writing the visible answer; left enabled, the description below
    // (and the YES/NO verdict in productPreserved, which reuses this instance) can be
    // silently truncated mid-sentence (finish_reason MAX_TOKENS), poisoning every
    // downstream Imagen prompt with garbage text.
    const geminiText = new ChatVertexAI({
      model: this.ai.gemini.textModel,
      location: 'us-central1',
      temperature: 0,
      maxOutputTokens: 256,
      thinkingBudget: 0,
    } as any);

    const descResult = await geminiText.invoke([
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: `Identify this product in one sentence. Include: exact product type (e.g. "square throw cushion" not "textile", "ceramic dinner plate" not "tableware"), primary colour, material, and one key visual detail. Be precise, never generalise.${supportingText ? ` Vendor note: ${supportingText}` : ''}`,
          },
          ...content,
        ] as any[],
      }),
    ] as any[]);

    const productDescription = (typeof descResult.content === 'string'
      ? descResult.content
      : ((descResult.content[0] as Record<string, any>).text as string) ?? 'product').trim();

    // Step 2: 4 scenes to edit the SAME photo into. gemini-2.5-flash-image is a
    // true image-to-image edit model — it edits the pixels you give it rather
    // than generating something "inspired by" a reference (which is what Imagen
    // 3's reference-edit mode does, and why it kept inventing different products
    // — chairs, lamps — instead of preserving the one in the photo). Editing the
    // actual image is what makes product identity reliably survive the scene change.
    const scenes = [
      'Replace the background with a pure white seamless e-commerce studio backdrop, soft diffused overhead lighting, clean catalog shot, no harsh shadows other than a soft contact shadow beneath the product.',
      'Replace the background with a dark charcoal dramatic editorial backdrop, single overhead spotlight, rich shadows, premium luxury feel.',
      'Replace the background with a warm living room interior — place the product on a dark walnut console table near a potted plant, late-afternoon golden light streaming in through a window, editorial interior photography.',
      'Replace the background with a sun-drenched outdoor terrace — place the product on a wooden garden table, soft warm bokeh greenery in the background, bright airy natural light, summery feel.',
    ];

    // Optional vendor-supplied real-world dimensions — gives the model an explicit
    // aspect-ratio anchor so it can't silently stretch/squash the product (e.g. a
    // square quilt coming back rectangular) when it re-renders the scene around it.
    const dimensionLine =
      dimensions?.width && dimensions?.length
        ? (() => {
            const unit = dimensions.unit ?? 'cm';
            const divisor = gcd(Math.round(dimensions.width!), Math.round(dimensions.length!));
            const ratio = `${dimensions.width! / divisor}:${dimensions.length! / divisor}`;
            return `Its real-world size is ${dimensions.width}${unit} (width) by ${dimensions.length}${unit} (length) — an aspect ratio of ${ratio}. Every generated scene must preserve this exact proportion; do not stretch, squash, elongate, or otherwise distort the product into a different ratio.`;
          })()
        : null;

    const EDIT_RULES = [
      'You are editing a real product photo. Follow these rules exactly.',
      '',
      'PRESERVE (do not change at all): the product itself must remain pixel-identical —',
      'same shape, proportions, colour, material, texture, surface pattern, edges, and orientation.',
      `It is: ${productDescription}`,
      ...(dimensionLine ? [dimensionLine] : []),
      'Do NOT redesign, restyle, recolor, regenerate, or substitute the product with a different item.',
      '',
      'REPLACE (change completely): generate a brand-new, photorealistic environment around the',
      'product as described in the scene below. Place the product naturally on an appropriate surface',
      'with correct perspective, contact shadows, and lighting that matches the new scene.',
      '',
      'This is a full scene replacement, not a filter or tint — regenerate the background entirely',
      'while keeping the product exactly as it appears in the photo provided.',
    ].join('\n');

    const firstImageUrl = (content[0] as any).image_url?.url as string;
    const srcBase64 = firstImageUrl.split(',')[1];
    const srcMime = (firstImageUrl.match(/data:([^;]+);base64/) ?? [])[1] ?? 'image/jpeg';
    const reference = { mimeType: srcMime, data: srcBase64 };

    const images: { mimeType: string; data: string }[] = [];
    const MAX_ATTEMPTS = 3;

    for (const scene of scenes) {
      const prompt = `${EDIT_RULES}\n\nSCENE: ${scene}`;
      let chosen: { mimeType: string; data: string } | null = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const result = await this.geminiImage.invoke([
          new HumanMessage({
            content: [
              { type: 'image_url', image_url: { url: firstImageUrl } },
              { type: 'text', text: prompt },
            ] as any[],
          }),
        ] as any[], { timeout: 300000 });

        // ChatVertexAI returns generated images as { type: 'image_url', image_url: 'data:<mime>;base64,<data>' }
        // — image_url is a data-URL STRING here, not an object with .url/.inlineData.
        const part = result.content[0] as Record<string, any>;
        const dataUrl = typeof part?.image_url === 'string' ? part.image_url : undefined;
        const match = dataUrl?.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) continue;

        const candidate = { mimeType: match[1], data: match[2] };
        chosen = candidate;

        if (await this.productPreserved(geminiText, reference, candidate)) {
          chosen = candidate;
          break;
        }
      }

      if (chosen) images.push(chosen);
    }

    if (!images.length) throw new BadRequestException('Image editing returned no images');

    return { images, productDescription };
  }

  async processInventory(payload: AdminProcessInventoryDto) {
    const content: Array<any> = [];

    const vendor = await this.vendor.findOneOrFail({
      where: { uuid: 'super-admin' },
    });

    const brand = await this.brands.findOneOrFail({
      where: { uuid: payload.vendorId },
    });

    const categoriesArr = await this.categories.find({
      select: ['id', 'name'],
    });

    for (const key of payload.imageKeys) {
      const url = await this.files.getViewUrl(key);
      const imageData = await fetch(url).then((res) => res.arrayBuffer());
      const base64Image = Buffer.from(imageData).toString('base64');

      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
        },
      });
    }

    if (!content.length) {
      throw new BadRequestException('No images provided');
    }

    // Without a vision model, treat all images as one group
    const groupingResult = {
      groups: [{ groupId: 'group-0', imageIndexes: content.map((_, i) => i), reasoning: 'single-group' }],
    };

    for (const group of groupingResult.groups) {
      const groupedContent = group.imageIndexes.map((index: number) => content[index]);

      const inventoryItem = await this.inventory.createAndSave({
        title: 'Processing',
        description: 'Processing',
        price: 0,
        stock: 0,
        vendor,
        brandId: brand.id,
        categoryId: categoriesArr[0].id,
        generationStatus: 'Processing',
      });

      try {
        let generatedKeys: string[];
        let imageRes: any;

        if (process.env.MOCK_IMAGE_GEN === 'true') {
          console.warn('[MOCK_IMAGE_GEN] Skipping image gen — returning uploaded keys.');
          generatedKeys = payload.imageKeys;
        } else {
          imageRes = await this.generateImage(
            groupedContent,
            payload.supportingText,
            {
              width: payload.productWidth,
              length: payload.productLength,
              unit: payload.productDimensionUnit,
            },
          );

          if (!imageRes?.images?.length) {
            throw new Error('Image generation failed');
          }

          generatedKeys = [];
          for (const img of imageRes.images) {
            const key = `generated/${randomUUID()}`;
            await this.files.putFile(key, img.data, img.mimeType);
            generatedKeys.push(key);
          }
        }

        await this.inventory.update(
          { id: inventoryItem.id },
          {
            imageKeys: generatedKeys,
            generationStatus: 'Image generation done',
          },
        );

        const textRes = await this.generateText(categoriesArr, imageRes?.productDescription || payload.supportingText);

        if (!textRes) {
          throw new Error('Text generation failed');
        }

        await this.inventory.update(
          { id: inventoryItem.id },
          { generationStatus: 'Text generation done' },
        );

        await this.inventory.update(
          { id: inventoryItem.id },
          {
            title: textRes.title,
            description: textRes.description,
            price: 0,
            stock: 100,
            categoryId: textRes.categoryId,
            generationStatus: 'Image Generation Complete',
          },
        );
      } catch (err) {
        await this.inventory.update(
          { id: inventoryItem.id },
          { generationStatus: 'Generation Failed' },
        );

        throw err;
      }
    }
  }
}
