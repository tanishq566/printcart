import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { LocalStorageAdapter } from '../services/storage/LocalStorageAdapter.js';

const router = Router();

/**
 * DEV ONLY: Simulated presigned PUT — receives file upload for local storage.
 */
router.put('/upload/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const filePath = LocalStorageAdapter.getFilePath(key);

    // Ensure parent directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      await fs.writeFile(filePath, buffer);
      console.log(`📁 Dev upload: ${key} (${buffer.length} bytes)`);
      res.status(200).json({ success: true });
    });
  } catch (err) {
    console.error('Dev upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * DEV ONLY: Simulated presigned GET — serves file from local storage.
 */
router.get('/download/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const filePath = LocalStorageAdapter.getFilePath(key);

    const stat = await fs.stat(filePath);
    const data = await fs.readFile(filePath);

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
