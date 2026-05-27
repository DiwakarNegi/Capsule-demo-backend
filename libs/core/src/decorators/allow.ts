import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtGuard, PermissionGuard } from '../guards';

export const PERMISSION_KEY = 'permissions';

export function Allow(permissions: string | string[]) {
  const required = Array.isArray(permissions) ? permissions : [permissions];
  return applyDecorators(
    SetMetadata(PERMISSION_KEY, required),
    // Previous implementation (kept for reference):
    // UseGuards(JwtGuard, RoleGuard, PermissionGuard),
    UseGuards(JwtGuard, PermissionGuard),
  );
}
