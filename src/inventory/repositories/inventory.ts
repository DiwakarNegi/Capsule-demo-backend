import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Inventory } from '../entities';

@Injectable()
export class InventoryRepository extends BaseRepository<Inventory> {
  constructor(dataSource: DataSource) {
    super(Inventory, dataSource);
  }
}
