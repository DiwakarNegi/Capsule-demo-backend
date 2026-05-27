import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import aiConfig from '@config/ai';
import appConfig from '@config/app';
import { ConfigType, getConfigToken } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AdminProcessInventoryDto } from '../dtos';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { InventoryRepository } from '@app/src/inventory/repositories';
import { FilesService } from '@app/core/files/services';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { UsersRepository } from '@app/src/users/repositories';
import * as z from 'zod';
import { Categories } from '@app/src/taxonaomy/entities';
import { BrandsRepository } from '@app/src/brands/repositories';
import { CategoriesRepository } from '@app/src/taxonaomy/repositories';
import { PromptsRepository } from '@app/src/prompts/repositories';

@Injectable()
export class AdminAiService {
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
  ) {
    this.geminiText = new ChatGoogleGenerativeAI({
      apiKey: ai.gemini.apiKey,
      model: ai.gemini.textModel,
      temperature: 0,
      maxOutputTokens: 1024,
    });
    this.geminiNanoBanana = new ChatGoogleGenerativeAI({
      apiKey: ai.gemini.apiKey,
      model: ai.gemini.imageModel,
      temperature: 0,
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
      supportingText ? `USER INPUT:\n${supportingText}\n` : '',
      'You will be provided a list of allowed categories with IDs.',
      'Return categoryId as the best matching IDs from the given lists.',
      'ONLY choose IDs from the provided lists.',
      'If you cannot confidently match based on visible text/logo in images or explicit user inputs, set the ID to the FIRST item from the list supplied.',
      'Return output ONLY as JSON matching the schema (no markdown).',
      '',
      'Allowed categories JSON:',
      JSON.stringify(categories),
    ].join('\n');

    mixedContent.push({ type: 'text', text: instructionText });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
      { name: 'Inventory Schema' },
    );

    return structuredLlm.invoke(messages, { timeout: 600000 });
  }

  private async generateImage(
    content: Array<any>,
    commerceCategory: string,
    supportingText?: string,
  ) {
    const keys = this.app.systemPromptKeys;
    const isMarketplace = commerceCategory === 'marketplace';

    const [systemMsg, variations] = await Promise.all([
      this.getSystemPrompt(
        isMarketplace
          ? keys.marketplaceImageGeneration
          : keys.lifestyleImageGeneration,
      ),
      this.getVariations(
        isMarketplace
          ? keys.marketplaceImageVariations
          : keys.lifestyleImageVariations,
      ),
    ]);

    const batchMessages: BaseLanguageModelInput[] = [];

    variations.forEach((variation: string) => {
      const mixedContent: any[] = [];

      if (supportingText) {
        mixedContent.push({ type: 'text', text: supportingText });
      }

      mixedContent.push({ type: 'text', text: variation });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mixedContent.push(...content);

      const messages: BaseLanguageModelInput = [
        systemMsg,
        new HumanMessage({ content: mixedContent }),
      ];

      batchMessages.push(messages);
    });

    const results = await this.geminiNanoBanana.batch(batchMessages, {
      timeout: 600000,
    });

    const images = results.map((msg) => ({
      mimeType:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (msg.content[0] as Record<string, any>).inlineData.mimeType as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data: (msg.content[0] as Record<string, any>).inlineData.data as string,
    }));

    if (images.length === 0) {
      throw new BadRequestException(
        'No images found in Gemini response. Expected AIMessage.content[].inlineData.data to exist.',
      );
    }

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

    const groupingResult = await this.groupImagesByProduct(content);

    if (!groupingResult?.groups?.length) {
      throw new BadRequestException('Image grouping failed');
    }

    for (const group of groupingResult.groups) {
      const groupedContent = group.imageIndexes.map(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
          {
            imageKeys: generatedKeys,
            generationStatus: 'Image generation done',
          },
        );

        const textRes = await this.generateText(
          groupedContent,
          categoriesArr,
          payload.supportingText,
        );

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
            text: `
              You will receive multiple product images.
              Group them by SAME physical product.
              Index images starting from 0 in the order received.
            `,
          },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
