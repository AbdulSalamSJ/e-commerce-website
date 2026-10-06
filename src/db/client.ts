import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const defaultDbUrl = 'postgresql://postgres.pywvcewijtwxbezzglrr:Aqeel%400419%23@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';
const connString = process.env.DATABASE_URL || defaultDbUrl;

export const pool = new Pool({
  connectionString: connString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });