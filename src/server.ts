import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import superAdminRoutes from './routes/superadmin.routes.js';
import adminRoutes from './routes/admin.routes.js';
import customerRoutes from './routes/customer.routes.js';
import { pool } from './db/client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Core Middleware
app.use(cors());
app.use(express.json());

// System Health Check (Database connectivity & system health)
app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const startTime = Date.now();
    const client = await Promise.race([
      pool.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timed out (10000ms)')), 10000)
      ),
    ]);

    try {
      await client.query('SELECT 1');
      dbStatus = 'connected';
      dbLatencyMs = Date.now() - startTime;
    } finally {
      client.release();
    }
  } catch (err: any) {
    dbStatus = 'disconnected';
    dbError = err.message || 'Unable to establish database connectivity';
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      server: 'operational',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
    },
  });
});

// Mounted Routers
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', customerRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist.',
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('==================================================');
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Health check:        http://localhost:${PORT}/health`);
    console.log(`Auth endpoints:      http://localhost:${PORT}/api/auth/*`);
    console.log(`SuperAdmin endpoints:http://localhost:${PORT}/api/superadmin/*`);
    console.log(`Shop Admin endpoints:http://localhost:${PORT}/api/admin/*`);
    console.log(`Customer & Catalog:  http://localhost:${PORT}/api/*`);
    console.log('==================================================');
  });
}

export default app;