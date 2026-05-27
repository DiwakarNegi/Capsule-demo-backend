import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Brands } from '../entities';

@Injectable()
export class BrandsRepository extends BaseRepository<Brands> {
  constructor(dataSource: DataSource) {
    super(Brands, dataSource);
  }
}
