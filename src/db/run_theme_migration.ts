import dotenv from 'dotenv';
import { pool } from './client.js';

dotenv.config();

async function runMigration() {
  console.log('Running theme column migration for shops table...');
  try {
    await pool.query(`
      ALTER TABLE shops 
      ADD COLUMN IF NOT EXISTS theme text DEFAULT 'cyber-neon' NOT NULL;
    `);
    console.log('Migration successful: "theme" column added to "shops" table.');

    const res = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'shops' AND column_name = 'theme';
    `);
    console.log('Verified column in database:', res.rows);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
