import { Injectable } from '@nestjs/common';
import { Like } from 'typeorm';
import { Paginate } from '@app/core/db/interfaces';
import { BrandsRepository } from '../repositories';
import {
  AdminGetBrandsDto,
  AdminGetBrandDetailsDto,
  AdminCreateBrandDto,
  AdminUpdateBrandDto,
  AdminDeleteBrandDto,
} from '../dtos';
import { pick } from 'remeda';
import { Brands } from '../entities';

@Injectable()
export class AdminBrandsService {
  constructor(private readonly brands: BrandsRepository) {}

  async getBrands(payload: AdminGetBrandsDto): Promise<Paginate<Brands>> {
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

  async getBrandDetails(payload: AdminGetBrandDetailsDto): Promise<Brands> {
    return this.brands.findOneOrFail({
      where: { uuid: payload.id },
    });
  }

  async createBrand(payload: AdminCreateBrandDto): Promise<void> {
    await this.brands.createAndSave(payload);
  }

  async updateBrand(payload: AdminUpdateBrandDto): Promise<void> {
    const featured = JSON.stringify(payload.featured);
    await this.brands.update(
      { uuid: payload.id },
      pick({ ...payload, featured }, ['name', 'thumbnail', 'featured']),
    );
  }

  async deleteBrand(payload: AdminDeleteBrandDto): Promise<void> {
    await this.brands.delete({ uuid: payload.id });
  }
}
