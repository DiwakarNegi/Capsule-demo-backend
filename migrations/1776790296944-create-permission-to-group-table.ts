import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePermissionToGroupTable1776790296944
  implements MigrationInterface
{
  private readonly tableName = 'permission_to_group';

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
            name: 'group_id',
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

    // Composite unique index — prevents the same permission being added to the same group twice
    await queryRunner.createIndex(
      this.tableName,
      new TableIndex({
        name: 'UQ_permission_to_group_group_permission',
        columnNames: ['group_id', 'permission_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      this.tableName,
      new TableForeignKey({
        name: 'FK_permission_to_group_group_id',
        columnNames: ['group_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'permission_groups',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      this.tableName,
      new TableForeignKey({
        name: 'FK_permission_to_group_permission_id',
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
        'FK_permission_to_group_permission_id',
        'FK_permission_to_group_group_id',
      ]) {
        const fk = table.foreignKeys.find((f) => f.name === fkName);
        if (fk) {
          await queryRunner.dropForeignKey(this.tableName, fk);
        }
      }

      const uniqueIdx = table.indices.find(
        (i) => i.name === 'UQ_permission_to_group_group_permission',
      );
      if (uniqueIdx) {
        await queryRunner.dropIndex(this.tableName, uniqueIdx);
      }
    }

    await queryRunner.dropTable(this.tableName, true); // ifExist
  }
}
