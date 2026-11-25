import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getStorageService } from '../services/storage/index.js';
import { getIO } from '../lib/socket.js';

const router = Router();

// Protect all routes with shopkeeper authentication
router.use(requireAuth);

/**
 * Get active pending jobs for current shop
 * GET /api/jobs/pending
 */
router.get('/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.auth!.shopId;

    const jobs = await prisma.printJob.findMany({
      where: {
        shopId,
        status: { in: ['PENDING', 'REVIEWING', 'PRINTING'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tokenNumber: true,
        customerName: true,
        jobType: true,
        fileName: true,
        mimeType: true,
        fileSizeBytes: true,
        pageCount: true,
        copies: true,
        colorMode: true,
        sides: true,
        estimatedPrice: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    res.json({ jobs });
  } catch (error) {
    console.error('Error fetching pending jobs:', error);
    res.status(500).json({ error: 'Failed to fetch pending jobs' });
  }
});

/**
 * Get presigned preview GET URL for selected job
 * GET /api/jobs/:jobId/preview-url
 */
router.get('/:jobId/preview-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.auth!.shopId;
    const rawJobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const jobId = String(rawJobId);

    const job = await prisma.printJob.findFirst({
      where: { id: jobId, shopId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found or access denied' });
      return;
    }

    if (!job.r2ObjectKey) {
      res.status(410).json({ error: 'File has already been permanently deleted from server' });
      return;
    }

    // Update status to REVIEWING if it was PENDING
    if (job.status === 'PENDING') {
      await prisma.printJob.update({
        where: { id: job.id },
        data: { status: 'REVIEWING' },
      });

      try {
        const io = getIO();
        const payload = { jobId: job.id, status: 'REVIEWING' };
        io.to(`shop:${shopId}`).emit('job:status', payload);
        io.to(`job:${job.id}`).emit('job:status', payload);
      } catch (err) {
        console.warn('Socket emit error:', err);
      }
    }

    const storage = getStorageService();
    const previewUrl = await storage.generateGetUrl(job.r2ObjectKey, 120);

    res.json({
      previewUrl,
      mimeType: job.mimeType,
      fileName: job.fileName,
      pageCount: job.pageCount,
    });
  } catch (error) {
    console.error('Error generating preview URL:', error);
    res.status(500).json({ error: 'Failed to generate preview URL' });
  }
});

/**
 * Mark job status as PRINTING
 * POST /api/jobs/:jobId/printing
 */
router.post('/:jobId/printing', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.auth!.shopId;
    const rawJobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const jobId = String(rawJobId);

    const job = await prisma.printJob.findFirst({
      where: { id: jobId, shopId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    await prisma.printJob.update({
      where: { id: job.id },
      data: { status: 'PRINTING' },
    });

    try {
      const io = getIO();
      const payload = { jobId: job.id, status: 'PRINTING' };
      io.to(`shop:${shopId}`).emit('job:status', payload);
      io.to(`job:${job.id}`).emit('job:status', payload);
    } catch (err) {
      console.warn('Socket emit error:', err);
    }

    res.json({ success: true, status: 'PRINTING' });
  } catch (error) {
    console.error('Error marking printing:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

/**
 * Mark job COMPLETED & IMMEDIATELY delete file from storage
 * POST /api/jobs/:jobId/complete
 */
router.post('/:jobId/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.auth!.shopId;
    const rawJobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const jobId = String(rawJobId);

    const job = await prisma.printJob.findFirst({
      where: { id: jobId, shopId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // 1. Permanently delete file from storage
    if (job.r2ObjectKey) {
      try {
        const storage = getStorageService();
        await storage.deleteObject(job.r2ObjectKey);
      } catch (storageErr) {
        console.error(`Failed to delete storage object ${job.r2ObjectKey}:`, storageErr);
      }
    }

    // 2. Wipe r2ObjectKey and filename, mark COMPLETED
    const now = new Date();
    await prisma.printJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        r2ObjectKey: null,
        fileName: null,
        deletedAt: now,
      },
    });

    // 3. Emit real-time completion
    try {
      const io = getIO();
      const payload = {
        jobId: job.id,
        status: 'COMPLETED',
        deletedAt: now.toISOString(),
      };
      io.to(`shop:${shopId}`).emit('job:status', payload);
      io.to(`job:${job.id}`).emit('job:status', payload);
    } catch (err) {
      console.warn('Socket emit error:', err);
    }

    res.json({
      success: true,
      message: 'Job completed and file permanently deleted from server',
      deletedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ error: 'Failed to complete job' });
  }
});

/**
 * Reject job & IMMEDIATELY delete file from storage
 * POST /api/jobs/:jobId/reject
 */
router.post('/:jobId/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.auth!.shopId;
    const rawJobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const jobId = String(rawJobId);
    const { reason = 'Rejected by shopkeeper' } = req.body;

    const job = await prisma.printJob.findFirst({
      where: { id: jobId, shopId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // 1. Permanently delete file from storage
    if (job.r2ObjectKey) {
      try {
        const storage = getStorageService();
        await storage.deleteObject(job.r2ObjectKey);
      } catch (storageErr) {
        console.error(`Failed to delete storage object ${job.r2ObjectKey}:`, storageErr);
      }
    }

    // 2. Wipe r2ObjectKey and filename, mark REJECTED
    const now = new Date();
    await prisma.printJob.update({
      where: { id: job.id },
      data: {
        status: 'REJECTED',
        rejectReason: String(reason).trim(),
        r2ObjectKey: null,
        fileName: null,
        deletedAt: now,
      },
    });

    // 3. Emit real-time rejection
    try {
      const io = getIO();
      const payload = {
        jobId: job.id,
        status: 'REJECTED',
        rejectReason: String(reason).trim(),
        deletedAt: now.toISOString(),
      };
      io.to(`shop:${shopId}`).emit('job:status', payload);
      io.to(`job:${job.id}`).emit('job:status', payload);
    } catch (err) {
      console.warn('Socket emit error:', err);
    }

    res.json({
      success: true,
      message: 'Job rejected and file permanently deleted',
    });
  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({ error: 'Failed to reject job' });
  }
});

export default router;
