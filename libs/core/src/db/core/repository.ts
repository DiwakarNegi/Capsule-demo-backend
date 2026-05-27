import {
  DataSource,
  DeepPartial,
  EntityTarget,
  FindManyOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  protected readonly entity: EntityTarget<T>;

  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
    this.entity = entity;
  }

  async createAndSave(partial: DeepPartial<T>): Promise<T> {
    const entity = this.create(partial);
    return this.save(entity);
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.count({ where });
    return count > 0;
  }

  async paginate(
    opts: Omit<FindManyOptions<T>, 'skip' | 'take'> & {
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: T[];
    meta: { page: number; limit: number; total: number; pageCount: number };
  }> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const data = await this.find({
      ...opts,
      skip: (page - 1) * limit,
      take: limit,
    });
    const pageCount = Math.ceil(data.length / limit);
    return { data, meta: { page, limit, total: data.length, pageCount } };
  }
}
