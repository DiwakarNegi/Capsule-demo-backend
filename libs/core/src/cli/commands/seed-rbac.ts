import { Injectable } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Permissions,
  PermissionGroups,
  PermissionToGroup,
} from '@app/src/rbac/entities';

// ---------------------------------------------------------------------------
// Canonical permission list — single source of truth.
// Format: <domain>:<action>  (lowercase)
// Every permission referenced in @Allow() across all controllers must appear here.
// ---------------------------------------------------------------------------
const PERMISSIONS: { name: string; description: string }[] = [
  // Vendor-facing inventory
  { name: 'inventory:read', description: 'Read own inventory items' },
  { name: 'inventory:create', description: 'Create an inventory item' },
  { name: 'inventory:update', description: 'Update an inventory item' },
  { name: 'inventory:delete', description: 'Delete an inventory item' },

  // Admin-facing inventory (separate namespace to allow finer control)
  {
    name: 'adminInventory:getAll',
    description: 'Admin: list all inventory items',
  },
  {
    name: 'adminInventory:getById',
    description: 'Admin: get inventory item by id',
  },
  { name: 'adminInventory:create', description: 'Admin: create inventory item' },
  { name: 'adminInventory:update', description: 'Admin: update inventory item' },
  { name: 'adminInventory:delete', description: 'Admin: delete inventory item' },
  {
    name: 'adminInventory:getByBrandId',
    description: 'Admin: get inventory by brand',
  },

  // Media
  {
    name: 'media:getUploadUrls',
    description: 'Request pre-signed S3 upload URLs',
  },

  // User (vendor) self-service
  { name: 'user:getProfile', description: 'Get own user profile' },
  { name: 'user:updateProfile', description: 'Update own user profile' },
  { name: 'user:deleteProfile', description: 'Delete own user profile' },

  // Admin user management
  { name: 'admin:getUsers', description: 'Admin: list all users' },
  { name: 'admin:getUserById', description: 'Admin: get user by id' },
  { name: 'admin:createUser', description: 'Admin: create a user' },
  { name: 'admin:updateUser', description: 'Admin: update a user' },
  { name: 'admin:deleteUser', description: 'Admin: delete a user' },
  {
    name: 'admin:updateUserStatus',
    description: 'Admin: enable / disable a user',
  },
  // Aliases requested by spec
  { name: 'inventory:getAll', description: 'Get all inventory (any vendor)' },
];

// ---------------------------------------------------------------------------
// System permission groups (act as role templates).
// These mirror the system roles: super, admin, vendor, user.
// The 'super' group is intentionally left empty — the guard bypasses
// permission checks when the user carries the 'super' role.
// ---------------------------------------------------------------------------
const GROUPS: string[] = ['super', 'admin', 'vendor', 'user'];

// ---------------------------------------------------------------------------
// Permission → Group mapping.
// Key  = group name.
// Value = permission names that belong to this group.
// If a permission name is not found in the DB the seed fails fast (by design).
// ---------------------------------------------------------------------------
const GROUP_PERMISSIONS: Record<string, string[]> = {
  vendor: [
    'inventory:read',
    'inventory:create',
    'inventory:update',
    'inventory:delete',
    'media:getUploadUrls',
    'user:getProfile',
    'user:updateProfile',
    'user:deleteProfile',
  ],
  user: ['user:getProfile'],
  admin: [
    'inventory:getAll',
    'admin:getUsers',
    'admin:getUserById',
    'admin:createUser',
    'admin:updateUser',
    'admin:deleteUser',
    'admin:updateUserStatus',
    'adminInventory:getAll',
    'adminInventory:getById',
    'adminInventory:create',
    'adminInventory:update',
    'adminInventory:delete',
    'adminInventory:getByBrandId',
    'media:getUploadUrls',
  ],
  // super: guard short-circuits via roleSet.has('super') — no explicit mappings needed
  super: [],
};

@Command({ name: 'seed:rbac', description: 'Seed RBAC permissions and permission groups (idempotent)' })
@Injectable()
export class SeedRbacCommand extends CommandRunner {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log('\n[seed:rbac] Starting RBAC seed...\n');

    await this.dataSource.transaction(async (manager) => {
      const permRepo: Repository<Permissions> = manager.getRepository(Permissions);
      const groupRepo: Repository<PermissionGroups> = manager.getRepository(PermissionGroups);
      const ptgRepo: Repository<PermissionToGroup> = manager.getRepository(PermissionToGroup);

      // -----------------------------------------------------------------------
      // Step 1 — Seed permissions (upsert on unique `name` column)
      // -----------------------------------------------------------------------
      console.log(`[seed:rbac] Seeding ${PERMISSIONS.length} permissions...`);

      // TypeORM upsert: safe to run multiple times; conflicts on `name` are skipped.
      await permRepo.upsert(
        PERMISSIONS.map((p) => permRepo.create(p)),
        { conflictPaths: ['name'], skipUpdateIfNoValuesChanged: true },
      );

      // Reload all permissions into a name→entity map for later lookups.
      const allPerms = await permRepo.find();
      const permMap = new Map<string, Permissions>(
        allPerms.map((p) => [p.name, p]),
      );
      console.log(`[seed:rbac] Permissions ready (${allPerms.length} total).`);

      // -----------------------------------------------------------------------
      // Step 2 — Seed permission groups (name is NOT unique in schema,
      //           so we use a manual "find or create" pattern)
      // -----------------------------------------------------------------------
      console.log(`[seed:rbac] Seeding ${GROUPS.length} permission groups...`);

      const groupMap = new Map<string, PermissionGroups>();
      for (const groupName of GROUPS) {
        let group = await groupRepo.findOne({ where: { name: groupName } });
        if (!group) {
          group = await groupRepo.save(groupRepo.create({ name: groupName }));
          console.log(`[seed:rbac]   Created group: ${groupName}`);
        } else {
          console.log(`[seed:rbac]   Group already exists: ${groupName}`);
        }
        groupMap.set(groupName, group);
      }

      // -----------------------------------------------------------------------
      // Step 3 — Map permissions → groups (idempotent, fail-fast on missing perms)
      // -----------------------------------------------------------------------
      console.log('[seed:rbac] Mapping permissions to groups...');

      for (const [groupName, permNames] of Object.entries(GROUP_PERMISSIONS)) {
        const group = groupMap.get(groupName);
        if (!group) {
          throw new Error(`[seed:rbac] FATAL: group "${groupName}" not found after seeding. Aborting.`);
        }

        for (const permName of permNames) {
          const permission = permMap.get(permName);
          if (!permission) {
            // Fail fast — if a permission referenced here is not in PERMISSIONS list above, it's a bug.
            throw new Error(
              `[seed:rbac] FATAL: permission "${permName}" (mapped to group "${groupName}") ` +
              `was not found in DB. Add it to the PERMISSIONS array first.`,
            );
          }

          // Check for existing mapping before inserting (unique index guard).
          const existing = await ptgRepo.findOne({
            where: { group: { id: group.id }, permission: { id: permission.id } },
          });

          if (!existing) {
            await ptgRepo.save(ptgRepo.create({ group, permission }));
            console.log(`[seed:rbac]   Mapped ${permName} → ${groupName}`);
          }
          // else: mapping already exists — skip silently (idempotent)
        }
      }
    });

    console.log('\n[seed:rbac] Seed complete.\n');
    process.exit(0);
  }
}
