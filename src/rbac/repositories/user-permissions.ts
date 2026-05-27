import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserPermissions } from '../entities';

@Injectable()
export class UserPermissionsRepository extends BaseRepository<UserPermissions> {
  constructor(dataSource: DataSource) {
    super(UserPermissions, dataSource);
  }
}
