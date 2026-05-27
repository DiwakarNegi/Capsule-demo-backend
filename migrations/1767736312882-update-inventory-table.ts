import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateInventoryTable1767736312882 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inventory',
      new TableColumn({
        name: 'generation_status',
        type: 'varchar',
        length: '255',
        isNullable: false,
        default: "'Image Generation Pending'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inventory', 'generation_status');
  }
}
