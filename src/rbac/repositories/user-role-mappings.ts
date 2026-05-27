import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRoleMappings } from '../entities';

@Injectable()
export class UserRoleMappingRepository extends BaseRepository<UserRoleMappings> {
  constructor(dataSource: DataSource) {
    super(UserRoleMappings, dataSource);
  }
}
