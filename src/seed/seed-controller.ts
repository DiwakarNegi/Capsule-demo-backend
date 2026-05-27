import { Controller, Post, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller({ path: 'seed', version: '1' })
export class SeedController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get('prompts')
  async getPrompts() {
    const repo = this.dataSource.getRepository('prompts');
    const prompts = await repo.find();
    return { success: true, prompts };
  }

  @Post('reduce-variations')
async reduceVariations() {
  const repo = this.dataSource.getRepository('prompts');
  
  // Reduce lifestyle variations to 1
  await repo.update(
    { promptKey: 'lifestyle-image-variations' },
    { promptValue: 'Replace the background with a clean, minimal studio lifestyle environment. Use a neutral, soft-toned indoor setting with subtle depth (light wall or surface). Keep the product as the clear focal point. Lighting should be soft, diffused, and evenly balanced with natural shadows. No additional props or objects.' }
  );

  // Reduce marketplace variations to 1
  await repo.update(
    { promptKey: 'marketplace-image-variations' },
    { promptValue: 'Style: Classic. Apply warm color temperature and rich accent tones to the room. Replace detected furniture/decor objects with the provided product. Maintain all original room geometry, camera angle, and light direction. Product must sit grounded, proportionally matched to the replaced object. No architecture changes. No floating. No product modification.' }
  );

  return { success: true, message: 'Reduced to 1 variation each' };
}
  @Post('migrate')
  async runMigrations() {
    const results: string[] = [];
    const checks = [
      { column: 'stock', sql: 'ALTER TABLE inventory ADD COLUMN stock INT NOT NULL DEFAULT 0' },
      { column: 'price', sql: 'ALTER TABLE inventory ADD COLUMN price FLOAT NOT NULL DEFAULT 0' },
      { column: 'image_keys', sql: 'ALTER TABLE inventory ADD COLUMN image_keys TEXT NULL' },
      { column: 'generation_status', sql: "ALTER TABLE inventory ADD COLUMN generation_status TEXT NOT NULL DEFAULT 'Pending'" },
      { column: 'vendor_id', sql: 'ALTER TABLE inventory ADD COLUMN vendor_id INT NULL' },
      { column: 'brand_id', sql: 'ALTER TABLE inventory ADD COLUMN brand_id INT NULL' },
      { column: 'category_id', sql: 'ALTER TABLE inventory ADD COLUMN category_id INT NULL' },
      { column: 'uuid', sql: "ALTER TABLE inventory ADD COLUMN uuid VARCHAR(36) NOT NULL DEFAULT (UUID())" },
    ];
    for (const check of checks) {
      try {
        const cols = await this.dataSource.query(
          'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
          ['inventory', check.column]
        );
        if (cols.length === 0) {
          await this.dataSource.query(check.sql);
          results.push('Added column: ' + check.column);
        } else {
          results.push('Column already exists: ' + check.column);
        }
      } catch (err) {
        results.push('Error on ' + check.column + ': ' + (err as Error).message);
      }
    }
    return { success: true, results };
  }

  @Post('categories')
  async seedCategories() {
    const categories = [
      'Cushion Cover', 'Throw Pillow', 'Bolster', 'Rug',
      'Wall Art', 'Lamp', 'Vase', 'Table Decor', 'Bedding', 'Curtain',
    ];
    const repo = this.dataSource.getRepository('categories');
    const inserted: string[] = [];
    const skipped: string[] = [];
    for (const name of categories) {
      const existing = await repo.findOne({ where: { name } });
      if (existing) { skipped.push(name); continue; }
      await repo.save(repo.create({ name }));
      inserted.push(name);
    }
    return { success: true, inserted, skipped };
  }

  @Post('brand')
  async seedBrand() {
    const repo = this.dataSource.getRepository('brands');
    const existing = await repo.findOne({ where: { name: 'Sirhaana' } });
    if (existing) return { success: true, message: 'Brand already exists', brand: existing };
    const brand = await repo.save(repo.create({ name: 'Sirhaana', thumbnail: '', featured: '[]' }));
    return { success: true, message: 'Brand created', brand };
  }
}