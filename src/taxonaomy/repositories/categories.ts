import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Categories } from '../entities';

@Injectable()
export class CategoriesRepository extends BaseRepository<Categories> {
  constructor(dataSource: DataSource) {
    super(Categories, dataSource);
  }
}
