/**
 * scripts/seed-local.ts
 *
 * One-command local-dev seed. Replaces the scattered CLI commands + temporary
 * /v1/seed/* HTTP endpoints with a single idempotent script.
 *
 * Run with:   npx ts-node -r tsconfig-paths/register scripts/seed-local.ts
 * (add an npm script:  "seed:local": "ts-node -r tsconfig-paths/register scripts/seed-local.ts")
 *
 * ⚠️ ADAPT THIS to your real entity names / import paths before running.
 * The names below (Category, Brand, Prompt, etc.) are best-guess from the project
 * history. Open this in Claude Code and ask it to wire the real entities — it can
 * read your actual `entities`/`repositories` and fix the imports + table names.
 *
 * This script is intentionally framework-light: it boots a standalone TypeORM
 * DataSource from your env so it doesn't depend on the full Nest app graph.
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';

// --- Data to seed -----------------------------------------------------------

const CATEGORIES = [
  'Cushion Cover', 'Throw Pillow', 'Bolster', 'Rug', 'Wall Art',
  'Lamp', 'Vase', 'Table Decor', 'Bedding', 'Curtain',
];

const PROMPTS: Array<{ key: string; title: string; value: string }> = [
  {
    key: 'text-generation',
    title: 'Text Generation',
    value:
      'You are a precise product content generator for e-commerce websites. Your sole task is to analyze UPLOADED IMAGES and USER INPUTS provided in every query, then generate ONLY fact-based, SEO-optimized output: a catchy TITLE, concise DESCRIPTION with RELEVANT INFORMATION in it. ' +
      'CRITICAL RULES - VIOLATION BREAKS YOUR CORE FUNCTION: ' +
      '1. BASE EVERY DETAIL STRICTLY ON VISIBLE ELEMENTS IN THE IMAGES + EXACT USER INPUTS. Do NOT invent, assume, or add ANY unobservable facts. ' +
      '2. NO HALLUCINATIONS: If something is unclear or absent, omit it entirely. ' +
      '3. STICK TO FACTS: Describe what is objectively shown/typed. Use neutral, descriptive language. ' +
      '4. OUTPUT STRUCTURE - EXACTLY LIKE THIS, NO DEVIATIONS: **Title:** [Optimized title here] **Description:** [Paragraph(s) here] ' +
      'Respond ONLY with the structured output. No chit-chat, no questions, no extras.',
  },
  {
    key: 'image-group-generation',
    title: 'Image Group Generation',
    value:
      'You are a visual reasoning agent. Your ONLY task is to group images that depict the SAME physical product. ' +
      'STRICT RULES: 1. Group images ONLY if they clearly show the same object. 2. Use shape, color, proportions, patterns, logos, and construction. ' +
      '3. If unsure, keep images in separate groups. 4. Do NOT invent product names. 5. Output ONLY JSON matching the schema.',
  },
  {
    key: 'lifestyle-image-generation',
    title: 'Lifestyle Image Generation',
    value:
      'You are an ecommerce-focused photo editing assistant. Your sole task is to analyze UPLOADED PRODUCT IMAGES and USER INPUTS, then produce polished, high-resolution product images suitable for online marketplaces by improving background, environment, lighting, and image quality—while preserving the product exactly as shown. ' +
      'CRITICAL RULES: 1. PRODUCT PRESERVATION (NON-NEGOTIABLE): Preserve the product EXACTLY as visible. Do NOT change shape, proportions, colors, logos, prints, or patterns. ' +
      '2. ALLOWED EDITS – ENVIRONMENT & SCENE ONLY: Replace plain backgrounds with a RELEVANT, REALISTIC ENVIRONMENT appropriate to the product category. ' +
      '3. REALISTIC PLACEMENT: Place products ONLY where they would naturally exist in reality. Respect real-world positioning, gravity, and spatial logic. ' +
      '4. LIGHTING, SHADOWS & PHYSICAL CONSISTENCY: Lighting must be realistic and coherent with the environment. ' +
      '5. QUALITY, UPSCALING & ENHANCEMENT: Denoise, sharpen, and upscale to high-resolution ecommerce standards. ' +
      'Respond ONLY by producing the edited image output. No explanations, no commentary, no questions.',
  },
  {
    key: 'lifestyle-image-variations',
    // ONE variation only for local dev — each variation = one Gemini image call.
    title: 'Lifestyle Image Variations',
    value:
      'Replace the background with a clean, minimal studio lifestyle environment. ' +
      'Use a neutral, soft-toned indoor setting with subtle depth (light wall or surface). ' +
      'Keep the product as the clear focal point. ' +
      'Lighting should be soft, diffused, and evenly balanced with natural shadows. ' +
      'No additional props or objects.',
  },
  {
    key: 'marketplace-image-generation',
    title: 'Marketplace Image Generation',
    value:
      'You are operating inside a controlled interior object replacement system. ' +
      'OBJECTIVE: Replace selected objects in the uploaded room image with provided product images while preserving the original room layout. ' +
      'SECTION 1 — SCENE PRESERVATION RULES: Preserve wall structure, floor structure, ceiling structure, window/door placement, camera angle, perspective, light direction, room depth, shadow direction. Room geometry must remain unchanged. ' +
      'SECTION 2 — OBJECT REPLACEMENT RULES: Replace ONLY the detected objects. Maintain original position, orientation, scale ratio, perspective alignment, and ground contact. Objects must not float. ' +
      'SECTION 3 — PRODUCT INTEGRITY PROTOCOL: The replacement product is a locked asset. STRICTLY PROHIBITED: geometry modification, material change, color shift, stylization, texture smoothing, lighting modification, shape correction. Only placement and scaling are allowed. ' +
      'SECTION 4 — LIGHTING CONSISTENCY: Maintain original light direction. Match new objects to existing light. No dramatic cinematic lighting. ' +
      'Respond ONLY by producing the edited image output. No explanations, no commentary, no questions.',
  },
  {
    key: 'marketplace-image-variations',
    title: 'Marketplace Image Variations',
    value: [
      'Style: Classic. Apply warm color temperature and rich accent tones to the room. Replace detected furniture/decor objects with the provided product. Maintain all original room geometry, camera angle, and light direction. Product must sit grounded, proportionally matched to the replaced object. No architecture changes. No floating. No product modification.',
      'Style: Minimal. Apply cool neutral tones and clean, uncluttered accents to the room. Replace detected furniture/decor objects with the provided product. Maintain all original room geometry, camera angle, and light direction. Product must sit grounded, proportionally matched to the replaced object. No architecture changes. No floating. No product modification.',
      'Style: Luxury. Apply deep, rich color accents and refined warm lighting mood to the room. Replace detected furniture/decor objects with the provided product. Maintain all original room geometry, camera angle, and light direction. Product must sit grounded, proportionally matched to the replaced object. No architecture changes. No floating. No product modification.',
      'Style: Scandinavian. Apply soft whites, light wood tones, and airy natural lighting mood to the room. Replace detected furniture/decor objects with the provided product. Maintain all original room geometry, camera angle, and light direction. Product must sit grounded, proportionally matched to the replaced object. No architecture changes. No floating. No product modification.',
    ].join(','),
  },
  {
    key: 'capsule-image-generation',
    title: 'Capsule Image Generation',
    value:
      'You are a structured interior redesign system. ' +
      'OBJECTIVE: Take the original room image and the provided product images, then generate a single photorealistic redesigned room image that incorporates those products naturally. ' +
      'SECTION 1 — ROOM PRESERVATION: Preserve strictly: wall structure, floor structure, ceiling structure, window/door placement, camera angle, perspective, light direction. Room geometry must remain completely unchanged. ' +
      'SECTION 2 — PRODUCT PLACEMENT RULES: For each provided product: place it in the most contextually appropriate position, maintain realistic scale, ensure full ground or surface contact, correct perspective alignment, no floating, no clipping. ' +
      'SECTION 3 — PRODUCT INTEGRITY PROTOCOL: Each provided product is a locked asset. STRICTLY PROHIBITED: geometry modification, material change, color shift, stylization, shape correction. Only placement and scaling are permitted. ' +
      'SECTION 4 — LIGHTING CONSISTENCY: Maintain the original room light direction. No dramatic cinematic lighting. ' +
      'Respond ONLY by producing the redesigned room image. No explanations, no commentary, no questions.',
  },
  {
    key: 'capsule-intent-analysis',
    title: 'Capsule Intent Analysis',
    value:
      "You are a room transformation intent analyser. " +
      "OBJECTIVE: Determine exactly what the user wants changed, how many distinct furniture or decor items are required, and generate precise search terms to find those items in a product inventory. " +
      "RULES: 1. Analyse the room image carefully — identify room type, existing furniture, layout, and style. " +
      "2. Read the user's request precisely — identify which objects they want replaced, added, or changed. " +
      "3. Produce a concise summary of the transformation goal. " +
      "4. Determine itemCount — the number of distinct product items needed. " +
      "5. Generate searchTerms — a list of specific, singular product names (e.g. 'sofa', 'floor lamp'). Keep terms simple, generic, and searchable. " +
      "6. Do NOT invent items the user did not request. " +
      "7. Output ONLY structured JSON matching the required schema. No commentary, no questions, no extras.",
  },
];

// --- DataSource (reads from .env) -------------------------------------------

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // We use raw queries below so we don't need entity classes here, but if you
  // prefer entity repositories, register them and swap the query() calls.
  entities: [],
  synchronize: false,
});

// --- Helpers ----------------------------------------------------------------

async function ensureColumn(
  ds: DataSource,
  table: string,
  column: string,
  ddl: string,
) {
  const rows: Array<{ c: number }> = await ds.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, table, column],
  );
  if (rows[0].c > 0) {
    console.log(`  • column ${table}.${column} already exists`);
    return;
  }
  await ds.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  console.log(`  ✓ added column ${table}.${column}`);
}

async function seedCategories(ds: DataSource) {
  console.log('Seeding categories…');
  for (const name of CATEGORIES) {
    const existing = await ds.query(
      `SELECT id FROM categories WHERE name = ? LIMIT 1`,
      [name],
    );
    if (existing.length) {
      console.log(`  • ${name} (skip)`);
      continue;
    }
    await ds.query(
      `INSERT INTO categories (uuid, name) VALUES (UUID(), ?)`,
      [name],
    );
    console.log(`  ✓ ${name}`);
  }
}

async function seedBrand(ds: DataSource) {
  console.log('Seeding demo brand…');
  const existing = await ds.query(
    `SELECT id FROM brands WHERE name = ? LIMIT 1`,
    ['Sirhaana'],
  );
  if (existing.length) {
    console.log('  • Sirhaana (skip)');
    return;
  }
  await ds.query(
    `INSERT INTO brands (uuid, name, thumbnail, featured) VALUES (UUID(), ?, '', '[]')`,
    ['Sirhaana'],
  );
  console.log('  ✓ Sirhaana');
}

async function seedPrompts(ds: DataSource) {
  console.log('Seeding prompts…');
  for (const p of PROMPTS) {
    const existing = await ds.query(
      `SELECT id FROM prompts WHERE prompt_key = ? LIMIT 1`,
      [p.key],
    );
    if (existing.length) {
      // keep it current (so the 1-variation value always wins)
      await ds.query(
        `UPDATE prompts SET prompt_value = ?, prompt_title = ? WHERE prompt_key = ?`,
        [p.value, p.title, p.key],
      );
      console.log(`  ↻ ${p.key} (updated)`);
      continue;
    }
    await ds.query(
      `INSERT INTO prompts (uuid, prompt_key, prompt_title, prompt_value)
       VALUES (UUID(), ?, ?, ?)`,
      [p.key, p.title, p.value],
    );
    console.log(`  ✓ ${p.key}`);
  }
}

async function ensureSchema(ds: DataSource) {
  console.log('Ensuring inventory columns…');
  // Columns that were historically missing from the inventory table.
  await ensureColumn(ds, 'inventory', 'stock', '`stock` INT NOT NULL DEFAULT 0');
  await ensureColumn(ds, 'inventory', 'price', '`price` FLOAT NOT NULL DEFAULT 0');
}

// --- Main -------------------------------------------------------------------

async function main() {
  await dataSource.initialize();
  console.log('Connected.\n');

  await ensureSchema(dataSource);
  await seedCategories(dataSource);
  await seedBrand(dataSource);
  await seedPrompts(dataSource);

  // NOTE: roles + super-admin are still handled by the Nest CLI because they
  // depend on app config/hashing. Run those first:
  //   npm run cli -- init:roles
  //   npm run cli -- init:super-admin
  // (or ask Claude Code to fold them into this script using your real services)

  await dataSource.destroy();
  console.log('\nDone. Local DB is seeded and ready.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
