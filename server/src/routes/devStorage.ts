import { Router } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { LocalStorageAdapter } from '../services/storage/LocalStorageAdapter.js';

const router = Router();

// Handle CORS preflight for simulated presigned PUT
router.options(['/upload/:key', '/upload/*'], (_req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

/**
 * DEV/LOCAL: Simulated presigned PUT — receives file upload for local storage.
 * Supports wildcard to handle subdirectories like shops/:shopId/:file.ext
 */
router.put(['/upload/:key', '/upload/*'], async (req, res) => {
  try {
    const rawKey = (req.params as any)[0] || req.params.key;
    const key = decodeURIComponent(rawKey).replace(/^\/+/, '');
    const filePath = LocalStorageAdapter.getFilePath(key);

    // Ensure parent directory exists
    await fsp.mkdir(path.dirname(filePath), { recursive: true });

    // Stream directly to file on disk
    const writeStream = fs.createWriteStream(filePath);
    await pipeline(req, writeStream);

    console.log(`📁 Local storage upload: ${key} saved to disk`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Local storage upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * DEV/LOCAL: Simulated presigned GET — serves file from local storage.
 */
router.get(['/download/:key', '/download/*'], async (req, res) => {
  try {
    const rawKey = (req.params as any)[0] || req.params.key;
    const key = decodeURIComponent(rawKey).replace(/^\/+/, '');
    const filePath = LocalStorageAdapter.getFilePath(key);

    const stat = await fsp.stat(filePath);
    const data = await fsp.readFile(filePath);

    // Infer content type from extension
    const ext = path.extname(key).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };

    res.set('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.set('Content-Length', stat.size.toString());
    res.send(data);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Download failed' });
    }
  }
});

export default router;
