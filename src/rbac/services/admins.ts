import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Like } from 'typeorm';
import { Roles } from '@app/src/rbac/entities';
import { Paginate } from '@app/core/db/interfaces';
import { RolesRepository } from '../repositories';
import { AdminGetRoleByIdDto, AdminGetRolesDto } from '../dtos';

@Injectable()
export class AdminRoleService {
  constructor(
    private readonly roles: RolesRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getRoles(payload: AdminGetRolesDto): Promise<Paginate<Roles>> {
    const where = payload.query
      ? [{ name: Like(`%${payload.query}%`) }]
      : undefined;
    const [data, count] = await this.roles.findAndCount({
      where,
      relations: ['userRoleMappings.role'],
      take: payload.perPage,
      skip: payload.page,
    });

    const meta = {
      page: payload.page,
      perPage: payload.perPage,
      total: count,
    };

    return { data, meta };
  }

  async getRoleById(payload: AdminGetRoleByIdDto): Promise<Roles> {
    return this.roles.findOneOrFail({
      where: { uuid: payload.id },
      relations: ['userRoleMappings.role'],
    });
  }
}
