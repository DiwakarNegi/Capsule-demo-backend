import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Allow, Validate } from '@app/core/decorators';
import { AiTransformer } from '../transformers';
import { AdminAiService } from '../services';
import { AdminProcessInventoryDto } from '../dtos';

@Controller({
  path: 'admins/ai',
  version: '1',
})
export class AdminAiController {
  constructor(
    private readonly service: AdminAiService,
    private transformer: AiTransformer,
  ) {}

  /*
  @Allow(['super', 'admin'])
  @Post('process-inventory')
  processInventory(
    @Validate(AdminProcessInventoryDto) payload: AdminProcessInventoryDto,
  ) {
    void this.service.processInventory(payload);
    return { message: 'Request submitted' };
  }
  */

  @Allow(["admin:processInventory"])
  @Post('process-inventory')
  @HttpCode(HttpStatus.OK)
  processInventory(
    @Validate(AdminProcessInventoryDto) payload: AdminProcessInventoryDto,
  ) {
    this.service.processInventory(payload).catch((err: unknown) => {
      console.error('[processInventory] pipeline error:', err);
    });
    return { message: 'Request submitted' };
  }
}
