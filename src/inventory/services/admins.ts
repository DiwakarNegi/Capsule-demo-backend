import { Injectable } from '@nestjs/common';
import { Paginate } from '@app/core/db/interfaces';
import { InventoryRepository } from '../repositories';
import { DataSource, FindOptionsWhere, Like } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Inventory } from '../entities';
import {
  AdminCreateInventoryDto,
  AdminGetInventoryByIdDto,
  AdminGetInventoryDto,
  AdminUpdateInventoryDto,
} from '../dtos';
import { Users } from '@app/src/users/entities';
import { pick } from 'remeda';
import { Categories } from '@app/src/taxonaomy/entities';
import { Brands } from '@app/src/brands/entities';
import { UsersRepository } from '@app/src/users/repositories';
import { BrandsRepository } from '@app/src/brands/repositories';
import { CategoriesRepository } from '@app/src/taxonaomy/repositories';

@Injectable()
export class AdminInventoryService {
  constructor(
    private readonly inventory: InventoryRepository,
    private readonly vendor: UsersRepository,
    private readonly brands: BrandsRepository,
    private readonly categories: CategoriesRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getAll(payload: AdminGetInventoryDto): Promise<Paginate<Inventory>> {
    const where: FindOptionsWhere<Inventory> = {};

    if (payload.query) {
      where.title = Like(`%${payload.query}%`);
    }

    if (payload.vendor) {
      const v = await this.vendor.findOneByOrFail({ uuid: payload.vendor });
      where.vendorId = v.id;
    }

    if (payload.brand) {
      const b = await this.brands.findOneByOrFail({ uuid: payload.brand });
      where.brandId = b.id;
    }

    if (payload.category) {
      const c = await this.categories.findOneByOrFail({
        uuid: payload.category,
      });
      where.categoryId = c.id;
    }

    const [data, count] = await this.inventory.findAndCount({
      where,
      take: payload.perPage,
      skip: payload.page * payload.perPage,
      relations: ['vendor', 'brand'],
    });

    return {
      data,
      meta: {
        page: payload.page,
        perPage: payload.perPage,
        total: count,
      },
    };
  }

  async getById(payload: AdminGetInventoryByIdDto): Promise<Inventory> {
    return this.inventory.findOneOrFail({
      where: { uuid: payload.id },
      relations: ['category', 'brand', 'vendor'],
    });
  }

  async create(payload: AdminCreateInventoryDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      const usersRepo = manager.getRepository(Users);
      const categoryRepo = manager.getRepository(Categories);
      const brandRepo = manager.getRepository(Brands);

      const { categoryId, brandId, ...invPayload } = payload;

      const vendor = await usersRepo.findOneOrFail({
        where: { uuid: 'super-admin' },
      });

      const category = await categoryRepo.findOneOrFail({
        where: { uuid: categoryId },
      });

      const brand = await brandRepo.findOneOrFail({
        where: { uuid: brandId },
      });

      const item = invRepo.create({
        ...invPayload,
        vendor,
        category,
        brand,
      });

      await invRepo.save(item);
    });
  }

  async update(payload: AdminUpdateInventoryDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      const categoryRepo = manager.getRepository(Categories);
      const brandRepo = manager.getRepository(Brands);
      const usersRepo = manager.getRepository(Users);

      const { id, ...restPayload } = payload;

      const inventory = await invRepo.findOneOrFail({
        where: { uuid: id },
        relations: ['category', 'brand', 'vendor'],
      });

      const category = await categoryRepo.findOneOrFail({
        where: { uuid: payload.categoryId },
      });

      const brand = await brandRepo.findOneOrFail({
        where: { uuid: payload.brandId },
      });

      const vendor = await usersRepo.findOneOrFail({
        where: { uuid: 'super-admin' },
      });

      // merge scalar fields + resolved relations
      Object.assign(inventory, restPayload, {
        category,
        brand,
        vendor,
      });

      // save only allowed fields (same style as your template)
      await invRepo.save(
        pick(inventory, [
          'id',
          'uuid',
          'title',
          'description',
          'price',
          'stock',
          'imageKeys',
          'category',
          'brand',
          'vendor',
        ]),
      );
    });
  }

  async delete(payload: AdminGetInventoryByIdDto): Promise<void> {
    await this.inventory.delete({ uuid: payload.id });
  }

  async getByBrandId(payload: AdminGetInventoryByIdDto): Promise<Inventory[]> {
    const where: FindOptionsWhere<Inventory> = {};
    const brand = await this.brands.findOneOrFail({
      where: { uuid: payload.id },
    });

    where.brandId = brand.id;

    if (payload.category) {
      const c = await this.categories.findOneByOrFail({
        uuid: payload.category,
      });
      where.categoryId = c.id;
    }

    return this.inventory.find({
      where,
      relations: ['category', 'brand'],
    });
  }
}
