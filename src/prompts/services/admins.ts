import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigType, getConfigToken } from '@nestjs/config';
import appConfig from '@config/app';
import { PromptsRepository } from '../repositories';
import { AdminGetPromptsDto, AdminUpdatePromptDto } from '../dtos';
import { Prompts } from '../entities';

@Injectable()
export class AdminPromptsService {
  constructor(
    private readonly prompts: PromptsRepository,
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  async getPrompts(payload: AdminGetPromptsDto): Promise<Prompts[]> {
    return this.prompts.find({
      where: payload.key ? { promptKey: payload.key } : undefined,
    });
  }

  async updatePrompt(payload: AdminUpdatePromptDto): Promise<void> {
    const validKeys = Object.values(this.app.systemPromptKeys);

    if (!validKeys.includes(payload.key)) {
      throw new BadRequestException(`Invalid prompt key.`);
    }

    await this.prompts.update(
      { promptKey: payload.key },
      { promptValue: payload.value },
    );
  }
}
