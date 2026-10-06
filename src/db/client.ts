import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase')
      ? { rejectUnauthorized: false }
      : false,
});

export const db = drizzle(pool, { schema });