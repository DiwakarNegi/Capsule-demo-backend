import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateUserTable1776706523670 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'users',
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
      'users',
      'name',
      new TableColumn({
        name: 'name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'username',
      new TableColumn({
        name: 'username',
        type: 'varchar',
        length: '255',
        isNullable: false,
        isUnique: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'email',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'country_code',
      new TableColumn({
        name: 'country_code',
        type: 'varchar',
        length: '10',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'mobile_number',
      new TableColumn({
        name: 'mobile_number',
        type: 'varchar',
        length: '20',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'profile_picture',
      new TableColumn({
        name: 'profile_picture',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add new columns
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'password_hash',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
      }),
      new TableColumn({
        name: 'is_verified',
        type: 'boolean',
        default: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', [
      'password_hash',
      'is_active',
      'is_verified',
    ]);

    // Revert column definitions to their original state
    await queryRunner.changeColumn(
      'users',
      'profile_picture',
      new TableColumn({
        name: 'profile_picture',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'mobile_number',
      new TableColumn({
        name: 'mobile_number',
        type: 'varchar',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'country_code',
      new TableColumn({
        name: 'country_code',
        type: 'varchar',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'email',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'username',
      new TableColumn({
        name: 'username',
        type: 'varchar',
        isNullable: false,
        isUnique: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'name',
      new TableColumn({
        name: 'name',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'uuid',
      new TableColumn({
        name: 'uuid',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }
}
