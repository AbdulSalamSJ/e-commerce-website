import { Request, Response, NextFunction } from 'express';

/**
 * 3.4 Shop Ownership Enforcement Middleware:
 * Verifies that the authenticated user is either:
 * 1. A 'superadmin' (who has overarching platform access), or
 * 2. An 'admin' assigned to a specific shop (req.user.shopId must match).
 */
export function requireShopContext(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    return;
  }

  // Superadmins can optionally act across shops or specify a target shop via query/header/body
  if (req.user.role === 'superadmin') {
    const targetShopId = (req.query.shopId as string) || (req.headers['x-shop-id'] as string) || req.body.shopId || req.user.shopId;
    if (targetShopId) {
      req.user.shopId = targetShopId;
    }
    return next();
  }

  // For Admin role, shopId must be linked in their DB record
  if (req.user.role === 'admin') {
    if (!req.user.shopId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin account is not currently assigned to any shop.',
      });
      return;
    }
    return next();
  }

  res.status(403).json({
    error: 'Forbidden',
    message: 'Access restricted to Shop Admins or Super Admins.',
  });
}

/**
 * Helper to verify that a resource belongs to the current user's shop
 */
export function verifyShopOwnership(resourceShopId: string, userShopId: string | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return Boolean(userShopId && userShopId === resourceShopId);
}