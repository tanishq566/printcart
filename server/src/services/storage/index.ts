import { env } from '../../config/env.js';
import type { StorageService } from './StorageService.js';
import { R2StorageAdapter } from './R2StorageAdapter.js';
import { LocalStorageAdapter } from './LocalStorageAdapter.js';

let storageInstance: StorageService | null = null;

/**
 * Factory: returns the appropriate StorageService based on environment.
 * Uses Cloudflare R2 when R2_* env vars are configured, otherwise falls
 * back to local tmp/uploads for development.
 */
export function getStorageService(): StorageService {
  if (!storageInstance) {
    if (env.isR2Configured) {
      storageInstance = new R2StorageAdapter();
    } else {
      console.log('⚠️  R2 env vars not found — using local dev storage adapter');
      storageInstance = new LocalStorageAdapter();
    }
  }
  return storageInstance;
}

export type { StorageService } from './StorageService.js';
export { R2StorageAdapter } from './R2StorageAdapter.js';
export { LocalStorageAdapter } from './LocalStorageAdapter.js';
