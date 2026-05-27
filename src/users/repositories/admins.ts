import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Admins } from '../entities/admins';

/**
 * Data access for the `admins` table only.
 * Used by admin auth and admin profile flows — never for customer/user login.
 */
@Injectable()
export class AdminsRepository extends BaseRepository<Admins> {
  constructor(dataSource: DataSource) {
    super(Admins, dataSource);
  }
}
