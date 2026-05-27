import {
  Roles,
  UserRoleMappings,
  UserPermissions,
  Permissions,
  PermissionGroups,
  PermissionToGroup,
} from '@app/src/rbac/entities';
import { Users } from '@app/src/users/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  InitSuperAdminCommand,
  InitRolesCommand,
  InitPromptsCommand,
  SeedRbacCommand,
} from './commands';
import { DbModule } from '../db';
import { CoreModule } from '../module';
import { Prompts } from '@app/src/prompts/entities';

@Module({
  imports: [
    CoreModule,
    DbModule,
    TypeOrmModule.forFeature([
      Users,
      Roles,
      UserRoleMappings,
      Prompts,
      UserPermissions,
      Permissions,
      PermissionGroups,
      PermissionToGroup,
    ]),
  ],
  providers: [InitRolesCommand, InitSuperAdminCommand, InitPromptsCommand, SeedRbacCommand],
  exports: [],
})
export class CliModule {}
