import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { shops, products, orders } from '../db/schema.js';
import { verifyShopOwnership } from '../middleware/ownership.js';

/**
 * GET /api/admin/shop
 * Get own shop profile
 */
export async function getMyShop(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(400).json({ error: 'Bad Request', message: 'No shop associated with this admin account.' });
      return;
    }

    const shop = await db.query.shops.findFirst({
      where: (s, { eq }) => eq(s.id, shopId),
    });

    if (!shop) {
      res.status(404).json({ error: 'Not Found', message: 'Shop record not found.' });
      return;
    }

    res.status(200).json({ shop });
  } catch (error) {
    console.error('Get My Shop Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve shop.' });
  }
}

/**
 * PUT /api/admin/shop
 * Update own shop profile (name, description, logo, banner, status)
 */
export async function updateMyShop(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(400).json({ error: 'Bad Request', message: 'No shop associated with this admin account.' });
      return;
    }

    const { name, description, logoUrl, bannerUrl, status } = req.body;

    const existing = await db.query.shops.findFirst({
      where: (s, { eq }) => eq(s.id, shopId),
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Shop record not found.' });
      return;
    }

    const [updated] = await db
      .update(shops)
      .set({
        name: name !== undefined ? String(name).trim() : existing.name,
        description: description !== undefined ? description : existing.description,
        logoUrl: logoUrl !== undefined ? logoUrl : existing.logoUrl,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : existing.bannerUrl,
        status: status !== undefined ? status : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, shopId))
      .returning();

    res.status(200).json({ message: 'Shop profile updated successfully.', shop: updated });
  } catch (error) {
    console.error('Update My Shop Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update shop profile.' });
  }
}

/**
 * GET /api/admin/products
 * List products strictly scoped to own shop
 */
export async function listShopProducts(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(400).json({ error: 'Bad Request', message: 'No shop associated with this admin account.' });
      return;
    }

    const shopProducts = await db.query.products.findMany({
      where: (p, { eq }) => eq(p.shopId, shopId),
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    });

    res.status(200).json({ products: shopProducts });
  } catch (error) {
    console.error('List Shop Products Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch products.' });
  }
}

/**
 * POST /api/admin/products
 * Create a new product scoped to own shop
 */
export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(400).json({ error: 'Bad Request', message: 'No shop associated with this admin account.' });
      return;
    }

    const { name, description, price, stock, imageUrl, category } = req.body;

    if (!name || price === undefined) {
      res.status(400).json({ error: 'Bad Request', message: 'Product name and price are required.' });
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      res.status(400).json({ error: 'Bad Request', message: 'Price must be a non-negative number.' });
      return;
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        shopId,
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        price: numericPrice.toFixed(2),
        stock: stock !== undefined ? Math.max(0, parseInt(stock, 10)) : 0,
        imageUrl: imageUrl || null,
        category: category ? String(category).trim() : null,
      })
      .returning();

    res.status(201).json({ message: 'Product created successfully.', product: newProduct });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create product.' });
  }
}

/**
 * PUT /api/admin/products/:id
 * Update product with shop ownership policy check (3.4)
 */
export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const shopId = req.user?.shopId;
    const isSuperAdmin = req.user?.role === 'superadmin';

    const existingProduct = await db.query.products.findFirst({
      where: (p, { eq }) => eq(p.id, id),
    });

    if (!existingProduct) {
      res.status(404).json({ error: 'Not Found', message: 'Product not found.' });
      return;
    }

    // 3.4 Ownership policy check
    if (!verifyShopOwnership(existingProduct.shopId, shopId || null, isSuperAdmin)) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to modify this product.' });
      return;
    }

    const { name, description, price, stock, imageUrl, category } = req.body;

    const [updatedProduct] = await db
      .update(products)
      .set({
        name: name !== undefined ? String(name).trim() : existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        price: price !== undefined ? Number(price).toFixed(2) : existingProduct.price,
        stock: stock !== undefined ? Math.max(0, parseInt(stock, 10)) : existingProduct.stock,
        imageUrl: imageUrl !== undefined ? imageUrl : existingProduct.imageUrl,
        category: category !== undefined ? category : existingProduct.category,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    res.status(200).json({ message: 'Product updated successfully.', product: updatedProduct });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update product.' });
  }
}

/**
 * DELETE /api/admin/products/:id
 * Delete product with shop ownership policy check (3.4)
 */
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const shopId = req.user?.shopId;
    const isSuperAdmin = req.user?.role === 'superadmin';

    const existingProduct = await db.query.products.findFirst({
      where: (p, { eq }) => eq(p.id, id),
    });

    if (!existingProduct) {
      res.status(404).json({ error: 'Not Found', message: 'Product not found.' });
      return;
    }

    // 3.4 Ownership policy check
    if (!verifyShopOwnership(existingProduct.shopId, shopId || null, isSuperAdmin)) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to delete this product.' });
      return;
    }

    await db.delete(products).where(eq(products.id, id));
    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete product.' });
  }
}

/**
 * GET /api/admin/orders
 * View all orders for own shop
 */
export async function listShopOrders(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(400).json({ error: 'Bad Request', message: 'No shop associated with this admin account.' });
      return;
    }

    const shopOrders = await db.query.orders.findMany({
      where: (o, { eq }) => eq(o.shopId, shopId),
      with: {
        customer: {
          columns: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    const parsedOrders = shopOrders.map((o) => {
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(o.items);
      } catch {
        parsedItems = [{ raw: o.items }];
      }
      return {
        ...o,
        items: parsedItems,
      };
    });

    res.status(200).json({ orders: parsedOrders });
  } catch (error) {
    console.error('List Shop Orders Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch orders.' });
  }
}

/**
 * PUT /api/admin/orders/:id/status
 * Update order status for own shop
 */
export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const shopId = req.user?.shopId;
    const isSuperAdmin = req.user?.role === 'superadmin';

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Status must be one of: [${validStatuses.join(', ')}]`,
      });
      return;
    }

    const existingOrder = await db.query.orders.findFirst({
      where: (o, { eq }) => eq(o.id, id),
    });

    if (!existingOrder) {
      res.status(404).json({ error: 'Not Found', message: 'Order not found.' });
      return;
    }

    // 3.4 Ownership policy check
    if (!verifyShopOwnership(existingOrder.shopId, shopId || null, isSuperAdmin)) {
      res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to manage this order.' });
      return;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();

    res.status(200).json({ message: 'Order status updated successfully.', order: updatedOrder });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update order status.' });
  }
}