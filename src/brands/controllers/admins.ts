import { Validate } from '@app/core/decorators';
import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { Allow } from '@app/core/decorators';
import { AdminBrandsService } from '../services';
import {
  AdminCreateBrandDto,
  AdminGetBrandDetailsDto,
  AdminGetBrandsDto,
  AdminUpdateBrandDto,
  AdminDeleteBrandDto,
} from '../dtos';
import { BrandsTransformer } from '../transformers';

@Controller({
  path: 'admins/brands',
  version: '1',
})
export class AdminBrandsController {
  constructor(
    private readonly service: AdminBrandsService,
    private transformer: BrandsTransformer,
  ) {}

  @Allow(['super', 'admin'])
  @Get()
  async getCategories(@Validate(AdminGetBrandsDto) inputs: AdminGetBrandsDto) {
    const response = await this.service.getBrands(inputs);
    return this.transformer.paginate(response);
  }

  @Allow(['super', 'admin'])
  @Get(':id')
  async getCategoryDetails(
    @Validate(AdminGetBrandDetailsDto) inputs: AdminGetBrandDetailsDto,
  ) {
    const response = await this.service.getBrandDetails(inputs);
    return this.transformer.transform(response);
  }

  @Allow(['super', 'admin'])
  @Post()
  async createCategory(
    @Validate(AdminCreateBrandDto) inputs: AdminCreateBrandDto,
  ) {
    await this.service.createBrand(inputs);
    return this.transformer.transform({ message: 'Success' });
  }

  @Allow(['super', 'admin'])
  @Patch(':id')
  async updateCategory(
    @Validate(AdminUpdateBrandDto) inputs: AdminUpdateBrandDto,
  ) {
    await this.service.updateBrand(inputs);
    return this.transformer.transform({ message: 'Success' });
  }

  @Allow(['super', 'admin'])
  @Delete(':id')
  async deleteCategory(
    @Validate(AdminDeleteBrandDto) inputs: AdminDeleteBrandDto,
  ) {
    await this.service.deleteBrand(inputs);
    return this.transformer.transform({ message: 'Brand Deleted' });
  }
}
