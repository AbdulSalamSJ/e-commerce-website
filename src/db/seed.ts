import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { users, shops, products } from './schema.js';

dotenv.config();

async function seed() {
  console.log('--- Starting Database Seeder ---');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in environment variables.');
    process.exit(1);
  }

  const saltRounds = Number(process.env.BCRYPT_SALT) || 10;

  // 1. SuperAdmin
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'superadmin@platform.local').toLowerCase();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin#2026!';
  const superAdminHash = await bcrypt.hash(superAdminPassword, saltRounds);

  const existingSuperAdmin = await db.query.users.findFirst({
    where: eq(users.email, superAdminEmail),
  });

  if (existingSuperAdmin) {
    await db
      .update(users)
      .set({
        passwordHash: superAdminHash,
        role: 'superadmin',
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingSuperAdmin.id));
    console.log(`Updated SuperAdmin: ${superAdminEmail}`);
  } else {
    await db.insert(users).values({
      email: superAdminEmail,
      passwordHash: superAdminHash,
      fullName: 'Master Super Administrator',
      role: 'superadmin',
    });
    console.log(`Created SuperAdmin: ${superAdminEmail}`);
  }

  // 2. Demo Shop (CyberHub)
  let shop = await db.query.shops.findFirst({
    where: eq(shops.slug, 'cyberhub'),
  });

  if (!shop) {
    const [newShop] = await db
      .insert(shops)
      .values({
        name: 'CyberHub Electronics',
        slug: 'cyberhub',
        description: 'Next-generation tech gadgets, performance hardware, and premium gaming gear.',
        status: 'active',
      })
      .returning();
    shop = newShop;
    console.log(`Created Shop: ${shop.name} (${shop.id})`);
  } else {
    console.log(`Found existing Shop: ${shop.name} (${shop.id})`);
  }

  // 3. Shop Admin (admin@cyberhub.com)
  const adminEmail = 'admin@cyberhub.com';
  const adminPassword = 'Admin#2026!';
  const adminHash = await bcrypt.hash(adminPassword, saltRounds);

  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (existingAdmin) {
    await db
      .update(users)
      .set({
        passwordHash: adminHash,
        role: 'admin',
        shopId: shop.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingAdmin.id));
    console.log(`Updated Shop Admin: ${adminEmail}`);
  } else {
    await db.insert(users).values({
      email: adminEmail,
      passwordHash: adminHash,
      fullName: 'CyberHub Store Manager',
      role: 'admin',
      shopId: shop.id,
    });
    console.log(`Created Shop Admin: ${adminEmail}`);
  }

  // 4. Demo Customer (customer@nexus.com)
  const customerEmail = 'customer@nexus.com';
  const customerPassword = 'Customer#2026!';
  const customerHash = await bcrypt.hash(customerPassword, saltRounds);

  const existingCustomer = await db.query.users.findFirst({
    where: eq(users.email, customerEmail),
  });

  if (existingCustomer) {
    await db
      .update(users)
      .set({
        passwordHash: customerHash,
        role: 'customer',
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingCustomer.id));
    console.log(`Updated Customer: ${customerEmail}`);
  } else {
    await db.insert(users).values({
      email: customerEmail,
      passwordHash: customerHash,
      fullName: 'Alex Vance',
      role: 'customer',
    });
    console.log(`Created Customer: ${customerEmail}`);
  }

  // 5. Demo Products for CyberHub
  const existingProducts = await db.query.products.findMany({
    where: eq(products.shopId, shop.id),
  });

  if (existingProducts.length === 0) {
    await db.insert(products).values([
      {
        shopId: shop.id,
        name: 'Quantum Pro Wireless Headphones',
        description: 'Active noise cancellation, studio-grade 50mm drivers, and 40-hour battery life.',
        price: '199.99',
        stock: 25,
        category: 'Audio',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      },
      {
        shopId: shop.id,
        name: 'Aura Mechanical Gaming Keyboard',
        description: 'Hot-swappable linear switches, aircraft-grade aluminum chassis, and RGB per-key backlighting.',
        price: '149.50',
        stock: 40,
        category: 'Gaming',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      },
      {
        shopId: shop.id,
        name: 'UltraWide Curved 34" OLED Monitor',
        description: '0.03ms response time, 175Hz refresh rate, 99.3% DCI-P3 color gamut, and HDR TrueBlack 400.',
        price: '799.00',
        stock: 12,
        category: 'Displays',
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
      },
    ]);
    console.log('Seeded demo products for CyberHub Electronics.');
  }

  console.log('----------------------------------------------------');
  console.log('Ready to test credentials:');
  console.log('1. SuperAdmin:');
  console.log(`   Email:    ${superAdminEmail}`);
  console.log(`   Password: ${superAdminPassword}`);
  console.log('2. Shop Admin:');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('3. Customer:');
  console.log(`   Email:    ${customerEmail}`);
  console.log(`   Password: ${customerPassword}`);
  console.log('----------------------------------------------------');

  await pool.end();
}

seed().catch(async (err) => {
  console.error('Failed to seed database:', err);
  await pool.end();
  process.exit(1);
});