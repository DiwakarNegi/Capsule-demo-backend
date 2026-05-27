import { Validate } from '@app/core/decorators';
import { Controller, Get } from '@nestjs/common';
import { Allow } from '@app/core/decorators';
import { TaxonomyTransformer } from '../transformers';
import { UserGetTaxonomiesDto } from '../dtos';
import { UserTaxonomyService } from '../services';

@Controller({
  version: '1',
})
export class UserTaxonomyController {
  constructor(
    private readonly service: UserTaxonomyService,
    private transformer: TaxonomyTransformer,
  ) {}

  @Allow(['vendor'])
  @Get('categories')
  async getCategories(
    @Validate(UserGetTaxonomiesDto) inputs: UserGetTaxonomiesDto,
  ) {
    const response = await this.service.getCategories(inputs);
    return this.transformer.paginate(response);
  }
}
