import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { users } from './schema.js';

dotenv.config();

async function seed() {
  console.log('--- Starting Database Seeder ---');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in environment variables.');
    process.exit(1);
  }

  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'superadmin@platform.local').toLowerCase();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin#2026!';
  const saltRounds = Number(process.env.BCRYPT_SALT) || 10;

  console.log(`Hashing password for initial Super-Admin (${superAdminEmail})...`);
  const passwordHash = await bcrypt.hash(superAdminPassword, saltRounds);

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, superAdminEmail),
  });

  if (existingUser) {
    console.log(`Super-Admin (${superAdminEmail}) already exists. Updating credentials and verifying role...`);
    await db
      .update(users)
      .set({
        passwordHash,
        role: 'superadmin',
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id));
    console.log('Super-Admin user updated successfully.');
  } else {
    console.log(`Creating initial Super-Admin account (${superAdminEmail})...`);
    await db.insert(users).values({
      email: superAdminEmail,
      passwordHash,
      fullName: 'Master Super Administrator',
      role: 'superadmin',
    });
    console.log('Initial Super-Admin account created successfully.');
  }

  console.log('----------------------------------------------------');
  console.log('Super-Admin Credentials:');
  console.log(`Email:    ${superAdminEmail}`);
  console.log(`Password: ${superAdminPassword}`);
  console.log('Role:     superadmin');
  console.log('----------------------------------------------------');

  await pool.end();
}

seed().catch(async (err) => {
  console.error('Failed to seed database:', err);
  await pool.end();
  process.exit(1);
});