import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PermissionToGroup } from '../entities';

@Injectable()
export class PermissionToGroupRepository extends BaseRepository<PermissionToGroup> {
  constructor(dataSource: DataSource) {
    super(PermissionToGroup, dataSource);
  }
}
