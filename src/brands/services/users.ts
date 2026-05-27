import { Injectable } from '@nestjs/common';
import { Paginate } from '@app/core/db/interfaces';
import { BrandsRepository } from '../repositories';
import { UserGetBrandsDto } from '../dtos';
import { Like } from 'typeorm';
import { Brands } from '../entities';

@Injectable()
export class UserBrandsService {
  constructor(private readonly brands: BrandsRepository) {}

  async getBrands(payload: UserGetBrandsDto): Promise<Paginate<Brands>> {
    const where = payload.query
      ? [{ name: Like(`%${payload.query}%`) }]
      : undefined;
    const [data, count] = await this.brands.findAndCount({
      where,
      take: payload.perPage,
      skip: payload.page,
    });

    const meta = {
      page: payload.page,
      perPage: payload.perPage,
      total: count,
    };

    return { data, meta };
  }
}
