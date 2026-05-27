import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import aiConfig from '@config/ai';
import appConfig from '@config/app';
import { ConfigType, getConfigToken } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { UserProcessInventoryDto } from '../dtos';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { InventoryRepository } from '@app/src/inventory/repositories';
import { FilesService } from '@app/core/files/services';
import { UsersRepository } from '@app/src/users/repositories';
import * as z from 'zod';
import { Categories } from '@app/src/taxonaomy/entities';
import { BrandsRepository } from '@app/src/brands/repositories';
import { CategoriesRepository } from '@app/src/taxonaomy/repositories';
import { JwtUser } from '@app/core/guards/types';
import { PromptsRepository } from '@app/src/prompts/repositories';
import { DataSource } from 'typeorm';
import { Users } from '@app/src/users/entities';
import { Brands } from '@app/src/brands/entities';

@Injectable()
export class UsersAiService {
  private geminiText: ChatGoogleGenerativeAI;
  private geminiNanoBanana: ChatGoogleGenerativeAI;

  constructor(
    @Inject(getConfigToken('ai'))
    private readonly ai: ConfigType<typeof aiConfig>,
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
    private readonly inventory: InventoryRepository,
    private readonly vendor: UsersRepository,
    private readonly brands: BrandsRepository,
    private readonly categories: CategoriesRepository,
    private readonly files: FilesService,
    private readonly prompts: PromptsRepository,
    private readonly dataSource: DataSource,
  ) {
    this.geminiText = new ChatGoogleGenerativeAI({
      apiKey: ai.gemini.apiKey,
      model: ai.gemini.textModel,
      temperature: 0,
      maxOutputTokens: 4096,
    });
    this.geminiNanoBanana = new ChatGoogleGenerativeAI({
      apiKey: ai.gemini.apiKey,
      model: ai.gemini.imageModel,
      temperature: 0,
    });
  }

  private async getOrCreateDemoVendor(): Promise<Users> {
    // Try to find any existing user
    const existing = await this.vendor.findOne({ where: {} });
    if (existing) return existing;

    // Create a demo vendor user if none exists
    const user = this.dataSource.getRepository(Users).create({
      name: 'Demo Vendor',
      countryCode: '+91',
      mobileNumber: '9999999999',
      email: 'demo@sirhaana.com',
    });
    return this.dataSource.getRepository(Users).save(user);
  }

  private async getOrCreateDemoBrand(): Promise<Brands> {
    const existing = await this.brands.findOne({ where: {} });
    if (existing) return existing;

    return this.brands.createAndSave({
      name: 'Sirhaana',
      thumbnail: '',
      featured: '[]',
    });
  }

  private async getSystemPrompt(key: string): Promise<SystemMessage> {
    const prompt = await this.prompts.findOneOrFail({
      where: { promptKey: key },
    });
    return new SystemMessage(prompt.promptValue);
  }

  private async getVariations(key: string): Promise<string[]> {
    const prompt = await this.prompts.findOneOrFail({
      where: { promptKey: key },
    });
    return prompt.promptValue.split(',').map((v) => v.trim());
  }

  private async generateText(
    content: Array<any>,
    categories: Partial<Categories[]>,
    supportingText?: string,
  ): Promise<{
    title: string;
    description: string;
    brandId: number;
    categoryId: number;
  }> {
    const systemMsgText = await this.getSystemPrompt(
      this.app.systemPromptKeys.textGeneration,
    );

    const mixedContent: any[] = [];

    const instructionText = [
      supportingText ? 'USER INPUT:\n' + supportingText + '\n' : '',
      'You will be provided a list of allowed categories with IDs.',
      'Return categoryId as the best matching IDs from the given lists.',
      'ONLY choose IDs from the provided lists.',
      'If you cannot confidently match, set the ID to the FIRST item from the list supplied.',
      'Return output ONLY as JSON matching the schema (no markdown).',
      '',
      'Allowed categories JSON:',
      JSON.stringify(categories),
    ].join('\n');

    mixedContent.push({ type: 'text', text: instructionText });
    mixedContent.push(...content);

    const messages = [
      systemMsgText,
      new HumanMessage({ content: mixedContent }),
    ];

    const inventorySchema = z.object({
      title: z.string().describe('Title of the inventory item'),
      description: z.string().describe('Description of the inventory item'),
      brandId: z.int().describe('ID from allowed brands list'),
      categoryId: z.int().describe('ID from allowed categories list'),
    });

    const structuredLlm = this.geminiText.withStructuredOutput(
      inventorySchema,
      { name: 'Inventory Schema', includeRaw: false },
    );

    // Filter out image content for structured output - use text description only
    const textOnly = mixedContent.filter((c: any) => c && c.type === 'text');
    const textMessages = [
      systemMsgText,
      new HumanMessage({ content: textOnly.length > 0 ? textOnly : [{ type: 'text', text: 'Home decor product. Generate a title and description.' }] }),
    ];

    return structuredLlm.invoke(textMessages, { timeout: 600000 });
  }

  private async generateImage(
    content: Array<any>,
    commerceCategory: string,
    supportingText?: string,
  ) {
    const keys = this.app.systemPromptKeys;
    const isMarketplace = commerceCategory === 'marketplace';

    const variations = await this.getVariations(
      isMarketplace ? keys.marketplaceImageVariations : keys.lifestyleImageVariations,
    );

    const hfToken = process.env.HF_TOKEN;
    const model = process.env.HF_IMG2IMG_MODEL ?? 'timbrooks/instruct-pix2pix';

    if (!hfToken) throw new Error('HF_TOKEN is not set — add it to .env');

    const firstImage = content.find((c: any) => c?.type === 'image_url');
    if (!firstImage) throw new BadRequestException('No image content found');
    const dataUrl: string = firstImage.image_url.url as string;
    const base64Source = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

    const images: { mimeType: string; data: string }[] = [];

    for (const variation of variations) {
      const prompt = [supportingText, variation].filter(Boolean).join('. ');

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
            'x-wait-for-model': 'true',
          },
          body: JSON.stringify({
            inputs: base64Source,
            parameters: {
              prompt,
              strength: 0.75,
              guidance_scale: 7.5,
              image_guidance_scale: 1.5,
              num_inference_steps: 20,
            },
          }),
          signal: AbortSignal.timeout(120000),
        },
      );

      if (!response.ok) {
        const err = await response.text().catch(() => response.statusText);
        throw new Error(`HuggingFace error ${response.status}: ${err}`);
      }

      const buffer = await response.arrayBuffer();
      images.push({ mimeType: 'image/jpeg', data: Buffer.from(buffer).toString('base64') });
    }

    if (!images.length) throw new BadRequestException('HuggingFace returned no images');

    return { images };
  }

  async processInventory(payload: UserProcessInventoryDto, _user: JwtUser) {
    const content: Array<any> = [];

    const vendor = await this.getOrCreateDemoVendor();
    const brand = await this.getOrCreateDemoBrand();

    const categoriesArr = await this.categories.find({
      select: ['id', 'name'],
    });

    if (!categoriesArr.length) {
      throw new BadRequestException('No categories found. Please seed categories.');
    }

    if (!payload.imageKeys) {
      throw new BadRequestException('No images provided');
    }

    for (const key of payload.imageKeys) {
      const filePath = this.files.getLocalPath(key);
      const imageData = require('fs').readFileSync(filePath);
      const base64Image = imageData.toString('base64');

      content.push({
        type: 'image_url',
        image_url: { url: 'data:image/jpeg;base64,' + base64Image },
      } as any);
    }

    let groupingResult: { groups: { groupId: string; imageIndexes: number[]; reasoning: string }[] } | null = null;
    try {
      groupingResult = await this.groupImagesByProduct(content);
    } catch {
      // Fallback: treat all images as one group
      groupingResult = { groups: [{ groupId: 'group-0', imageIndexes: content.map((_, i) => i), reasoning: 'fallback' }] };
    }

    if (!groupingResult?.groups?.length) {
      groupingResult = { groups: [{ groupId: 'group-0', imageIndexes: content.map((_, i) => i), reasoning: 'fallback' }] };
    }

    for (const group of groupingResult.groups) {
      const groupedContent = group.imageIndexes.map(
        (index: number) => content[index],
      );

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

        if (process.env.MOCK_IMAGE_GEN === 'true') {
          console.warn('[MOCK_IMAGE_GEN] Skipping Gemini image call — returning uploaded keys.');
          generatedKeys = payload.imageKeys;
        } else {
          const imageRes = await this.generateImage(
            groupedContent,
            payload.commerceCategory,
            payload.supportingText,
          );

          if (!imageRes?.images?.length) {
            throw new Error('Nano Banana image generation failed');
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
          { imageKeys: generatedKeys, generationStatus: 'Image generation done' },
        );

        const textRes = await this.generateText(
          groupedContent,
          categoriesArr,
          payload.supportingText,
        );

        if (!textRes) throw new Error('Text generation failed');

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

  private async groupImagesByProduct(content: Array<any>) {
    const systemMsgGrouping = await this.getSystemPrompt(
      this.app.systemPromptKeys.imageGroupGeneration,
    );

    const groupingSchema = z.object({
      groups: z.array(
        z.object({
          groupId: z.string(),
          imageIndexes: z.array(z.number()),
          reasoning: z.string(),
        }),
      ),
    });

    const messages = [
      systemMsgGrouping,
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: 'You will receive multiple product images. Group them by SAME physical product. Index images starting from 0 in the order received.',
          },
          ...content,
        ],
      }),
    ];

    const structured = this.geminiText.withStructuredOutput(groupingSchema, {
      name: 'ImageGroupingSchema',
    });

    return structured.invoke(messages, { timeout: 600000 });
  }
}