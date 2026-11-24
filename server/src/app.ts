import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { publicUploadLimiter } from './middleware/rateLimiter.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import devStorageRouter from './routes/devStorage.js';
import authRouter from './routes/auth.js';
import shopRouter from './routes/shop.js';
import adminRouter from './routes/admin.js';
import publicRouter from './routes/public.js';
import jobsRouter from './routes/jobs.js';
import paymentsRouter from './routes/payments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---- Core Middleware ----
app.use(cors({
  origin: env.isProduction ? true : env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ---- Routes ----
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/shop', shopRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/payments', paymentsRouter);

// Dev-only local storage routes (only when R2 is NOT configured)
if (!env.isR2Configured) {
  app.use('/api/dev-storage', devStorageRouter);
}

// In production, serve the frontend client bundle
if (env.isProduction) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---- Error Handler (must be last) ----
app.use(errorHandler);

export default app;
