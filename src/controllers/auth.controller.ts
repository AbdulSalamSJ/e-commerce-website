import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { JWTPayload } from '../types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_replace_with_strong_random_secret_in_prod';
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT) || 10;

/**
 * 2.2 Register Endpoint
 * Hashes password with bcrypt, creates user with role = 'customer' by default.
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required fields.',
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email address format.',
      });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'A user with this email address already exists.',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Insert user with default role 'customer'
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        fullName: fullName ? String(fullName).trim() : null,
        role: 'customer',
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        shopId: users.shopId,
        createdAt: users.createdAt,
      });

    // Generate JWT token (no expiration per requirement)
    const tokenPayload: JWTPayload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      shopId: newUser.shopId,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET);

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: newUser,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    const dbMsg = !process.env.DATABASE_URL
      ? 'Database configuration missing: DATABASE_URL is not set.'
      : (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('timeout')
         ? 'Database connection failure. Please verify database connectivity.'
         : 'An unexpected error occurred during registration.');
    res.status(500).json({
      error: 'Internal Server Error',
      message: dbMsg,
    });
  }
}

/**
 * 2.3 Login Endpoint
 * Verifies password against bcrypt hash, issues non-expiring JWT.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required.',
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Query user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    // Compare bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    // 2.3 Sign JWT with no expiration (no expiresIn property)
    const tokenPayload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        shopId: user.shopId,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    const dbMsg = !process.env.DATABASE_URL
      ? 'Database configuration missing: DATABASE_URL is not configured.'
      : (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('timeout')
         ? 'Database connection failure. Please verify database connectivity.'
         : 'An unexpected error occurred during login.');
    res.status(500).json({
      error: 'Internal Server Error',
      message: dbMsg,
    });
  }
}

/**
 * Get Current Authenticated User (/api/auth/me)
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        passwordHash: false,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'User record no longer exists.' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}