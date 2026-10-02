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

  // 2. Demo Shop 1: CyberHub (Theme: cyber-neon)
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
        theme: 'cyber-neon',
        status: 'active',
      })
      .returning();
    shop = newShop;
    console.log(`Created Shop: ${shop.name} (${shop.id})`);
  } else {
    await db.update(shops).set({ theme: 'cyber-neon' }).where(eq(shops.id, shop.id));
    console.log(`Found existing Shop: ${shop.name} (${shop.id}) with theme cyber-neon`);
  }

  // 2b. Demo Shop 2: Maison d'Or (Theme: luxury-gold)
  let luxeShop = await db.query.shops.findFirst({
    where: eq(shops.slug, 'maison-dor'),
  });

  if (!luxeShop) {
    const [newShop] = await db
      .insert(shops)
      .values({
        name: "Maison d'Or Haute Joaillerie",
        slug: 'maison-dor',
        description: 'Handcrafted 18k gold timepieces, ethical diamond jewelry, and bespoke artisanal treasures.',
        theme: 'luxury-gold',
        status: 'active',
      })
      .returning();
    luxeShop = newShop;
    console.log(`Created Shop: ${luxeShop.name} (${luxeShop.id})`);
  } else {
    await db.update(shops).set({ theme: 'luxury-gold' }).where(eq(shops.id, luxeShop.id));
    console.log(`Found existing Shop: ${luxeShop.name} with theme luxury-gold`);
  }

  // 2c. Demo Shop 3: Solstice Creative (Theme: sunset-flare)
  let sunsetShop = await db.query.shops.findFirst({
    where: eq(shops.slug, 'solstice-creative'),
  });

  if (!sunsetShop) {
    const [newShop] = await db
      .insert(shops)
      .values({
        name: 'Solstice Creative & Apparel',
        slug: 'solstice-creative',
        description: 'Vibrant neon street aesthetics, contemporary designer silhouettes, and dynamic graphic apparel.',
        theme: 'sunset-flare',
        status: 'active',
      })
      .returning();
    sunsetShop = newShop;
    console.log(`Created Shop: ${sunsetShop.name} (${sunsetShop.id})`);
  } else {
    await db.update(shops).set({ theme: 'sunset-flare' }).where(eq(shops.id, sunsetShop.id));
    console.log(`Found existing Shop: ${sunsetShop.name} with theme sunset-flare`);
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

  // Demo Products for Maison d'Or (luxury-gold)
  const existingLuxeProds = await db.query.products.findMany({
    where: eq(products.shopId, luxeShop.id),
  });

  if (existingLuxeProds.length === 0) {
    await db.insert(products).values([
      {
        shopId: luxeShop.id,
        name: 'Aethelgard 18k Rose Gold Chronograph',
        description: 'Automatic swiss movement, exhibition sapphire caseback, and hand-stitched alligator strap.',
        price: '2850.00',
        stock: 5,
        category: 'Watches',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
      },
      {
        shopId: luxeShop.id,
        name: 'Solitaire Pavé Diamond Pendant',
        description: 'Brilliant 1.5 carat ethical diamond set in platinum and 18k champagne gold prongs.',
        price: '1690.00',
        stock: 8,
        category: 'Jewelry',
        imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
      },
    ]);
    console.log("Seeded demo products for Maison d'Or.");
  }

  // Demo Products for Solstice Creative (sunset-flare)
  const existingSunsetProds = await db.query.products.findMany({
    where: eq(products.shopId, sunsetShop.id),
  });

  if (existingSunsetProds.length === 0) {
    await db.insert(products).values([
      {
        shopId: sunsetShop.id,
        name: 'Hyperion Sunset Gradient Windbreaker',
        description: 'Reflective weatherproof technical shell with vibrant chromatic sunset dye finish.',
        price: '185.00',
        stock: 30,
        category: 'Apparel',
        imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop&q=80',
      },
      {
        shopId: sunsetShop.id,
        name: 'Neo-Tokyo Graphic Heavyweight Hoodie',
        description: '500 GSM French terry cotton with high-density screenprinted sunset visuals.',
        price: '120.00',
        stock: 50,
        category: 'Streetwear',
        imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80',
      },
    ]);
    console.log('Seeded demo products for Solstice Creative.');
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