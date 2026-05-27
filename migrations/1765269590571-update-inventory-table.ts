import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class UpdateInventoryTable1765269590571 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('inventory', 'brand', 'brand_id');
    await queryRunner.changeColumn(
      'inventory',
      'brand_id',
      new TableColumn({
        name: 'brand_id',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'inventory',
      new TableForeignKey({
        columnNames: ['brand_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'brands',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inventory');
    const fk = table!.foreignKeys.find((fk) =>
      fk.columnNames.includes('brand_id'),
    );

    if (fk) {
      await queryRunner.dropForeignKey('inventory', fk);
    }

    await queryRunner.changeColumn(
      'inventory',
      'brand_id',
      new TableColumn({
        name: 'brand_id',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.renameColumn('inventory', 'brand_id', 'brand');
  }
}
