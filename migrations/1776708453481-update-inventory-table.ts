import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class UpdateInventoryTable1776708453481 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inventory');
    if (!table) {
      throw new Error('inventory table not found');
    }

    // Drop removed columns only if they still exist
    for (const columnName of ['stock', 'category', 'brand']) {
      if (table.findColumnByName(columnName)) {
        await queryRunner.dropColumn('inventory', columnName);
      }
    }

    // Modify existing columns to enforce length
    await queryRunner.changeColumn(
      'inventory',
      'uuid',
      new TableColumn({
        name: 'uuid',
        type: 'varchar',
        length: '255',
        isNullable: false,
        isUnique: true,
      }),
    );

    await queryRunner.changeColumn(
      'inventory',
      'title',
      new TableColumn({
        name: 'title',
        type: 'varchar',
        length: '255',
        isNullable: false,
      }),
    );

    // Add new columns only if they don't already exist
    const newColumns: TableColumn[] = [
      new TableColumn({
        name: 'category_id',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
      }),
      new TableColumn({
        name: 'generation_status',
        type: 'varchar',
        length: '255',
        default: "'Image Generation Pending'",
      }),
    ];

    for (const column of newColumns) {
      if (!table.findColumnByName(column.name)) {
        await queryRunner.addColumn('inventory', column);
      }
    }

    // Add indexes only if they don't exist
    const refreshedTable = await queryRunner.getTable('inventory');

    const hasVendorIdx = refreshedTable?.indices.some(
      (idx) => idx.name === 'IDX_inventory_vendor_id',
    );
    if (!hasVendorIdx) {
      await queryRunner.createIndex(
        'inventory',
        new TableIndex({
          name: 'IDX_inventory_vendor_id',
          columnNames: ['vendor_id'],
        }),
      );
    }

    const hasCategoryIdx = refreshedTable?.indices.some(
      (idx) => idx.name === 'IDX_inventory_category_id',
    );
    if (!hasCategoryIdx) {
      await queryRunner.createIndex(
        'inventory',
        new TableIndex({
          name: 'IDX_inventory_category_id',
          columnNames: ['category_id'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inventory');
    if (!table) return;

    // Drop indexes if present
    if (table.indices.some((idx) => idx.name === 'IDX_inventory_category_id')) {
      await queryRunner.dropIndex('inventory', 'IDX_inventory_category_id');
    }
    if (table.indices.some((idx) => idx.name === 'IDX_inventory_vendor_id')) {
      await queryRunner.dropIndex('inventory', 'IDX_inventory_vendor_id');
    }

    // Drop added columns if present
    for (const columnName of [
      'category_id',
      'is_active',
      'generation_status',
    ]) {
      if (table.findColumnByName(columnName)) {
        await queryRunner.dropColumn('inventory', columnName);
      }
    }

    // Revert altered columns
    await queryRunner.changeColumn(
      'inventory',
      'title',
      new TableColumn({
        name: 'title',
        type: 'varchar',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'inventory',
      'uuid',
      new TableColumn({
        name: 'uuid',
        type: 'varchar',
        isNullable: false,
        isUnique: true,
      }),
    );

    // Restore dropped columns if they're missing
    const colsToRestore = [
      new TableColumn({
        name: 'stock',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
      new TableColumn({ name: 'category', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'brand', type: 'varchar', isNullable: true }),
    ];
    for (const col of colsToRestore) {
      if (!table.findColumnByName(col.name)) {
        await queryRunner.addColumn('inventory', col);
      }
    }
  }
}
