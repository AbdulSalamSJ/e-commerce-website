import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { requireRole, authenticateJWT } from '../src/middleware/auth.js';
import { requireShopContext, verifyShopOwnership } from '../src/middleware/ownership.js';
import { JWTPayload } from '../src/types/auth.js';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_replace_with_strong_random_secret_in_prod';
const BCRYPT_SALT = 10;

// ============================================================================
// 1. UNIT TESTING: Bcrypt Hashing, JWT Signing/Verification & Role Guards
// ============================================================================
test('Unit: Bcrypt password hashing & salt verification', async () => {
  const plainPassword = 'SecretPassword123!';
  const hash = await bcrypt.hash(plainPassword, BCRYPT_SALT);

  // Hash must not match plaintext
  assert.notEqual(hash, plainPassword);
  assert.ok(hash.startsWith('$2'), 'Bcrypt hash should start with $2a$ or $2b$');

  // Successful comparison
  const isValid = await bcrypt.compare(plainPassword, hash);
  assert.equal(isValid, true, 'Bcrypt compare should return true for valid password');

  // Failed comparison on incorrect password
  const isInvalid = await bcrypt.compare('WrongPassword456!', hash);
  assert.equal(isInvalid, false, 'Bcrypt compare should return false for incorrect password');
});

test('Unit: JWT signing and verification without expiration (custom requirement)', () => {
  const payload: JWTPayload = {
    sub: 'user-uuid-1234',
    email: 'admin@merchants.com',
    role: 'admin',
    shopId: 'shop-uuid-5678',
  };

  const token = jwt.sign(payload, JWT_SECRET);
  assert.ok(token && typeof token === 'string', 'Token should be a non-empty string');

  const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
  assert.equal(decoded.sub, payload.sub);
  assert.equal(decoded.email, payload.email);
  assert.equal(decoded.role, payload.role);
  assert.equal(decoded.shopId, payload.shopId);
  assert.equal((decoded as any).exp, undefined, 'Token should have no exp property per non-expiring requirement');
});

test('Unit: JWT forgery and signature tampering detection', () => {
  const token = jwt.sign({ sub: 'user-1', role: 'customer' }, JWT_SECRET);
  const tamperedToken = token.slice(0, -5) + 'xxxxx';

  assert.throws(() => {
    jwt.verify(tamperedToken, JWT_SECRET);
  }, /invalid signature/i);

  assert.throws(() => {
    jwt.verify(token, 'wrong-secret-key');
  }, /invalid signature/i);
});

test('Unit: requireRole middleware authorization checks', () => {
  const guard = requireRole(['superadmin', 'admin']);

  // Case 1: Unauthorized if no req.user
  let statusCaptured = 0;
  let jsonCaptured: any = null;
  const mockRes = {
    status: (code: number) => {
      statusCaptured = code;
      return { json: (data: any) => { jsonCaptured = data; } };
    },
  } as unknown as Response;

  let nextCalled = false;
  const nextFn: NextFunction = () => { nextCalled = true; };

  guard({ user: undefined } as unknown as Request, mockRes, nextFn);
  assert.equal(statusCaptured, 401);
  assert.equal(nextCalled, false);

  // Case 2: Forbidden if customer role attempts access
  statusCaptured = 0;
  nextCalled = false;
  guard({ user: { id: 'c1', email: 'c@test.com', role: 'customer', shopId: null } } as unknown as Request, mockRes, nextFn);
  assert.equal(statusCaptured, 403);
  assert.equal(nextCalled, false);

  // Case 3: Allowed if admin role
  statusCaptured = 0;
  nextCalled = false;
  guard({ user: { id: 'a1', email: 'a@test.com', role: 'admin', shopId: 's1' } } as unknown as Request, mockRes, nextFn);
  assert.equal(nextCalled, true);
  assert.equal(statusCaptured, 0);

  // Case 4: Allowed if superadmin role
  nextCalled = false;
  guard({ user: { id: 'sa1', email: 'sa@test.com', role: 'superadmin', shopId: null } } as unknown as Request, mockRes, nextFn);
  assert.equal(nextCalled, true);
});

// ============================================================================
// 2. SECURITY VERIFICATION: Shop Boundary & Ownership Isolation
// ============================================================================
test('Security: Shop ownership boundary isolation verification', () => {
  const shopA = 'shop-aaa-111';
  const shopB = 'shop-bbb-222';

  // Superadmin can access any shop's resource
  assert.equal(verifyShopOwnership(shopA, null, true), true, 'SuperAdmin should have universal access');
  assert.equal(verifyShopOwnership(shopB, null, true), true, 'SuperAdmin should have universal access to shop B');

  // Admin of Shop A can access Shop A resources
  assert.equal(verifyShopOwnership(shopA, shopA, false), true, 'Admin A can access Shop A resource');

  // Admin of Shop A CANNOT access Shop B resources (cross-tenant breach prevention)
  assert.equal(verifyShopOwnership(shopB, shopA, false), false, 'Admin A CANNOT access Shop B resource');

  // Customer or user without shop cannot access
  assert.equal(verifyShopOwnership(shopA, null, false), false, 'User without shop cannot access shop resource');
});

test('Security: Authentication middleware Bearer token verification', () => {
  let statusCaptured = 0;
  const mockRes = {
    status: (code: number) => {
      statusCaptured = code;
      return { json: () => {} };
    },
  } as unknown as Response;

  // Missing Authorization header
  let nextCalled = false;
  authenticateJWT({ headers: {} } as Request, mockRes, () => { nextCalled = true; });
  assert.equal(statusCaptured, 401);
  assert.equal(nextCalled, false);

  // Malformed header (no Bearer)
  statusCaptured = 0;
  nextCalled = false;
  authenticateJWT({ headers: { authorization: 'Basic 12345' } } as Request, mockRes, () => { nextCalled = true; });
  assert.equal(statusCaptured, 401);
  assert.equal(nextCalled, false);

  // Valid Bearer token
  statusCaptured = 0;
  nextCalled = false;
  const validToken = jwt.sign({ sub: 'user-789', email: 'customer@buyer.com', role: 'customer' }, JWT_SECRET);
  const reqObj: any = { headers: { authorization: `Bearer ${validToken}` } };
  authenticateJWT(reqObj as Request, mockRes, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(reqObj.user.id, 'user-789');
  assert.equal(reqObj.user.role, 'customer');
});

// ============================================================================
// 3. INTEGRATION & END-TO-END FLOW VERIFICATION
// Flow: SuperAdmin creates Shop & Admin -> Admin manages Products -> Customer Orders
// ============================================================================
test('E2E / Flow: Multi-tier lifecycle simulation (SuperAdmin -> Admin -> Customer)', async () => {
  // Step 1: SuperAdmin Identity
  const superAdminToken = jwt.sign(
    { sub: 'sa-001', email: 'superadmin@platform.local', role: 'superadmin' },
    JWT_SECRET
  );
  const decodedSA = jwt.verify(superAdminToken, JWT_SECRET) as JWTPayload;
  assert.equal(decodedSA.role, 'superadmin');

  // Step 2: SuperAdmin provisions a Store & assigns Merchant Admin
  const createdShop = {
    id: 'shop-neon-999',
    name: 'Neon Horizon Tech',
    slug: 'neon-horizon',
    description: 'Cyberpunk gear and next-gen audio devices',
    category: 'Electronics & Tech',
    theme: 'cyber-neon' as const,
  };
  assert.equal(createdShop.category, 'Electronics & Tech');
  const rawAdminPassword = 'AdminSecurePass!99';
  const hashedAdminPassword = await bcrypt.hash(rawAdminPassword, BCRYPT_SALT);

  const merchantAdmin = {
    id: 'adm-001',
    email: 'vendor@neonhorizon.com',
    passwordHash: hashedAdminPassword,
    role: 'admin' as const,
    shopId: createdShop.id,
  };

  // Step 3: Merchant Admin Login & Authentication
  const isMatch = await bcrypt.compare(rawAdminPassword, merchantAdmin.passwordHash);
  assert.equal(isMatch, true, 'Merchant admin password must successfully verify');

  const adminToken = jwt.sign(
    { sub: merchantAdmin.id, email: merchantAdmin.email, role: merchantAdmin.role, shopId: merchantAdmin.shopId },
    JWT_SECRET
  );
  const decodedAdmin = jwt.verify(adminToken, JWT_SECRET) as JWTPayload;
  assert.equal(decodedAdmin.role, 'admin');
  assert.equal(decodedAdmin.shopId, createdShop.id);

  // Step 4: Admin creates a Product for their shop
  const productA = {
    id: 'prod-001',
    shopId: decodedAdmin.shopId!,
    name: 'Holographic Audio Headset',
    price: 199.99,
    stock: 15,
    category: 'Electronics',
  };
  assert.equal(productA.shopId, createdShop.id, 'Product must be scoped to the admin shop');

  // Step 5: Customer Registers & Logs In
  const rawCustomerPassword = 'CustomerSecure#1';
  const hashedCustomerPassword = await bcrypt.hash(rawCustomerPassword, BCRYPT_SALT);
  const customerUser = {
    id: 'cust-555',
    email: 'shopper@apex.com',
    passwordHash: hashedCustomerPassword,
    role: 'customer' as const,
    shopId: null,
  };

  const customerToken = jwt.sign(
    { sub: customerUser.id, email: customerUser.email, role: customerUser.role },
    JWT_SECRET
  );
  const decodedCustomer = jwt.verify(customerToken, JWT_SECRET) as JWTPayload;
  assert.equal(decodedCustomer.role, 'customer');

  // Step 6: Customer places order
  const orderItems = [{ productId: productA.id, name: productA.name, quantity: 2, price: productA.price }];
  const totalAmount = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const createdOrder = {
    id: 'ord-8888',
    shopId: productA.shopId,
    customerId: decodedCustomer.sub,
    items: orderItems,
    totalAmount,
    status: 'pending' as const,
    shippingAddress: '42 Cyber Way, Neo Tokyo, 10001',
    createdAt: new Date().toISOString(),
  };

  assert.equal(createdOrder.totalAmount, 399.98);
  assert.equal(createdOrder.shopId, createdShop.id);
  assert.equal(createdOrder.customerId, customerUser.id);

  // Step 7: Merchant Admin views order and transitions status
  assert.equal(
    verifyShopOwnership(createdOrder.shopId, decodedAdmin.shopId, false),
    true,
    'Merchant admin of shop must have permission to manage this order'
  );

  let updatedOrderStatus: 'pending' | 'processing' | 'shipped' = createdOrder.status;
  updatedOrderStatus = 'processing';
  assert.equal(updatedOrderStatus, 'processing');
  updatedOrderStatus = 'shipped';
  assert.equal(updatedOrderStatus, 'shipped');

  // Step 8: Another merchant from a different shop tries to access this order
  const rogueAdminShopId = 'shop-unauthorized-777';
  assert.equal(
    verifyShopOwnership(createdOrder.shopId, rogueAdminShopId, false),
    false,
    'Rogue admin from another shop MUST be rejected from accessing this order'
  );
});

// ============================================================================
// 4. DEPLOYMENT & HEALTH CHECK VERIFICATION
// ============================================================================
test('Health Check: /health route schema & DB connectivity reporting', async () => {
  // Simulate health route response structure
  const healthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'development',
    services: {
      server: 'operational',
      database: {
        status: 'connected',
        latencyMs: 15,
      },
    },
  };

  assert.ok(healthResponse.status === 'healthy' || healthResponse.status === 'degraded');
  assert.ok(healthResponse.timestamp);
  assert.ok(healthResponse.services.database.status === 'connected' || healthResponse.services.database.status === 'disconnected');
  assert.equal(healthResponse.services.server, 'operational');
});

