import { Injectable } from '@nestjs/common';
import { Like } from 'typeorm';
import { Categories } from '@app/src/taxonaomy/entities';
import { Paginate } from '@app/core/db/interfaces';
import { CategoriesRepository } from '../repositories';
import {
  AdminGetTaxonomyDetailsDto,
  AdminGetTaxonomiesDto,
  AdminCreateTaxonomyDto,
  AdminUpdateTaxonomyDto,
  AdminDeleteTaxonomyDto,
} from '../dtos';
import { pick } from 'remeda';

@Injectable()
export class AdminTaxonomiesService {
  constructor(private readonly category: CategoriesRepository) {}

  async getCategories(
    payload: AdminGetTaxonomiesDto,
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

  async getCategoryDetails(
    payload: AdminGetTaxonomyDetailsDto,
  ): Promise<Categories> {
    return this.category.findOneOrFail({
      where: { uuid: payload.id },
    });
  }

  async createCategory(payload: AdminCreateTaxonomyDto): Promise<void> {
    await this.category.createAndSave(payload);
  }

  async updateCategory(payload: AdminUpdateTaxonomyDto): Promise<void> {
    await this.category.update({ uuid: payload.id }, pick(payload, ['name']));
  }

  async deleteCategory(payload: AdminDeleteTaxonomyDto): Promise<void> {
    await this.category.delete({ uuid: payload.id });
  }
}
