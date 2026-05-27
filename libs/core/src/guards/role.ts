// import {
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import type { FastifyRequest } from 'fastify';
// import { Reflector } from '@nestjs/core';
// import { ROLE_KEY } from '../decorators/allow';
// import { UsersRepository } from '@app/src/users/repositories';
// import { JwtUser } from './types';

// @Injectable()
// export class RoleGuard {
//   constructor(
//     private reflector: Reflector,
//     private readonly users: UsersRepository,
//   ) {}
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const roles = this.reflector.get<string[]>(ROLE_KEY, context.getHandler());
//     if (!roles) {
//       return false;
//     }
//     const request = context.switchToHttp().getRequest<FastifyRequest>();
//     const userFromRequest = request.user;
//     const user = await this.users.findOne({
//       where: { uuid: userFromRequest.sub },
//       relations: ['userRoleMappings.role'],
//     });
//     if (!user) {
//       return false;
//     }
//     const userRoles = user.userRoleMappings.map((ur) => ur.role.uuid);

//     if (!roles || roles.length === 0) return true;
//     if (!userRoles || userRoles.length === 0) return false;

//     const norm = (s: string) => s.trim().toLowerCase();
//     const allowed = new Set(roles.map(norm));

//     for (const r of userRoles) {
//       if (allowed.has(norm(r))) return true;
//     }
//     return false;
//   }
//   handleRequest<TUser = JwtUser>(err: any, user: any): TUser {
//     if (err || !user) {
//       throw err instanceof Error ? err : new UnauthorizedException();
//     }
//     return user as TUser;
//   }
// }
