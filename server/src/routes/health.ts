import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    // Quick DB connectivity check
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      storage: env.isR2Configured ? 'cloudflare-r2' : 'local-dev',
      environment: env.NODE_ENV,
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

export default router;
