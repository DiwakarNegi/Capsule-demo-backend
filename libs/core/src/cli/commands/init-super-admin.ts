import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType, getConfigToken } from '@nestjs/config';
import appConfig from '@config/app';
import { Command, CommandRunner } from 'nest-commander';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Admins } from '@app/src/users/entities/admins';

/**
 * Seeds the super admin into the `admins` table (not `users`).
 *
 * REPLACED: Previously inserted into `users` + userRoleMappings with role `super`.
 * Run after migrations: `npm run init:super-admin` (or your CLI entry).
 */
@Command({ name: 'init:super-admin', description: 'Initialise application' })
@Injectable()
export class InitSuperAdminCommand extends CommandRunner {
  private readonly logger = new Logger(InitSuperAdminCommand.name);

  constructor(
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();
  }

  async run(): Promise<void> {
    const cfg = this.app.superAdmin;
    if (!cfg?.email || !cfg?.uuid) {
      this.logger.error('Super admin not defined in config (SUPER_ADMIN_EMAIL, SUPER_ADMIN_UUID)');
      process.exit(1);
    }

    this.logger.log('Inserting super admin into admins table...');

    // -----------------------------------------------------------------------
    // OLD: users table + RBAC role mapping
    // -----------------------------------------------------------------------
    // await this.dataSource.transaction(async (manager) => {
    //   const usersRepo = manager.getRepository(Users);
    //   const superAdmin = usersRepo.create(this.app.superAdmin);
    //   await usersRepo.save(superAdmin);
    //   const role = await rolesRepo.findOneOrFail({ where: { uuid: 'super' } });
    //   await userRoleRepo.save(userRoleRepo.create({ user: superAdmin, role }));
    // });
    // -----------------------------------------------------------------------

    await this.dataSource.transaction(async (manager) => {
      const adminsRepo: Repository<Admins> = manager.getRepository(Admins);

      const existing = await adminsRepo.findOne({
        where: [{ uuid: cfg.uuid }, { email: cfg.email }],
      });

      if (existing) {
        this.logger.warn(
          `Super admin already exists (uuid=${existing.uuid}). Skipping insert.`,
        );
        return;
      }

      const admin = adminsRepo.create({
        uuid: cfg.uuid,
        name: cfg.name,
        email: cfg.email,
        countryCode: cfg.countryCode,
        mobileNumber: cfg.mobileNumber,
        isActive: true,
      });

      await adminsRepo.save(admin);
      this.logger.log(`Super admin created uuid=${admin.uuid} email=${admin.email}`);
    });

    process.exit(0);
  }
}
