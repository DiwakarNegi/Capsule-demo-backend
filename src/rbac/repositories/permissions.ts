import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Permissions } from '../entities';

@Injectable()
export class PermissionsRepository extends BaseRepository<Permissions> {
  constructor(dataSource: DataSource) {
    super(Permissions, dataSource);
  }
}
