import { Validate } from '@app/core/decorators';
import { Controller, Get } from '@nestjs/common';
import { Allow } from '@app/core/decorators';
import { BrandsTransformer } from '../transformers';
import { UserGetBrandsDto } from '../dtos';
import { UserBrandsService } from '../services';

@Controller({
  path: 'brands',
  version: '1',
})
export class UserBrandsController {
  constructor(
    private readonly service: UserBrandsService,
    private transformer: BrandsTransformer,
  ) {}

  @Allow(['user'])
  @Get()
  async getBrands(@Validate(UserGetBrandsDto) inputs: UserGetBrandsDto) {
    const response = await this.service.getBrands(inputs);
    return this.transformer.paginate(response);
  }
}
