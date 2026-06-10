import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ChatVertexAI } from '@langchain/google-vertexai';
import aiConfig from '@config/ai';
import appConfig from '@config/app';
import { ConfigType, getConfigToken } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ProcessCapsuleDto } from '../dtos';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { FilesService } from '@app/core/files/services';
import { UsersRepository } from '@app/src/users/repositories';
import { CapsuleRepository } from '@app/src/capsules/repositories';
import { CapsuleTransformer } from '@app/src/capsules/transformers';
import { CapsuleResponseDto } from '@app/src/capsules/dtos';
import { PromptsRepository } from '@app/src/prompts/repositories';
import { InventoryRepository } from '@app/src/inventory/repositories';
import { ILike } from 'typeorm';
import * as z from 'zod';

@Injectable()
export class CapsuleAiService {
  private geminiText: ChatVertexAI;
  private geminiImage: ChatVertexAI;

  constructor(
    @Inject(getConfigToken('ai'))
    private readonly ai: ConfigType<typeof aiConfig>,
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
    private readonly vendor: UsersRepository,
    private readonly files: FilesService,
    private readonly capsuleRepo: CapsuleRepository,
    private readonly capsuleTransformer: CapsuleTransformer,
    private readonly prompts: PromptsRepository,
    private readonly inventory: InventoryRepository,
  ) {
    this.geminiText = new ChatVertexAI({
      model: ai.gemini.textModel,
      location: 'us-central1',
      temperature: 0,
      maxOutputTokens: 1024,
    });
    this.geminiImage = new ChatVertexAI({
      model: ai.gemini.imageModel,
      location: 'us-central1',
      temperature: 1,
    });
  }

  // ─── Prompt Helpers ────────────────────────────────────────────────────────

  private async getSystemPrompt(key: string): Promise<SystemMessage> {
    const prompt = await this.prompts.findOneOrFail({
      where: { promptKey: key },
    });
    return new SystemMessage(prompt.promptValue);
  }

  // ─── Step 1: Analyse room image + user intent ──────────────────────────────
  // Sends the room image and user prompt to the text model.
  // Returns structured intent: transformation summary, how many items are
  // needed, and search terms to query against the inventory.

  private async analyseIntent(
    roomImageContent: any,
    userPrompt: string,
  ): Promise<{
    summary: string;
    itemCount: number;
    searchTerms: string[];
  }> {
    const systemMsg = await this.getSystemPrompt(
      this.app.systemPromptKeys.capsuleIntentAnalysis,
    );

    const intentSchema = z.object({
      summary: z
        .string()
        .describe(
          'Brief summary of what the user wants to achieve in the space',
        ),
      itemCount: z
        .int()
        .describe(
          'How many distinct inventory items are needed based on room complexity and user request',
        ),
      searchTerms: z
        .array(z.string())
        .describe(
          'List of product search terms to query the inventory (e.g. "sofa", "floor lamp", "coffee table")',
        ),
    });

    const structuredLlm = this.geminiText.withStructuredOutput(intentSchema, {
      name: 'IntentSchema',
    });

    return structuredLlm.invoke(
      [
        systemMsg,
        new HumanMessage({
          content: [
            {
              type: 'text',
              text: `User request: ${userPrompt}\n\nAnalyse the room image and the user's request. Determine what furniture/items need to be replaced or added, how many items are needed, and generate specific search terms to find matching products in our inventory.`,
            },
            roomImageContent,
          ] as any[],
        }),
      ] as any[],
      { timeout: 60000 },
    );
  }

  // ─── Step 2: Fetch matching inventory items ────────────────────────────────
  // For each AI-generated search term, runs a LIKE query against title and
  // description. Deduplicates by item id. Caps results at itemCount.

  private async fetchMatchingItems(searchTerms: string[], itemCount: number) {
    const seen = new Set<number>();
    const results: Record<string, any> = [];

    for (const term of searchTerms) {
      const matches = await this.inventory.find({
        where: [
          { title: ILike(`%${term}%`) },
          { description: ILike(`%${term}%`) },
        ],
        relations: ['category', 'brand'],
        take: Math.ceil(itemCount / searchTerms.length) + 2,
      });

      for (const item of matches) {
        if (!seen.has(item.id) && item.imageKeys?.length) {
          seen.add(item.id);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          results.push(item);
        }
        if (results.length >= itemCount) break;
      }

      if (results.length >= itemCount) break;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return results.slice(0, itemCount);
  }

  // ─── Step 3: Generate redesigned room image ────────────────────────────────
  // Sends the original room image + all product images to the image model.
  // Returns a single redesigned room image.

  private async generateRedesignedImage(
    roomImageContent: any,
    productImageContents: any[],
    intentSummary: string,
    itemMetadata: Array<{ title: string; description: string }>,
  ): Promise<{ mimeType: string; data: string }> {
    const systemMsg = await this.getSystemPrompt(
      this.app.systemPromptKeys.capsuleImageGeneration,
    );

    const itemContext = itemMetadata
      .map((item, i) => `${i + 1}. ${item.title}: ${item.description}`)
      .join('\n');

    const result = await this.geminiImage.invoke(
      [
        systemMsg,
        new HumanMessage({
          content: [
            {
              type: 'text',
              text: [
                `Design Intent: ${intentSummary}`,
                ``,
                `Products to incorporate (in order provided):`,
                itemContext,
                ``,
                `The FIRST image is the original room. The remaining images are the products to place into the room.`,
                `Preserve the room's architecture, camera angle, lighting direction, and layout.`,
                `Only replace or add the identified items. Do not redesign walls, floor, ceiling, or windows.`,
              ].join('\n'),
            },
            roomImageContent,
            ...productImageContents,
          ] as any[],
        }),
      ] as any[],
      { timeout: 600000 },
    );

    // ChatVertexAI returns generated images as { type: 'image_url', image_url: 'data:<mime>;base64,<data>' }
    // — image_url is a data-URL STRING here, not an object with .url/.inlineData.
    const part = result.content[0] as Record<string, any>;
    const dataUrl = typeof part?.image_url === 'string' ? (part.image_url as string) : undefined;
    const match = dataUrl?.match(/^data:([^;]+);base64,(.+)$/);

    if (!match) {
      throw new BadRequestException(
        'No image generated from redesign step. Check Gemini image model response.',
      );
    }

    return {
      mimeType: match[1],
      data: match[2],
    };
  }

  // ─── Public entry point ────────────────────────────────────────────────────

  async processCapsule(
    payload: ProcessCapsuleDto,
  ): Promise<CapsuleResponseDto> {
    if (!payload.imageKeys?.length) {
      throw new BadRequestException(
        'A room image is required for capsule generation.',
      );
    }

    if (!payload.supportingText) {
      throw new BadRequestException(
        'A description of the desired transformation is required.',
      );
    }

    const capsule = await this.capsuleRepo.createAndSave({
      prompt: payload.supportingText,
      referenceImageKeys: payload.imageKeys,
      vendorId: 1,
      status: 'pending',
    });

    void this.runPipeline(capsule.id, payload);

    return this.capsuleTransformer.transformCapsule(capsule);
  }

  // ─── Background pipeline ───────────────────────────────────────────────────

  private async runPipeline(
    capsuleId: number,
    payload: ProcessCapsuleDto,
  ): Promise<void> {
    try {
      // ── Load room image ──────────────────────────────────────────────────
      const roomUrl = await this.files.getViewUrl(payload.imageKeys[0]);
      const roomBuffer = await fetch(roomUrl).then((r) => r.arrayBuffer());
      const roomBase64 = Buffer.from(roomBuffer).toString('base64');
      const roomImageContent = {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${roomBase64}` },
      };

      await this.capsuleRepo.update({ id: capsuleId }, { status: 'analysing' });

      // ── Step 1: Analyse intent ───────────────────────────────────────────
      const intent = await this.analyseIntent(
        roomImageContent,
        payload.supportingText,
      );

      console.log(
        `[Capsule ${capsuleId}] Intent — itemCount: ${intent.itemCount}, terms: ${intent.searchTerms.join(', ')}`,
      );

      await this.capsuleRepo.update(
        { id: capsuleId },
        { status: 'fetching_items' },
      );

      // ── Step 2: Fetch matching inventory items ───────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const matchedItems: Record<string, any>[] = await this.fetchMatchingItems(
        intent.searchTerms,
        intent.itemCount,
      );

      if (!matchedItems.length) {
        throw new Error(
          `No inventory items matched search terms: ${intent.searchTerms.join(', ')}`,
        );
      }

      console.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        `[Capsule ${capsuleId}] Matched items: ${matchedItems.map((i) => i.title).join(', ')}`,
      );

      // ── Load all product images ──────────────────────────────────────────
      const productImageContents: any[] = [];

      for (const item of matchedItems) {
        for (const key of item.imageKeys) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const url = await this.files.getViewUrl(key);
            const buffer = await fetch(url).then((r) => r.arrayBuffer());
            const base64 = Buffer.from(buffer).toString('base64');
            productImageContents.push({
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            });
          } catch (err) {
            console.warn(
              `[Capsule ${capsuleId}] Failed to load image key ${key} for item ${item.id}`,
              err,
            );
          }
        }
      }

      await this.capsuleRepo.update(
        { id: capsuleId },
        { status: 'generating_image' },
      );

      // ── Step 3: Generate redesigned room ────────────────────────────────
      const image = await this.generateRedesignedImage(
        roomImageContent,
        productImageContents,
        intent.summary,
        matchedItems.map((i) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          title: i.title,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          description: i.description,
        })),
      );

      // ── Save generated image ─────────────────────────────────────────────
      const key = `capsules/generated/${randomUUID()}`;
      await this.files.putFile(key, image.data, image.mimeType);

      // ── Persist results ──────────────────────────────────────────────────
      const updatedCapsule = await this.capsuleRepo.findOneOrFail({
        where: { id: capsuleId },
      });

      updatedCapsule.imageKeys = [key];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
      updatedCapsule.usedInventoryIds = matchedItems.map((i) => i.id);
      updatedCapsule.status = 'completed';

      await this.capsuleRepo.save(updatedCapsule);

      console.log(
        `[Capsule ${capsuleId}] Completed — image: ${key}, items: ${updatedCapsule.usedInventoryIds.join(', ')}`,
      );
    } catch (err) {
      await this.capsuleRepo.update(
        { id: capsuleId },
        {
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        },
      );

      console.error(`[Capsule ${capsuleId}] Pipeline failed:`, err);
    }
  }
}
