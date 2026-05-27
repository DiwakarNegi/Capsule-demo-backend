import { Validate } from '@app/core/decorators';
import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { Allow } from '@app/core/decorators';
import { AdminTaxonomiesService } from '../services';
import {
  AdminCreateTaxonomyDto,
  AdminDeleteTaxonomyDto,
  AdminGetTaxonomiesDto,
  AdminGetTaxonomyDetailsDto,
  AdminUpdateTaxonomyDto,
} from '../dtos';
import { TaxonomyTransformer } from '../transformers';

@Controller({
  path: 'admins/categories',
  version: '1',
})
export class AdminTaxonomiesController {
  constructor(
    private readonly service: AdminTaxonomiesService,
    private transformer: TaxonomyTransformer,
  ) {}

  @Allow(['super', 'admin'])
  @Get()
  async getCategories(
    @Validate(AdminGetTaxonomiesDto) inputs: AdminGetTaxonomiesDto,
  ) {
    const response = await this.service.getCategories(inputs);
    return this.transformer.paginate(response);
  }

  @Allow(['super', 'admin'])
  @Get(':id')
  async getCategoryDetails(
    @Validate(AdminGetTaxonomyDetailsDto) inputs: AdminGetTaxonomyDetailsDto,
  ) {
    const response = await this.service.getCategoryDetails(inputs);
    return this.transformer.transform(response);
  }

  @Allow(['super', 'admin'])
  @Post()
  async createCategory(
    @Validate(AdminCreateTaxonomyDto) inputs: AdminCreateTaxonomyDto,
  ) {
    await this.service.createCategory(inputs);
    return this.transformer.transform({ message: 'Success' });
  }

  @Allow(['super', 'admin'])
  @Patch(':id')
  async updateCategory(
    @Validate(AdminUpdateTaxonomyDto) inputs: AdminUpdateTaxonomyDto,
  ) {
    await this.service.updateCategory(inputs);
    return this.transformer.transform({ message: 'Success' });
  }

  @Allow(['super', 'admin'])
  @Delete(':id')
  async deleteCategory(
    @Validate(AdminDeleteTaxonomyDto) inputs: AdminDeleteTaxonomyDto,
  ) {
    await this.service.deleteCategory(inputs);
    return this.transformer.transform({ message: 'Taxonomy Deleted' });
  }
}
