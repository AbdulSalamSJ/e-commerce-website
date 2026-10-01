import { pgTable, uuid, text, timestamp, decimal, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1.3 Role Enum definition: 'superadmin', 'admin', 'customer'
export const roleEnum = pgEnum('user_role', ['superadmin', 'admin', 'customer']);

// Shops Table (Multi-tenant shop profile)
export const shops = pgTable('shops', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  status: text('status').default('active').notNull(), // 'active', 'suspended', 'pending'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Users Table (Role stored in DB, shopId linked for 'admin' users)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name'),
  role: roleEnum('role').default('customer').notNull(),
  shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Products Table (Scoped to shop)
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').default(0).notNull(),
  imageUrl: text('image_url'),
  category: text('category'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Orders Table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => users.id, { onDelete: 'set null' }),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
  items: text('items').notNull(), // JSON payload string
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const shopsRelations = relations(shops, ({ many }) => ({
  users: many(users),
  products: many(products),
  orders: many(orders),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  shop: one(shops, {
    fields: [users.shopId],
    references: [shops.id],
  }),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one }) => ({
  shop: one(shops, {
    fields: [products.shopId],
    references: [shops.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  shop: one(shops, {
    fields: [orders.shopId],
    references: [shops.id],
  }),
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
}));

// Export inferred types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type UserRole = (typeof roleEnum.enumValues)[number];