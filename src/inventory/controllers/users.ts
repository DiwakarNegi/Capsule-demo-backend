import { Controller, Get, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { VendorInventoryService } from '../services';
import { InventoryTransformer } from '../transformers';
import { Validate } from '@app/core/decorators';
import { VendorCreateInventoryDto, VendorGetInventoryDto } from '../dtos';

@Controller({ path: 'inventory', version: '1' })
export class VendorInventoryController {
  constructor(
    private readonly service: VendorInventoryService,
    private readonly transformer: InventoryTransformer,
  ) {}

  @Get()
  async getMine(
    @Req() req: FastifyRequest,
    @Validate(VendorGetInventoryDto) inputs: VendorGetInventoryDto,
  ) {
    const user = (req as any).user ?? { sub: 'demo', role: 'vendor' };
    const result = await this.service.getMyInventory(user, inputs);
    return this.transformer.paginate(result);
  }

  @Post()
  async create(
    @Req() req: FastifyRequest,
    @Validate(VendorCreateInventoryDto) inputs: VendorCreateInventoryDto,
  ) {
    const user = (req as any).user ?? { sub: 'demo', role: 'vendor' };
    await this.service.create(user, inputs);
    return this.transformer.transform({ message: 'Success' });
  }
}