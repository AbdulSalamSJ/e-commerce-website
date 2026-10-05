import dotenv from 'dotenv';
import { pool } from './client.js';

dotenv.config();

async function runMigration() {
  console.log('Running category column migration for shops table...');
  try {
    await pool.query(`
      ALTER TABLE shops 
      ADD COLUMN IF NOT EXISTS category text DEFAULT 'General' NOT NULL;
    `);
    console.log('Migration successful: "category" column added to "shops" table.');

    // Populate realistic categories for pre-seeded shops if they are 'General'
    await pool.query(`
      UPDATE shops 
      SET category = 'Electronics & Tech' 
      WHERE slug = 'cyberhub' AND (category IS NULL OR category = 'General');
    `);
    await pool.query(`
      UPDATE shops 
      SET category = 'Luxury & Jewelry' 
      WHERE slug = 'maison-dor' AND (category IS NULL OR category = 'General');
    `);
    await pool.query(`
      UPDATE shops 
      SET category = 'Fashion & Apparel' 
      WHERE slug = 'solstice-creative' AND (category IS NULL OR category = 'General');
    `);

    const res = await pool.query(`
      SELECT id, name, slug, theme, category 
      FROM shops;
    `);
    console.log('Verified shops with category in database:', res.rows);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
