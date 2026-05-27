import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateUserRoleMappingsTable1756293607572
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_role_mappings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'user_id', type: 'int', isNullable: false },
          { name: 'role_id', type: 'int', isNullable: false },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Regular indexes
    await queryRunner.createIndex(
      'user_role_mappings',
      new TableIndex({
        name: 'IDX_urm_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      'user_role_mappings',
      new TableIndex({
        name: 'IDX_urm_role_id',
        columnNames: ['role_id'],
      }),
    );

    // Unique index instead of unique constraint (MySQL)
    await queryRunner.createIndex(
      'user_role_mappings',
      new TableIndex({
        name: 'UQ_user_role_idx',
        columnNames: ['user_id', 'role_id'],
        isUnique: true,
      }),
    );

    // Foreign keys
    await queryRunner.createForeignKey(
      'user_role_mappings',
      new TableForeignKey({
        name: 'FK_urm_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_role_mappings',
      new TableForeignKey({
        name: 'FK_urm_role',
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FKs first
    const table = await queryRunner.getTable('user_role_mappings');
    const fkUser = table?.foreignKeys.find((f) => f.name === 'FK_urm_user');
    const fkRole = table?.foreignKeys.find((f) => f.name === 'FK_urm_role');
    if (fkUser) await queryRunner.dropForeignKey('user_role_mappings', fkUser);
    if (fkRole) await queryRunner.dropForeignKey('user_role_mappings', fkRole);

    // Drop indexes (unique + regular)
    const idxUnique = table?.indices.find((i) => i.name === 'UQ_user_role_idx');
    if (idxUnique) {
      await queryRunner.dropIndex('user_role_mappings', 'UQ_user_role_idx');
    }
    const idxUser = table?.indices.find((i) => i.name === 'IDX_urm_user_id');
    if (idxUser) {
      await queryRunner.dropIndex('user_role_mappings', 'IDX_urm_user_id');
    }
    const idxRole = table?.indices.find((i) => i.name === 'IDX_urm_role_id');
    if (idxRole) {
      await queryRunner.dropIndex('user_role_mappings', 'IDX_urm_role_id');
    }

    // Finally drop table
    await queryRunner.dropTable('user_role_mappings');
  }
}
