import { Injectable } from '@nestjs/common';
import { Paginate } from '@app/core/db/interfaces';
import { CategoriesRepository } from '../repositories';
import { UserGetTaxonomiesDto } from '../dtos';
import { Categories } from '../entities';
import { Like } from 'typeorm';

@Injectable()
export class UserTaxonomyService {
  constructor(private readonly category: CategoriesRepository) {}

  async getCategories(
    payload: UserGetTaxonomiesDto,
  ): Promise<Paginate<Categories>> {
    const where = payload.query
      ? [{ name: Like(`%${payload.query}%`) }]
      : undefined;
    const [data, count] = await this.category.findAndCount({
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
