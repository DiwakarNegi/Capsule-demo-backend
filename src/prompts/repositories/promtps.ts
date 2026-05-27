import { BaseRepository } from '@app/core/db';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Prompts } from '../entities';

@Injectable()
export class PromptsRepository extends BaseRepository<Prompts> {
  constructor(dataSource: DataSource) {
    super(Prompts, dataSource);
  }
}
