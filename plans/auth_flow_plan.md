# Super Admin -> Admin -> Customer Flow Plan

## Comprehensive Architecture & Implementation Plan: Super Admin -> Admin -> Customer Flow
*(Custom JWT auth, bcrypt passwords, no token expiration, Supabase + Drizzle ORM, role stored in DB)*

---

### 1. Project Foundations
| Step | Description | Owner | Estimated |
|------|------------|-------|-----------|
| **1.1** | Add **Drizzle ORM** & Postgres driver to the server (`npm i drizzle-orm pg dotenv` and `npm i -D drizzle-kit @types/pg`) | Backend | 2 h |
| **1.2** | Create a **Supabase Postgres** schema (via Drizzle) with tables: `users`, `shops`, `products`, `orders` | Backend | 3 h |
| **1.3** | Add a **role** column (enum: `'superadmin'`, `'admin'`, `'customer'`) to `users` table | Backend | 1 h |
| **1.4** | Seed a **Super-Admin** user (hardcoded email/password or seed script) - used for first-time onboarding | Backend | 30 min |
| **1.5** | Set up **environment variables** (`DATABASE_URL`, `JWT_SECRET`, `BCRYPT_SALT_ROUNDS`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) | DevOps | 30 min |

### 2. Authentication & Authorization (Backend)
| Step | Description | Owner | Estimated |
|------|------------|-------|-----------|
| **2.1** | Install **bcrypt** (`npm i bcrypt` / `npm i -D @types/bcrypt`) and **jsonwebtoken** (`npm i jsonwebtoken` / `npm i -D @types/jsonwebtoken`) | Backend | 30 min |
| **2.2** | **Register** endpoint: hash password with bcrypt, store email, `password_hash`, `role = 'customer'` by default | Backend | 1 h |
| **2.3** | **Login** endpoint: verify password, issue **JWT** (`jwt.sign({ sub: user.id, email: user.email, role: user.role, shopId: user.shopId }, JWT_SECRET)`) - no expiration (per requirement) | Backend | 1 h |
| **2.4** | **Auth middleware**: verify JWT, attach `req.user = { id, email, role, shopId }` | Backend | 1 h |
| **2.5** | **Role-based guard** helper (`requireRole(['admin', 'superadmin'])`) for protected route access control | Backend | 45 min |
| **2.6** | **Refresh-token** intentionally **omitted** (per user decision) | Architecture | - |

### 3. Role Management & Business Logic API (Backend)
| Step | Description | Owner | Estimated |
|------|------------|-------|-----------|
| **3.1** | **Super-Admin** routes (`/api/superadmin/*`): <br> - **Create Admin** (assign `role = 'admin'` & associate with a shop) <br> - **List / Deactivate / Delete Admins** <br> - **Onboard & Manage Shops** (create shop, assign admin, view platform overview) | Backend | 2 h |
| **3.2** | **Admin** routes (`/api/admin/*`): <br> - **CRUD** for products & categories scoped to own shop <br> - **View & manage orders** for own shop <br> - **Update shop profile** (name, description, logo, banner, status) | Backend | 3 h |
| **3.3** | **Customer** routes (`/api/*`): <br> - Public catalog & shop browsing <br> - Cart & checkout / order placement <br> - Customer profile & order history | Backend | 2 h |
| **3.4** | Add **policy checks & shop ownership enforcement** in each route (`req.user.shopId === resource.shopId`) | Backend | 45 min |

### 4. Front-End Integration (Modern Web Client)
| Step | Description | Owner | Estimated |
|------|------------|-------|-----------|
| **4.1** | Install dependencies (`axios`, `jwt-decode`, icons, router) | Frontend | 15 min |
| **4.2** | Create **AuthContext** (stores token, decoded user info, role, shopId) and **ProtectedRoute** component that redirects based on role | Frontend | 1 h |
| **4.3** | **Login / Register** pages styled per rich design guidelines (glassmorphism, subtle glowing gradients, smooth micro-interactions) | Frontend | 2 h |
| **4.4** | **Super-Admin Dashboard**: <br> - Platform stats (total shops, admins, revenue) <br> - Shop onboarding wizard <br> - Admin creation & assignment modal | Frontend | 3 h |
| **4.5** | **Admin Dashboard**: <br> - Product catalog manager with image preview <br> - Shop-scoped order management with live status update <br> - Shop profile customization | Frontend | 3 h |
| **4.6** | **Customer UI**: <br> - Storefront browsing, shop discovery, product details <br> - Cart drawer, checkout, order tracking | Frontend | 2 h |
| **4.7** | Add **toast notifications & feedback states** for auth errors, role access denials, and success alerts | Frontend | 45 min |
| **4.8** | SEO: dynamic `<title>`, semantic meta descriptions, heading hierarchy (`<h1>`), unique DOM element IDs | Frontend | 30 min |

### 5. Design & Visual Polish (All Screens)
*Adhering to modern, rich aesthetics standards*

| Element | Implementation |
|---------|----------------|
| **Color Palette** | Dark-mode canvas (`#0b0f17`), surface glass (`rgba(255, 255, 255, 0.04)`), vivid emerald/teal accents (`hsl(165, 80%, 48%)` to `hsl(190, 90%, 50%)`), crisp high-contrast text |
| **Typography** | Inter / Outfit from Google Fonts (400, 500, 600, 700) |
| **Glassmorphism** | `backdrop-filter: blur(16px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px;` |
| **Micro-Animations** | Hover elevation (`transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);`), smooth modal transitions, animated pill badges |
| **Icons & Indicators** | Clean modern SVG icons for dashboard actions, status tags, and role badges |
| **Responsive** | Responsive grid/flex layouts optimized across mobile, tablet, and desktop viewports |

### 6. Testing & Quality Assurance
| Type | Scope |
|------|-------|
| **Unit** | JWT signing/verification, bcrypt hashing, role guard functions |
| **Integration** | Register -> login -> role-based route access (Super-Admin, Admin, Customer) |
| **E2E / Flow Testing** | Full flow: Super-Admin creates shop & admin -> Admin logs in & creates product -> Customer views & orders |
| **Security Verification** | Passwords salted & hashed, JWT secret kept in server env, strict role/shop boundary validation |

### 7. Deployment & Configuration
| Task | Details |
|------|---------|
| **Scripts** | `npm run dev`, `npm run db:generate`, `npm run db:push`, `npm run db:seed` |
| **Environment** | `.env.example` documenting Supabase credentials and JWT secrets |
| **Health Check** | `/health` route returning DB connectivity status and system health |

---

### Implementation Progress
- [x] **1.1 Add Drizzle ORM & Postgres driver to the server** (`drizzle-orm`, `pg`, `drizzle-kit`, `dotenv`, `tsx`, `typescript`)
- [x] **1.2 Create Supabase Postgres schema** (`src/db/schema.ts` with `users`, `shops`, `products`, `orders`)
- [x] **1.3 Add role column** (`roleEnum` with `'superadmin'`, `'admin'`, `'customer'` on `users`)
- [x] **1.4 Seed Super-Admin user script** (`src/db/seed.ts` with bcrypt hashing)
- [x] **1.5 Set up environment variables** (`.env.example` & `.env` configured)
- [x] **Generate SQL migrations** (`drizzle/0000_regular_argent.sql` generated and verified)
- [x] **Phase 2: Authentication & Authorization (Backend)**
  - [x] **2.1 Dependencies**: `bcrypt`, `jsonwebtoken`, `@types/bcrypt`, `@types/jsonwebtoken` installed
  - [x] **2.2 Register endpoint** (`POST /api/auth/register` with bcrypt hash and default `role = 'customer'`)
  - [x] **2.3 Login endpoint** (`POST /api/auth/login` issuing non-expiring JWT with `sub`, `email`, `role`, `shopId`)
  - [x] **2.4 Auth middleware** (`authenticateJWT` verifying token and attaching `req.user`)
  - [x] **2.5 Role-based guard** (`requireRole(['admin', 'superadmin'])`)
  - [x] **2.6 Refresh tokens omitted** (per design requirement)
- [x] **Phase 3: Role Management API (Backend)**
  - [x] **3.1 Super-Admin routes** (`/api/superadmin/*`):
    - Platform overview metrics (`GET /overview`)
    - Onboard & manage shops (`POST/GET/PUT/DELETE /shops`)
    - Create Admin with bcrypt password and shop linkage (`POST /admins`)
    - List and delete admins (`GET/DELETE /admins`)
  - [x] **3.2 Admin routes** (`/api/admin/*`):
    - Shop profile update & view (`GET/PUT /shop`)
    - Products CRUD scoped strictly to own shop (`GET/POST/PUT/DELETE /products`)
    - Shop orders list & status updates (`GET /orders`, `PUT /orders/:id/status`)
  - [x] **3.3 Customer routes** (`/api/*`):
    - Public catalog & shop browsing (`GET /shops`, `GET /shops/:slug`, `GET /products`, `GET /products/:id`)
    - Cart checkout / order placement (`POST /orders`)
    - Order history (`GET /orders`)
  - [x] **3.4 Policy checks & shop ownership enforcement** (`requireShopContext` and `verifyShopOwnership`)
- [x] **Phase 4: Front-End Integration (Modern Web Client)**
  - [x] 4.1 Install dependencies (`axios`, `jwt-decode`, `lucide-react`, `react-router-dom`)
  - [x] 4.2 Create `AuthContext` (JWT decoding, role tracking, auto-hydration) and `ProtectedRoute` component
  - [x] 4.3 `Login` & `Register` pages with glassmorphism, glowing accents, and 1-click demo role shortcuts
  - [x] 4.4 `SuperAdminDashboard`: Platform metrics, store onboarding wizard modal, merchant admin provisioning & assignment
  - [x] 4.5 `AdminDashboard`: Shop profile customization, Product catalog CRUD with live image preview, shop-scoped order fulfillment & status updating
  - [x] 4.6 `CustomerStore` storefront: Shop discovery chips, category filters, real-time search, cart drawer, multi-store order checkout
  - [x] 4.7 Toast notifications (`ToastContext`) with animated feedback alerts for all actions
  - [x] 4.8 SEO: dynamic `<title>`, semantic meta descriptions, heading hierarchy (`<h1>`), and unique DOM elements
- [x] **Phase 5: Design & Visual Polish (All Screens)**
  - [x] 5.1 Color Palette: `#0b0f17` dark canvas, surface glass (`rgba(255, 255, 255, 0.04)`), vivid emerald/teal accents (`hsl(165, 80%, 48%)` to `hsl(190, 90%, 50%)`), crisp high-contrast typography
  - [x] 5.2 Typography: Google Fonts `Outfit` and `Inter` (300-800) with antialiasing
  - [x] 5.3 Glassmorphism: `16px` backdrop-blur, `14px` border radius, refined translucent borders
  - [x] 5.4 Micro-Animations: `translateY(-2px)` hover elevations, smooth modal entrance keyframes (`animate-modal-in`), cart drawer slide (`animate-drawer-in`), interactive pill badges
  - [x] 5.5 Icons & Indicators: Complete Lucide SVG icons across store badges, role indicators, and dashboard quick actions
  - [x] 5.6 Responsive layouts across mobile, tablet, and widescreen desktop viewports
- [x] **Phase 6: Testing & Quality Assurance**
  - [x] 6.1 Unit Tests: Bcrypt password hashing & salt checks, non-expiring JWT signing/verification, token forgery detection, and `requireRole` middleware authorization.
  - [x] 6.2 Security Verification: Cross-tenant shop isolation (`verifyShopOwnership`), Bearer token validation, strict role access control.
  - [x] 6.3 E2E / Flow Testing: Multi-tier lifecycle simulation (SuperAdmin provisions store & admin -> Admin manages product -> Customer registers & orders -> Admin fulfills order).
  - [x] 6.4 Automated Test Suite: Configured `npm test` script with 8/8 test suites passing cleanly.
- [x] **Phase 7: Deployment & Configuration**
  - [x] 7.1 NPM Scripts: `dev`, `build`, `test`, `db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:studio` in [package.json](file:///c:/Users/Systems/Desktop/e%20commerce%20website/package.json)
  - [x] 7.2 Environment Documentation: Comprehensive `.env.example` documenting Supabase credentials, JWT secrets, bcrypt rounds, and initial seed defaults
  - [x] 7.3 Health Check: Live `/health` route reporting server operational status, database connectivity status (`connected` / `disconnected`), latency measurement, and environment metadata