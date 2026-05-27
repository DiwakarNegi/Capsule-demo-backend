import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Users } from '../entities';

@Injectable()
export class UsersRepository extends BaseRepository<Users> {
  constructor(dataSource: DataSource) {
    super(Users, dataSource);
  }
}
