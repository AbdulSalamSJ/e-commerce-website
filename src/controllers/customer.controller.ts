import { Request, Response } from 'express';
import { eq, and, ilike } from 'drizzle-orm';
import { db } from '../db/client.js';
import { shops, products, orders } from '../db/schema.js';

/**
 * GET /api/shops (Public)
 * List active storefronts
 */
export async function listActiveShops(_req: Request, res: Response): Promise<void> {
  try {
    const activeShops = await db.query.shops.findMany({
      where: (s, { eq }) => eq(s.status, 'active'),
      columns: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        theme: true,
      },
    });

    res.status(200).json({ shops: activeShops });
  } catch (error) {
    console.error('List Active Shops Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve shops.' });
  }
}

/**
 * GET /api/shops/:slug (Public)
 * Get shop storefront by slug with its active catalog
 */
export async function getShopBySlug(req: Request, res: Response): Promise<void> {
  try {
    const slug = String(req.params.slug);

    const shop = await db.query.shops.findFirst({
      where: (s, { and, eq }) => and(eq(s.slug, slug), eq(s.status, 'active')),
      with: {
        products: {
          orderBy: (products, { desc }) => [desc(products.createdAt)],
        },
      },
    });

    if (!shop) {
      res.status(404).json({ error: 'Not Found', message: 'Shop not found or not currently active.' });
      return;
    }

    res.status(200).json({ shop });
  } catch (error) {
    console.error('Get Shop By Slug Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve shop.' });
  }
}

/**
 * GET /api/products (Public)
 * Search and browse catalog
 */
export async function listPublicProducts(req: Request, res: Response): Promise<void> {
  try {
    const { shopId, category, search } = req.query;

    let query = db.select().from(products).$dynamic();
    const conditions = [];

    if (shopId) {
      conditions.push(eq(products.shopId, String(shopId)));
    }
    if (category) {
      conditions.push(eq(products.category, String(category)));
    }
    if (search) {
      conditions.push(ilike(products.name, `%${String(search).trim()}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const catalog = await query;
    res.status(200).json({ products: catalog });
  } catch (error) {
    console.error('List Public Products Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch catalog.' });
  }
}

/**
 * GET /api/products/:id (Public)
 * Single product detail with shop context
 */
export async function getPublicProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);

    const product = await db.query.products.findFirst({
      where: (p, { eq }) => eq(p.id, id),
      with: {
        shop: {
          columns: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Not Found', message: 'Product not found.' });
      return;
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Get Public Product Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve product.' });
  }
}

/**
 * POST /api/orders (Authenticated Customer)
 * Checkout / Order placement
 */
export async function placeOrder(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.user?.id;
    const { shopId, items } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'shopId and a non-empty array of items are required to place an order.',
      });
      return;
    }

    const cleanShopId = String(shopId);

    // Verify shop is active
    const shop = await db.query.shops.findFirst({
      where: (s, { and, eq }) => and(eq(s.id, cleanShopId), eq(s.status, 'active')),
    });

    if (!shop) {
      res.status(404).json({ error: 'Not Found', message: 'Target shop does not exist or is inactive.' });
      return;
    }

    // Calculate total and validate products
    let calculatedTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
        res.status(400).json({ error: 'Bad Request', message: 'Each item must have a valid productId and quantity > 0.' });
        return;
      }

      const cleanProductId = String(item.productId);
      const product = await db.query.products.findFirst({
        where: (p, { and, eq }) => and(eq(p.id, cleanProductId), eq(p.shopId, cleanShopId)),
      });

      if (!product) {
        res.status(400).json({
          error: 'Bad Request',
          message: `Product ${item.productId} was not found in this shop.`,
        });
        return;
      }

      const qty = parseInt(item.quantity, 10);
      const unitPrice = Number(product.price);
      calculatedTotal += unitPrice * qty;

      verifiedItems.push({
        productId: product.id,
        name: product.name,
        price: unitPrice,
        quantity: qty,
        subtotal: unitPrice * qty,
      });
    }

    // Insert order record
    const [newOrder] = await db
      .insert(orders)
      .values({
        shopId: cleanShopId,
        customerId: customerId || null,
        totalAmount: calculatedTotal.toFixed(2),
        status: 'pending',
        items: JSON.stringify(verifiedItems),
      })
      .returning();

    res.status(201).json({
      message: 'Order placed successfully.',
      order: {
        ...newOrder,
        items: verifiedItems,
      },
    });
  } catch (error) {
    console.error('Place Order Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to place order.' });
  }
}

/**
 * GET /api/orders (Authenticated Customer)
 * View customer order history
 */
export async function getCustomerOrders(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Customer authentication required.' });
      return;
    }

    const customerOrders = await db.query.orders.findMany({
      where: (o, { eq }) => eq(o.customerId, customerId),
      with: {
        shop: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    const parsed = customerOrders.map((o) => {
      let items = [];
      try {
        items = JSON.parse(o.items);
      } catch {
        items = [{ raw: o.items }];
      }
      return { ...o, items };
    });

    res.status(200).json({ orders: parsed });
  } catch (error) {
    console.error('Customer Orders Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch customer orders.' });
  }
}