import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class UpdateInventoryTable1765267698852 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('inventory', 'category', 'category_id');

    await queryRunner.changeColumn(
      'inventory',
      'category_id',
      new TableColumn({
        name: 'category_id',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'inventory',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inventory');
    const fk = table!.foreignKeys.find((f) =>
      f.columnNames.includes('category_id'),
    );

    if (fk) {
      await queryRunner.dropForeignKey('inventory', fk);
    }

    await queryRunner.changeColumn(
      'inventory',
      'category_id',
      new TableColumn({
        name: 'category_id',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.renameColumn('inventory', 'category_id', 'category');
  }
}
