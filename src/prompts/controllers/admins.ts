import { Validate } from '@app/core/decorators';
import { Controller, Get, Patch } from '@nestjs/common';
import { Allow } from '@app/core/decorators';
import { AdminPromptsService } from '../services';
import { PromptsTransformer } from '../transformers';
import { AdminGetPromptsDto } from '../dtos/admin-get-prompts';
import { AdminUpdatePromptDto } from '../dtos';

@Controller({
  path: 'admins/prompts',
  version: '1',
})
export class AdminPromptsController {
  constructor(
    private readonly service: AdminPromptsService,
    private transformer: PromptsTransformer,
  ) {}

  @Allow(['super', 'admin'])
  @Get()
  async getPrompts(@Validate(AdminGetPromptsDto) inputs: AdminGetPromptsDto) {
    const response = await this.service.getPrompts(inputs);
    return this.transformer.collection(response);
  }

  @Allow(['super', 'admin'])
  @Patch(':key')
  async updatePrompt(
    @Validate(AdminUpdatePromptDto) inputs: AdminUpdatePromptDto,
  ) {
    await this.service.updatePrompt(inputs);
    return this.transformer.transform({ message: 'Success' });
  }
}
