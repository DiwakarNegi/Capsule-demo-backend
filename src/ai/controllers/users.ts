import { Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Validate } from '@app/core/decorators';
import type { FastifyRequest } from 'fastify';
import { UsersAiService } from '../services';
import { UserProcessInventoryDto } from '../dtos';

@Controller({
  path: 'ai',
  version: '1',
})
export class UsersAiController {
  constructor(private readonly service: UsersAiService) {}

  @Post('process-inventory')
  @HttpCode(HttpStatus.OK)
  processInventory(
    @Req() req: FastifyRequest,
    @Validate(UserProcessInventoryDto) payload: UserProcessInventoryDto,
  ) {
    const user = (req as any).user ?? { sub: 'demo', role: 'vendor' };
    void this.service.processInventory(payload, user);
    return { message: 'Request submitted' };
  }
}