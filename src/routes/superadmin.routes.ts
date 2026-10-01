import { Router } from 'express';
import {
  getOverview,
  createShop,
  listShops,
  updateShop,
  deleteShop,
  createAdmin,
  listAdmins,
  deleteAdmin,
} from '../controllers/superadmin.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = Router();

// Strict Super-Admin guard across all routes in this router
router.use(authenticateJWT, requireRole(['superadmin']));

// Platform Metrics
router.get('/overview', getOverview);

// Shop Onboarding & Management
router.post('/shops', createShop);
router.get('/shops', listShops);
router.put('/shops/:id', updateShop);
router.delete('/shops/:id', deleteShop);

// Admin Provisioning & Management
router.post('/admins', createAdmin);
router.get('/admins', listAdmins);
router.delete('/admins/:id', deleteAdmin);

export default router;