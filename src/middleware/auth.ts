import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth.js';
import { UserRole } from '../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_replace_with_strong_random_secret_in_prod';

/**
 * 2.4 Auth Middleware:
 * Extracts Bearer token from Authorization header, verifies JWT,
 * and attaches req.user = { id, email, role, shopId }
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      shopId: decoded.shopId ?? null,
    };

    next();
  } catch (err) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or forged authentication token.',
    });
  }
}

/**
 * 2.5 Role-Based Guard:
 * Ensures the authenticated user has one of the allowed roles.
 * Usage: requireRole(['superadmin', 'admin'])
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required prior to role evaluation.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires one of: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}