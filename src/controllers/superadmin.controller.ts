import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, shops, products, orders } from '../db/schema.js';

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT) || 10;

/**
 * GET /api/superadmin/overview
 * Platform-wide aggregation metrics
 */
export async function getOverview(_req: Request, res: Response): Promise<void> {
  try {
    const [shopCount] = await db.select({ count: sql<number>`count(*)` }).from(shops);
    const [adminCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'admin'));
    const [customerCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'customer'));
    const [orderMetrics] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
      })
      .from(orders);

    res.status(200).json({
      metrics: {
        totalShops: Number(shopCount?.count || 0),
        totalAdmins: Number(adminCount?.count || 0),
        totalCustomers: Number(customerCount?.count || 0),
        totalOrders: Number(orderMetrics?.totalOrders || 0),
        totalRevenue: Number(orderMetrics?.totalRevenue || 0),
      },
    });
  } catch (error) {
    console.error('SuperAdmin Overview Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch platform metrics.' });
  }
}

/**
 * POST /api/superadmin/shops
 * Onboard a new shop
 */
export async function createShop(req: Request, res: Response): Promise<void> {
  try {
    const { name, slug, description, logoUrl, bannerUrl } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: 'Bad Request', message: 'Shop name and slug are required.' });
      return;
    }

    const cleanSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const existing = await db.query.shops.findFirst({
      where: (s, { eq }) => eq(s.slug, cleanSlug),
    });

    if (existing) {
      res.status(409).json({ error: 'Conflict', message: 'A shop with this slug already exists.' });
      return;
    }

    const [newShop] = await db
      .insert(shops)
      .values({
        name: String(name).trim(),
        slug: cleanSlug,
        description: description ? String(description).trim() : null,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
        status: 'active',
      })
      .returning();

    res.status(201).json({ message: 'Shop onboarded successfully.', shop: newShop });
  } catch (error) {
    console.error('Create Shop Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create shop.' });
  }
}

/**
 * GET /api/superadmin/shops
 * List all shops with associated admins & products summary
 */
export async function listShops(_req: Request, res: Response): Promise<void> {
  try {
    const allShops = await db.query.shops.findMany({
      with: {
        users: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        products: {
          columns: {
            id: true,
          },
        },
      },
      orderBy: (shops, { desc }) => [desc(shops.createdAt)],
    });

    const formatted = allShops.map((s) => ({
      ...s,
      admins: s.users.filter((u) => u.role === 'admin'),
      totalProducts: s.products.length,
    }));

    res.status(200).json({ shops: formatted });
  } catch (error) {
    console.error('List Shops Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list shops.' });
  }
}

/**
 * PUT /api/superadmin/shops/:id
 * Update shop details or status ('active', 'suspended')
 */
export async function updateShop(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { name, description, logoUrl, bannerUrl, status } = req.body;

    const existing = await db.query.shops.findFirst({
      where: (s, { eq }) => eq(s.id, id),
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Shop not found.' });
      return;
    }

    const [updatedShop] = await db
      .update(shops)
      .set({
        name: name !== undefined ? String(name).trim() : existing.name,
        description: description !== undefined ? description : existing.description,
        logoUrl: logoUrl !== undefined ? logoUrl : existing.logoUrl,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : existing.bannerUrl,
        status: status !== undefined ? status : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();

    res.status(200).json({ message: 'Shop updated successfully.', shop: updatedShop });
  } catch (error) {
    console.error('Update Shop Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update shop.' });
  }
}

/**
 * DELETE /api/superadmin/shops/:id
 * Delete a shop
 */
export async function deleteShop(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);

    const existing = await db.query.shops.findFirst({
      where: (s, { eq }) => eq(s.id, id),
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Shop not found.' });
      return;
    }

    await db.delete(shops).where(eq(shops.id, id));
    res.status(200).json({ message: 'Shop and associated resources deleted successfully.' });
  } catch (error) {
    console.error('Delete Shop Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete shop.' });
  }
}

/**
 * POST /api/superadmin/admins
 * Create an Admin user and link them to a shop
 */
export async function createAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, fullName, shopId } = req.body;

    if (!email || !password || !shopId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email, password, and shopId are required to create a shop admin.',
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanShopId = String(shopId);

    // Verify shop exists
    const shop = await db.query.shops.findFirst({
      where: (s, { eq }) => eq(s.id, cleanShopId),
    });

    if (!shop) {
      res.status(404).json({ error: 'Not Found', message: 'Target shop does not exist.' });
      return;
    }

    // Verify unique email
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, normalizedEmail),
    });

    if (existing) {
      res.status(409).json({ error: 'Conflict', message: 'A user with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const [newAdmin] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        fullName: fullName ? String(fullName).trim() : null,
        role: 'admin',
        shopId: shop.id,
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        shopId: users.shopId,
        createdAt: users.createdAt,
      });

    res.status(201).json({
      message: 'Admin account created and assigned to shop successfully.',
      admin: {
        ...newAdmin,
        shopName: shop.name,
      },
    });
  } catch (error) {
    console.error('Create Admin Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create admin.' });
  }
}

/**
 * GET /api/superadmin/admins
 * List all Admin users with shop metadata
 */
export async function listAdmins(_req: Request, res: Response): Promise<void> {
  try {
    const adminUsers = await db.query.users.findMany({
      where: (u, { eq }) => eq(u.role, 'admin'),
      with: {
        shop: true,
      },
      columns: {
        passwordHash: false,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    res.status(200).json({ admins: adminUsers });
  } catch (error) {
    console.error('List Admins Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list admins.' });
  }
}

/**
 * DELETE /api/superadmin/admins/:id
 * Delete an Admin user
 */
export async function deleteAdmin(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);

    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, id),
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Admin user not found.' });
      return;
    }

    if (existing.role === 'superadmin') {
      res.status(403).json({ error: 'Forbidden', message: 'Super-Admin users cannot be deleted through this endpoint.' });
      return;
    }

    await db.delete(users).where(eq(users.id, id));
    res.status(200).json({ message: 'Admin user removed successfully.' });
  } catch (error) {
    console.error('Delete Admin Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete admin.' });
  }
}