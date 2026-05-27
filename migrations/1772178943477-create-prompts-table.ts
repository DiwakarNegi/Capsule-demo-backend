import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePromptsTable1772178943477 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'prompts',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'uuid',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'prompt_title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'prompt_key',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'prompt_value',
            type: 'text',
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
        indices: [
          {
            name: 'IDX_PROMPTS_UUID',
            columnNames: ['uuid'],
            isUnique: true,
          },
          {
            name: 'IDX_PROMPTS_PROMPT_KEY',
            columnNames: ['prompt_key'],
            isUnique: false,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'prompts',
      new TableIndex({
        name: 'IDX_PROMPTS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('prompts', 'IDX_PROMPTS_CREATED_AT');
    await queryRunner.dropIndex('prompts', 'IDX_PROMPTS_PROMPT_KEY');
    await queryRunner.dropIndex('prompts', 'IDX_PROMPTS_UUID');
    await queryRunner.dropTable('prompts');
  }
}
