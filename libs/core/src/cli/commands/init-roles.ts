import { Inject, Injectable } from '@nestjs/common';
import { ConfigType, getConfigToken } from '@nestjs/config';
import appConfig from '@config/app';
import { Command, CommandRunner } from 'nest-commander';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Roles } from '@app/src/rbac/entities';

@Command({ name: 'init:roles', description: 'Initialise Roles' })
@Injectable()
export class InitRolesCommand extends CommandRunner {
  constructor(
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();
  }

  async run(): Promise<void> {
    if (!Array.isArray(this.app.sysRoles) || this.app.sysRoles.length === 0) {
      console.log('No sysRoles configured; nothing to do.');
      process.exit(0);
    }

    console.log('Inserting roles...');
    await this.dataSource.transaction(async (manager) => {
      const rolesRepo: Repository<Roles> = manager.getRepository(Roles);

      const roleArr = this.app.sysRoles.map((r) =>
        rolesRepo.create({ uuid: r.uuid, name: r.name }),
      );

      const rolelength = await rolesRepo.count({});

      if (rolelength) {
        console.log(`Roles already defined.`);
        process.exit(0);
      }

      await rolesRepo
        .save(roleArr)
        .catch((err) =>
          console.log(`Insertion failed for roles. Try again`, err),
        );
    });

    process.exit(0);
  }
}
