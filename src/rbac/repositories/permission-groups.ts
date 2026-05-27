import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PermissionGroups } from '../entities';

@Injectable()
export class PermissionGroupsRepository extends BaseRepository<PermissionGroups> {
  constructor(dataSource: DataSource) {
    super(PermissionGroups, dataSource);
  }
}
