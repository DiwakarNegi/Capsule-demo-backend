import { Injectable } from '@nestjs/common';
import {
  AdminCreateUserDto,
  AdminDeleteUserDto,
  AdminGetUserByIdDto,
  AdminGetUsersDto,
  AdminUpdateProfileDto,
  AdminUpdateUserDto,
} from '../dtos';
import { JwtUser } from '@app/core/guards/types';
import { AdminsRepository, UsersRepository } from '../repositories';
import { Admins } from '../entities/admins';
import { Users } from '../entities';
import { pick } from 'remeda';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Roles, UserRoleMappings } from '@app/src/rbac/entities';
import { Paginate } from '@app/core/db/interfaces';

@Injectable()
export class AdminUserService {
  constructor(
    private readonly users: UsersRepository,
    private readonly admins: AdminsRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Admin profile is loaded from `admins` (JWT type=admin).
   * REPLACED: previously used UsersRepository with jwt.sub from users table.
   */
  async getProfile(user: JwtUser): Promise<Admins> {
    // OLD: return this.users.findOneOrFail({
    //   where: { uuid: user.sub },
    //   relations: ['userRoleMappings.role'],
    // });
    return this.admins.findOneOrFail({
      where: { uuid: user.sub, isActive: true },
    });
  }

  async updateProfile(
    user: JwtUser,
    payload: AdminUpdateProfileDto,
  ): Promise<void> {
    // OLD: await this.users.update({ uuid: user.sub }, pick(payload, [...]));
    await this.admins.update(
      { uuid: user.sub },
      pick(payload, ['name', 'profilePicture', 'countryCode', 'mobileNumber']),
    );
  }

  async getUsers(payload: AdminGetUsersDto): Promise<Paginate<Users>> {
    const where = payload.query
      ? [
          { email: Like(`%${payload.query}%`) },
          { name: Like(`%${payload.query}%`) },
          { username: Like(`%${payload.query}%`) },
        ]
      : undefined;
    const [data, count] = await this.users.findAndCount({
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

  async getUserById(payload: AdminGetUserByIdDto): Promise<Users> {
    return this.users.findOneOrFail({
      where: { uuid: payload.id },
      relations: ['userRoleMappings.role'],
    });
  }

  async createUser(payload: AdminCreateUserDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const userRepo: Repository<Users> = manager.getRepository(Users);
      const rolesRepo: Repository<Roles> = manager.getRepository(Roles);
      const userRoleRepo: Repository<UserRoleMappings> =
        manager.getRepository(UserRoleMappings);

      let user = userRepo.create({
        name: payload.name,
        email: payload.email,
        countryCode: payload.countryCode,
        mobileNumber: payload.mobileNumber,
      });
      user = await userRepo.save(user);

      const role = await rolesRepo.findOneOrFail({
        where: { uuid: 'admin' },
      });
      const userRoleMap = userRoleRepo.create({ user, role });

      await userRoleRepo.save(userRoleMap);
    });
  }

  async updateUser(payload: AdminUpdateUserDto): Promise<void> {
    await this.users.update(
      { uuid: payload.id },
      pick(payload, ['name', 'email', 'countryCode', 'mobileNumber']),
    );
  }

  async deleteUser(payload: AdminDeleteUserDto): Promise<void> {
    await this.users.delete({ uuid: payload.id });
  }

  async getVendors(payload: AdminGetUsersDto): Promise<Paginate<Users>> {
    const qb = this.users
      .createQueryBuilder('user')
      .innerJoin('user.userRoleMappings', 'urm')
      .innerJoin('urm.role', 'role')
      .where('role.uuid = :roleUuid')
      .setParameter('roleUuid', 'vendor');

    if (payload.query) {
      qb.andWhere(
        '(user.email LIKE :search OR user.name LIKE :search OR user.username LIKE :search)',
      ).setParameter('search', `%${payload.query}%`);
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip(payload.page * payload.perPage)
      .take(payload.perPage);

    const [data, count] = await qb.getManyAndCount();

    const meta = {
      page: payload.page,
      perPage: payload.perPage,
      total: count,
    };

    return { data, meta };
  }
}
