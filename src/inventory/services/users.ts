import { Injectable } from '@nestjs/common';
import { InventoryRepository } from '../repositories';
import { Paginate } from '@app/core/db/interfaces';
import { Inventory } from '../entities';
import { JwtUser } from '@app/core/guards/types';
import { VendorCreateInventoryDto, VendorGetInventoryDto } from '../dtos';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Categories } from '@app/src/taxonaomy/entities';
import { Brands } from '@app/src/brands/entities';
import { Users } from '@app/src/users/entities';

@Injectable()
export class VendorInventoryService {
  constructor(
    private readonly inventory: InventoryRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getMyInventory(
    user: JwtUser,
    payload: VendorGetInventoryDto,
  ): Promise<Paginate<Inventory>> {
    // In demo mode (no JWT), return all inventory
    const isDemoUser = !user || user.sub === 'demo';

    const [data, count] = await this.inventory.findAndCount({
      where: isDemoUser ? {} : { vendor: { uuid: user.sub } },
      order: { createdAt: 'DESC' },
      take: payload.perPage || 10,
      skip: payload.page || 0,
      relations: ['vendor', 'category', 'brand'],
    });

    return {
      data,
      meta: {
        page: payload.page || 0,
        perPage: payload.perPage || 10,
        total: count,
      },
    };
  }

  async create(
    user: JwtUser,
    payload: VendorCreateInventoryDto,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      const categoryRepo = manager.getRepository(Categories);
      const brandRepo = manager.getRepository(Brands);
      const usersRepo = manager.getRepository(Users);

      const vendor = await usersRepo.findOneOrFail({
        where: { uuid: user.sub },
      });

      const category = await categoryRepo.findOneOrFail({
        where: { uuid: payload.categoryId },
      });
      const brand = await brandRepo.findOneOrFail({
        where: { uuid: payload.brandId },
      });

      const inventory = invRepo.create({
        title: payload.title,
        description: payload.description,
        price: payload.price,
        stock: payload.stock,
        imageKeys: payload.imageKeys,
        vendor,
        category,
        brand,
      });

      await invRepo.save(inventory);
    });
  }
}