import { Router } from 'express';
import {
  getMyShop,
  updateMyShop,
  listShopProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listShopOrders,
  updateOrderStatus,
} from '../controllers/admin.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { requireShopContext } from '../middleware/ownership.js';

const router = Router();

// Strict Admin/SuperAdmin guard & shop context enforcement
router.use(authenticateJWT, requireRole(['admin', 'superadmin']), requireShopContext);

// Shop Profile
router.get('/shop', getMyShop);
router.put('/shop', updateMyShop);

// Products Scoped to Shop
router.get('/products', listShopProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders Scoped to Shop
router.get('/orders', listShopOrders);
router.put('/orders/:id/status', updateOrderStatus);

export default router;