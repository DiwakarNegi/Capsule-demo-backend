import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/allow';
import type { FastifyRequest } from 'fastify';
import type { JwtUser } from './types';
import { UsersRepository } from '@app/src/users/repositories';
import { AdminsRepository } from '@app/src/users/repositories/admins';
import { ConfigType, getConfigToken } from '@nestjs/config';
import appConfig from '@config/app';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersRepository,
    private readonly admins: AdminsRepository,
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const jwtUser = request.user as JwtUser | undefined;

    if (!jwtUser?.sub) throw new ForbiddenException('Invalid auth context');

    const principalType = jwtUser.type ?? 'user';

    if (principalType === 'admin') {
      return this.authorizeAdmin(jwtUser, required);
    }

    return this.authorizeUser(jwtUser, required);
  }

  /**
   * Admin principals live in `admins` — not `users` / userRoleMappings.
   * Role strings `admin` / `super` on @Allow() map to admin-table authorization.
   */
  private async authorizeAdmin(
    jwtUser: JwtUser,
    required: string[],
  ): Promise<boolean> {
    const admin = await this.admins.findOne({
      where: { uuid: jwtUser.sub, isActive: true },
    });

    if (!admin) {
      this.logger.warn(
        `[PermissionGuard] admin sub=${jwtUser.sub} not found or inactive`,
      );
      throw new ForbiddenException('Admin not found');
    }

    const norm = (s: string) => s.trim().toLowerCase();
    const requiredRoles = required
      .filter((x) => typeof x === 'string' && !x.includes(':'))
      .map(norm);
    const requiredPerms = required
      .filter((x) => typeof x === 'string' && x.includes(':'))
      .map(norm);

    if (requiredPerms.length > 0) {
      this.logger.warn(
        `[PermissionGuard] admin ${admin.uuid} denied — permission strings require user principal`,
      );
      throw new ForbiddenException(
        `Missing required access: ${required.join(', ')}`,
      );
    }

    if (requiredRoles.length === 0) {
      return true;
    }

    const superAdminUuid = this.app.superAdmin?.uuid?.trim().toLowerCase();
    const isSuperAdmin =
      !!superAdminUuid && norm(admin.uuid) === superAdminUuid;

    const requiresSuperOnly =
      requiredRoles.includes('super') && !requiredRoles.includes('admin');
    const requiresAdminOrSuper =
      requiredRoles.includes('admin') || requiredRoles.includes('super');

    const allowed =
      (requiresSuperOnly && isSuperAdmin) ||
      (requiresAdminOrSuper && !requiresSuperOnly) ||
      (requiresAdminOrSuper && isSuperAdmin);

    if (!allowed) {
      this.logger.warn(
        `[PermissionGuard] DENIED admin=${admin.uuid} required=[${required.join(', ')}]`,
      );
      throw new ForbiddenException(
        `Missing required access: ${required.join(', ')}`,
      );
    }

    return true;
  }

  /** User/vendor principals — roles and permissions from `users` + RBAC tables. */
  private async authorizeUser(
    jwtUser: JwtUser,
    required: string[],
  ): Promise<boolean> {
    const user = await this.users.findOne({
      where: { uuid: jwtUser.sub },
      relations: ['userRoleMappings.role', 'userPermissions.permission'],
    });

    // -------------------------------------------------------------------------
    // REPLACED: Admins are no longer looked up in `users` for authorization.
    // Legacy admin JWTs (user row + super/admin role) still work until tokens expire.
    // -------------------------------------------------------------------------
    // Admin fallback:
    // Admins are regular users with 'super'/'admin' roles in the same `users` table,
    // if (!user) { const admin = await this.adminsRepo.findOne(...); if (admin) return true; }
    // -------------------------------------------------------------------------

    if (!user) {
      this.logger.warn(
        `[PermissionGuard] user sub=${jwtUser.sub} not found in users table`,
      );
      throw new ForbiddenException('User not found');
    }

    const userRoles = (user.userRoleMappings ?? [])
      .map((m) => m?.role?.uuid)
      .filter((r): r is string => typeof r === 'string' && r.length > 0);

    const userPermissionNames = (user.userPermissions ?? [])
      .map((m) => m?.permission?.name)
      .filter((p): p is string => typeof p === 'string' && p.length > 0);

    const norm = (s: string) => s.trim().toLowerCase();
    const requiredRoles = required
      .filter((x) => typeof x === 'string' && !x.includes(':'))
      .map(norm);
    const requiredPerms = required
      .filter((x) => typeof x === 'string' && x.includes(':'))
      .map(norm);

    const roleSet = new Set(userRoles.map(norm));
    const permSet = new Set(userPermissionNames.map(norm));

    if (roleSet.has('super')) return true;

    const hasRole =
      requiredRoles.length === 0
        ? false
        : requiredRoles.some((r) => roleSet.has(r));
    const hasPerm =
      requiredPerms.length === 0
        ? false
        : requiredPerms.some((p) => permSet.has(p));

    const allowed =
      (requiredRoles.length > 0 && hasRole) ||
      (requiredPerms.length > 0 && hasPerm);

    if (!allowed) {
      this.logger.warn(
        `[PermissionGuard] DENIED userId=${user.id} required=[${required.join(', ')}] ` +
          `roles=[${userRoles.join(', ')}] perms=[${userPermissionNames.join(', ')}]`,
      );
      throw new ForbiddenException(
        `Missing required access: ${required.join(', ')}`,
      );
    }

    return true;
  }
}

/*
Previous implementation (kept for reference):

  canActivate(context: ExecutionContext): Promise<boolean> {
    ...
    const user = await this.users.findOne({ where: { uuid: jwtUser.sub }, ... });
    if (!user) {
      console.warn(`[PermissionGuard] sub=${jwtUser.sub} not found in users table.`);
      throw new ForbiddenException('User not found');
    }
    ...
  }
*/
