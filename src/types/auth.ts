import { UserRole } from '../db/schema.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  shopId: string | null;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  shopId: string | null;
  iat?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}