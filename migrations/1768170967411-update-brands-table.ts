import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateBrandsTable1768170967411 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'brands',
      new TableColumn({
        name: 'featured',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('brands', 'featured');
  }
}
