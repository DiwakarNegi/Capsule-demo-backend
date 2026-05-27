import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateUserPermissionsTable1776790691938
  implements MigrationInterface
{
  private readonly tableName = 'user_permissions';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'permission_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true, // ifNotExists
    );

    // Composite unique index — prevents the same permission being granted to the same user twice
    await queryRunner.createIndex(
      this.tableName,
      new TableIndex({
        name: 'UQ_user_permissions_user_permission',
        columnNames: ['user_id', 'permission_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      this.tableName,
      new TableForeignKey({
        name: 'FK_user_permissions_user_id',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      this.tableName,
      new TableForeignKey({
        name: 'FK_user_permissions_permission_id',
        columnNames: ['permission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'permissions',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(this.tableName);

    if (table) {
      for (const fkName of [
        'FK_user_permissions_permission_id',
        'FK_user_permissions_user_id',
      ]) {
        const fk = table.foreignKeys.find((f) => f.name === fkName);
        if (fk) {
          await queryRunner.dropForeignKey(this.tableName, fk);
        }
      }

      const uniqueIdx = table.indices.find(
        (i) => i.name === 'UQ_user_permissions_user_permission',
      );
      if (uniqueIdx) {
        await queryRunner.dropIndex(this.tableName, uniqueIdx);
      }
    }

    await queryRunner.dropTable(this.tableName, true); // ifExist
  }
}
