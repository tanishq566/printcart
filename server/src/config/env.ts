import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load both server/.env and root .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',

  // Cloudflare R2 (optional — omit for local dev fallback)
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'printcart-uploads',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,

  // PhonePe Payment Gateway
  PHONEPE_MODE: (process.env.PHONEPE_MODE || 'mock').toLowerCase(), // mock | sandbox | live
  PHONEPE_CLIENT_ID: process.env.PHONEPE_CLIENT_ID || '',
  PHONEPE_CLIENT_SECRET: process.env.PHONEPE_CLIENT_SECRET || '',
  PHONEPE_CLIENT_VERSION: process.env.PHONEPE_CLIENT_VERSION || '1',
  PHONEPE_MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || '',

  // Client URL for redirects
  CLIENT_URL: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Helpers
  get isR2Configured(): boolean {
    return !!(this.R2_ACCOUNT_ID && this.R2_ACCESS_KEY_ID && this.R2_SECRET_ACCESS_KEY);
  },
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },
} as const;
