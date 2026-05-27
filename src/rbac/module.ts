import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PermissionGroups,
  PermissionToGroup,
  Permissions,
  Roles,
  UserPermissions,
  UserRoleMappings,
} from './entities';
import {
  PermissionGroupsRepository,
  PermissionToGroupRepository,
  PermissionsRepository,
  RolesRepository,
  UserPermissionsRepository,
  UserRoleMappingRepository,
} from './repositories';
import { AdminRoleController } from './controllers';
import { AdminRoleService } from './services';
import { RoleTransformer } from './transformers';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Roles,
      UserRoleMappings,
      Permissions,
      PermissionGroups,
      PermissionToGroup,
      UserPermissions,
    ]),
  ],
  controllers: [AdminRoleController],
  providers: [
    RolesRepository,
    UserRoleMappingRepository,
    PermissionsRepository,
    PermissionGroupsRepository,
    PermissionToGroupRepository,
    UserPermissionsRepository,
    AdminRoleService,
    RoleTransformer,
  ],
  exports: [
    RolesRepository,
    UserRoleMappingRepository,
    PermissionsRepository,
    PermissionGroupsRepository,
    PermissionToGroupRepository,
    UserPermissionsRepository,
  ],
})
export class RBACModule {}
