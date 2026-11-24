import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { StorageService, PresignedUrlResult } from './StorageService.js';
import { env } from '../../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../../tmp/uploads');

/**
 * Local filesystem storage adapter for development.
 * Simulates presigned URLs by using local Express routes.
 *
 * PUT:  POST http://localhost:PORT/api/dev-storage/upload/:key
 * GET:  GET  http://localhost:PORT/api/dev-storage/download/:key
 */
export class LocalStorageAdapter implements StorageService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `http://localhost:${env.PORT}/api/dev-storage`;
    this.ensureUploadDir();
    console.log('📁 Storage: Local dev adapter initialized (tmp/uploads)');
  }

  private async ensureUploadDir(): Promise<void> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }

  async generatePutUrl(
    key: string,
    _contentType: string,
    _maxSizeBytes: number,
    expiresIn = 120,
  ): Promise<PresignedUrlResult> {
    // In local dev, the "presigned URL" is just our local upload endpoint
    const url = `${this.baseUrl}/upload/${encodeURIComponent(key)}`;
    return { url, key, expiresIn };
  }

  async generateGetUrl(key: string, _expiresIn = 120): Promise<string> {
    return `${this.baseUrl}/download/${encodeURIComponent(key)}`;
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, key);
    try {
      await fs.unlink(filePath);
      console.log(`🗑️  Local: Deleted file ${key}`);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
      // File already gone — that's fine
    }
  }

  /**
   * Get the absolute path for a stored file (used by dev-storage routes).
   */
  static getFilePath(key: string): string {
    return path.join(UPLOAD_DIR, key);
  }

  static getUploadDir(): string {
    return UPLOAD_DIR;
  }
}
