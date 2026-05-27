import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Validate } from '@app/core/decorators';
import { CapsuleAiService } from '../services';
import { ProcessCapsuleDto } from '../dtos';
import { CapsuleTransformer } from '@app/src/capsules/transformers';

@Controller({
  path: 'ai/capsules',
  version: '1',
})
export class CapsuleAiController {
  constructor(
    private readonly service: CapsuleAiService,
    private readonly capsuleTransformer: CapsuleTransformer,
  ) {}

  /*
  @Post('generate')
  async generateImages(
    @Validate(ProcessCapsuleDto) payload: ProcessCapsuleDto,
  ): Promise<{ message: string; uuid: string }> {
    const result = await this.service.processCapsule(payload);
    return {
      message: 'Capsule generation has been started',
      uuid: result.uuid,
    };
  }
  */

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateImages(
    @Validate(ProcessCapsuleDto) payload: ProcessCapsuleDto,
  ): Promise<{ message: string; uuid: string }> {
    const result = await this.service.processCapsule(payload);
    return {
      message: 'Capsule generation has been started',
      uuid: result.uuid,
    };
  }
}
