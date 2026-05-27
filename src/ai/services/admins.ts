import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import appConfig from '@config/app';
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

@Injectable()
export class AdminAiService {
  constructor(
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
    private readonly inventory: InventoryRepository,
    private readonly vendor: UsersRepository,
    private readonly brands: BrandsRepository,
    private readonly categories: CategoriesRepository,
    private readonly files: FilesService,
    private readonly prompts: PromptsRepository,
  ) {}

  private async getPromptValue(key: string): Promise<string> {
    const prompt = await this.prompts.findOneOrFail({ where: { promptKey: key } });
    return prompt.promptValue;
  }

  private async getVariations(key: string): Promise<string[]> {
    const value = await this.getPromptValue(key);
    return value.split(',').map((v) => v.trim());
  }

  private async callHfText(systemPrompt: string, userContent: string): Promise<any> {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) throw new Error('HF_TOKEN is not set — add it to .env');

    const model = process.env.HF_TEXT_MODEL ?? 'mistralai/Mistral-7B-Instruct-v0.3';

    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          max_tokens: 1024,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(60000),
      },
    );

    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText);
      throw new Error(`HuggingFace text error ${response.status}: ${err}`);
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    const raw = data.choices[0].message.content;

    // Extract JSON from response — model may wrap it in markdown or add commentary
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`HuggingFace text model returned no JSON: ${raw}`);
    return JSON.parse(jsonMatch[0]) as unknown;
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

    const userContent = [
      supportingText ? `USER INPUT:\n${supportingText}\n` : '',
      'You will be provided a list of allowed categories with IDs.',
      'Return categoryId as the best matching ID from the given list.',
      'ONLY choose IDs from the provided list.',
      'If you cannot confidently match, set categoryId to the FIRST item from the list.',
      'Return output ONLY as a JSON object with keys: title, description, brandId, categoryId.',
      '',
      'Allowed categories JSON:',
      JSON.stringify(categories),
    ].join('\n');

    const result = await this.callHfText(systemPrompt, userContent) as {
      title: string;
      description: string;
      brandId: number;
      categoryId: number;
    };

    return {
      title: String(result.title ?? 'Product'),
      description: String(result.description ?? ''),
      brandId: Number(result.brandId ?? 0),
      categoryId: Number(result.categoryId ?? categories[0]?.id ?? 1),
    };
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
    const model = process.env.HF_TXT2IMG_MODEL ?? 'black-forest-labs/FLUX.1-schnell';

    if (!hfToken) throw new Error('HF_TOKEN is not set — add it to .env');

    const images: { mimeType: string; data: string }[] = [];

    for (const variation of variations) {
      const prompt = [supportingText, variation].filter(Boolean).join('. ') || 'professional product photo on white background';

      const response = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
            'x-wait-for-model': 'true',
          },
          body: JSON.stringify({ inputs: prompt }),
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

        if (process.env.MOCK_IMAGE_GEN === 'true') {
          console.warn('[MOCK_IMAGE_GEN] Skipping image gen — returning uploaded keys.');
          generatedKeys = payload.imageKeys;
        } else {
          const imageRes = await this.generateImage(
            groupedContent,
            payload.commerceCategory,
            payload.supportingText,
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

        const textRes = await this.generateText(categoriesArr, payload.supportingText);

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
