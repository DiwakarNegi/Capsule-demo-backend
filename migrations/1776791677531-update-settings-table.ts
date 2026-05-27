import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateSettingsTable1776791677531 implements MigrationInterface {
  private readonly tableName = 'settings';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      this.tableName,
      'uuid',
      new TableColumn({
        name: 'uuid',
        type: 'varchar',
        length: '255',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      this.tableName,
      'key',
      new TableColumn({
        name: 'key',
        type: 'varchar',
        length: '255',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      this.tableName,
      'value',
      new TableColumn({
        name: 'value',
        type: 'json',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      this.tableName,
      'created_at',
      new TableColumn({
        name: 'created_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
      }),
    );

    await queryRunner.changeColumn(
      this.tableName,
      'updated_at',
      new TableColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      this.tableName,
      'updated_at',
      new TableColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: 'now()',
      }),
    );

    await queryRunner.changeColumn(
      this.tableName,
      'created_at',
      new TableColumn({
        name: 'created_at',
        type: 'timestamp',
        default: 'now()',
      }),
    );

    await queryRunner.changeColumn(
      this.tableName,
      'value',
      new TableColumn({
        name: 'value',
        type: 'json',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      this.tableName,
      'key',
      new TableColumn({
        name: 'key',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      this.tableName,
      'uuid',
      new TableColumn({
        name: 'uuid',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
