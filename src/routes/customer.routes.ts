import { Router } from 'express';
import {
  listActiveShops,
  getShopBySlug,
  listPublicProducts,
  getPublicProduct,
  placeOrder,
  getCustomerOrders,
} from '../controllers/customer.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Public Storefront & Catalog
router.get('/shops', listActiveShops);
router.get('/shops/:slug', getShopBySlug);
router.get('/products', listPublicProducts);
router.get('/products/:id', getPublicProduct);

// Customer Checkout & Orders (Protected)
router.post('/orders', authenticateJWT, placeOrder);
router.get('/orders', authenticateJWT, getCustomerOrders);

export default router;