import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Roles } from '../entities';

@Injectable()
export class RolesRepository extends BaseRepository<Roles> {
  constructor(dataSource: DataSource) {
    super(Roles, dataSource);
  }
}
