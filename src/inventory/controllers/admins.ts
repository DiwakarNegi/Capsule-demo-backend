import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { Allow, Validate } from '@app/core/decorators';
import { AdminInventoryService } from '../services';
import { InventoryTransformer } from '../transformers';
import {
  AdminCreateInventoryDto,
  AdminGetInventoryByIdDto,
  AdminGetInventoryDto,
  AdminUpdateInventoryDto,
} from '../dtos';

@Controller({
  path: 'admins',
  version: '1',
})
export class AdminInventoryController {
  constructor(
    private readonly service: AdminInventoryService,
    private readonly transformer: InventoryTransformer,
  ) {}

  @Allow("adminInventory:getAll") 
  @Get('/inventory')
  async getAll(@Validate(AdminGetInventoryDto) inputs: AdminGetInventoryDto) {
    const result = await this.service.getAll(inputs);
    return this.transformer.paginate(result);
  }

  @Allow("adminInventory:getById")
  @Get('/inventory/:id')
  async getById(
    @Validate(AdminGetInventoryByIdDto) inputs: AdminGetInventoryByIdDto,
  ) {
    const result = await this.service.getById(inputs);
    return this.transformer.transform(result);
  }

  @Allow("adminInventory:create")
  @Post('/inventory')
  async create(
    @Validate(AdminCreateInventoryDto) inputs: AdminCreateInventoryDto,
  ) {
    await this.service.create(inputs);
    return this.transformer.transform({ message: 'Success' });
  }

  @Allow("adminInventory:update")
  @Patch('/inventory/:id')
  async update(
    @Validate(AdminUpdateInventoryDto) inputs: AdminUpdateInventoryDto,
  ) {
    await this.service.update(inputs);
    return this.transformer.transform({ message: 'Success' });
  }

  @Allow("adminInventory:delete")
  @Delete('/inventory/:id')
  async delete(
    @Validate(AdminGetInventoryByIdDto) inputs: AdminGetInventoryByIdDto,
  ) {
    await this.service.delete(inputs);
    return this.transformer.transform({ message: 'Success' });
  }

  @Allow("adminInventory:getByBrandId")
  @Get('/vendors/:id/inventory')
  async getByBrandId(
    @Validate(AdminGetInventoryByIdDto) inputs: AdminGetInventoryByIdDto,
  ) {
    const result = await this.service.getByBrandId(inputs);
    return this.transformer.collection(result);
  }
}
