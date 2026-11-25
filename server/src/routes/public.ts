import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { getStorageService } from '../services/storage/index.js';
import { getIO } from '../lib/socket.js';
import { publicUploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * Public Shop Info for Customers
 * GET /api/public/shops/:slug
 */
router.get('/shops/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawParam = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const slug = String(rawParam || '').trim().toLowerCase();

    const shop = await prisma.shop.findUnique({
      where: { slug },
      select: {
        id: true,
        shopName: true,
        slug: true,
        city: true,
        upiId: true,
        customQrUrl: true,
        bwRate: true,
        bwExtraRate: true,
        colorRate: true,
        colorExtraRate: true,
        idCardRate: true,
        isCounterOpen: true,
        planStatus: true,
        trialEndsAt: true,
      },
    });

    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }

    const isExpired =
      shop.planStatus === 'EXPIRED' ||
      shop.planStatus === 'SUSPENDED' ||
      (shop.planStatus === 'TRIAL' && shop.trialEndsAt && shop.trialEndsAt < new Date());

    res.json({
      shop: {
        ...shop,
        isExpired,
      },
    });
  } catch (error) {
    console.error('Error fetching public shop info:', error);
    res.status(500).json({ error: 'Failed to fetch shop details' });
  }
});

/**
 * Step 1: Initialize Print Job & generate Presigned PUT URL
 * POST /api/public/shops/:slug/jobs/init
 */
router.post('/shops/:slug/jobs/init', publicUploadLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const slug = String(rawSlug || '').trim().toLowerCase();

    const shop = await prisma.shop.findUnique({
      where: { slug },
    });

    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }

    // Check expiration / suspension
    const isExpired =
      shop.planStatus === 'EXPIRED' ||
      shop.planStatus === 'SUSPENDED' ||
      (shop.planStatus === 'TRIAL' && shop.trialEndsAt && shop.trialEndsAt < new Date());

    if (isExpired) {
      res.status(403).json({ error: 'This shop subscription has expired or is currently suspended.' });
      return;
    }

    if (!shop.isCounterOpen) {
      res.status(403).json({ error: 'Shop counter is currently CLOSED for uploads.' });
      return;
    }

    const {
      fileName,
      mimeType,
      fileSizeBytes,
      jobType = 'NORMAL',
      pageCount = 1,
      copies = 1,
      colorMode = 'BW',
      sides = 'SINGLE',
      customerName = 'Walk-in',
      paymentMethod = 'COUNTER',
    } = req.body;

    // MIME allowlist validation
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!mimeType || !allowedMimes.includes(mimeType.toLowerCase())) {
      res.status(400).json({ error: 'Invalid file format. Only PDF, JPG, and PNG are allowed.' });
      return;
    }

    // 15 MB limit
    const MAX_SIZE = 15 * 1024 * 1024;
    if (!fileSizeBytes || fileSizeBytes > MAX_SIZE) {
      res.status(400).json({ error: 'File size exceeds maximum limit of 15MB.' });
      return;
    }

    const parsedCopies = Math.max(1, parseInt(String(copies), 10) || 1);
    const parsedPages = Math.max(1, parseInt(String(pageCount), 10) || 1);
    const validColorMode = colorMode === 'COLOR' ? 'COLOR' : 'BW';
    const validSides = sides === 'DOUBLE' ? 'DOUBLE' : 'SINGLE';
    const validJobType = jobType === 'ID_CARD' ? 'ID_CARD' : 'NORMAL';
    const validPaymentMethod = paymentMethod === 'UPI_PAID' ? 'UPI_PAID' : 'COUNTER';

    const calcTieredTotal = (totalPages: number, firstRate: number, extraRate?: number | null): number => {
      if (totalPages <= 0) return 0;
      const effectiveExtra = extraRate !== null && extraRate !== undefined ? extraRate : firstRate;
      const raw = totalPages === 1 ? firstRate : firstRate + (totalPages - 1) * effectiveExtra;
      return Math.round(raw * 100) / 100;
    };

    // Calculate Estimated Price (supports separate rate after 1st page)
    let estimatedPrice = 0;
    if (validJobType === 'ID_CARD') {
      estimatedPrice = Math.round(parsedCopies * (shop.idCardRate || 10) * 100) / 100;
    } else if (validColorMode === 'COLOR') {
      estimatedPrice = calcTieredTotal(parsedPages * parsedCopies, shop.colorRate, shop.colorExtraRate);
    } else {
      estimatedPrice = calcTieredTotal(parsedPages * parsedCopies, shop.bwRate, shop.bwExtraRate);
    }

    // Daily Sequential Token calculation in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset).toISOString().slice(0, 10);

    let nextToken = shop.dailyTokenSeq + 1;
    if (shop.lastTokenDate !== istDate) {
      nextToken = 1;
    }

    // Update shop token sequence
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        dailyTokenSeq: nextToken,
        lastTokenDate: istDate,
      },
    });

    // Object key format: shops/:shopId/:timestamp-:rand.:ext
    const ext = mimeType === 'application/pdf' ? 'pdf' : mimeType === 'image/png' ? 'png' : 'jpg';
    const rawBase = fileName ? String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_') : 'document';
    const cleanFileName = rawBase.toLowerCase().endsWith(`.${ext}`) ? rawBase : `${rawBase}.${ext}`;
    const objectKey = `shops/${shop.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Expiry: 15 minutes TTL
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    // Create PrintJob record (UPLOADING state)
    const job = await prisma.printJob.create({
      data: {
        shopId: shop.id,
        tokenNumber: nextToken,
        customerName: customerName ? String(customerName).trim().slice(0, 50) : 'Walk-in',
        jobType: validJobType,
        fileName: cleanFileName,
        mimeType: mimeType.toLowerCase(),
        fileSizeBytes: Number(fileSizeBytes),
        r2ObjectKey: objectKey,
        pageCount: parsedPages,
        copies: parsedCopies,
        colorMode: validColorMode,
        sides: validSides,
        estimatedPrice,
        paymentMethod: validPaymentMethod,
        status: 'UPLOADING',
        expiresAt,
      },
    });

    // Generate Presigned Upload URL (2 min expiry)
    const storage = getStorageService();
    const presigned = await storage.generatePutUrl(objectKey, mimeType.toLowerCase(), MAX_SIZE, 120);

    res.status(201).json({
      jobId: job.id,
      tokenNumber: job.tokenNumber,
      uploadUrl: presigned.url,
      objectKey,
      estimatedPrice,
      expiresAt: job.expiresAt,
    });
  } catch (error: any) {
    console.error('Job init error:', error);
    res.status(500).json({ error: error.message || 'Failed to initialize upload' });
  }
});

/**
 * Step 2: Confirm file upload completed
 * POST /api/public/jobs/:jobId/confirm
 */
router.post('/jobs/:jobId/confirm', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawJobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const jobId = String(rawJobId);

    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
      include: {
        shop: {
          select: { id: true, shopName: true },
        },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.status !== 'UPLOADING') {
      res.json({ success: true, job });
      return;
    }

    const bodyPayment = req.body?.paymentMethod;
    const nextPaymentMethod =
      bodyPayment === 'UPI_PAID'
        ? 'UPI_PAID'
        : bodyPayment === 'COUNTER'
        ? 'COUNTER'
        : job.paymentMethod;

    const updatedJob = await prisma.printJob.update({
      where: { id: jobId },
      data: {
        status: 'PENDING',
        paymentMethod: nextPaymentMethod,
      },
    });

    // Real-time broadcast to Shopkeeper room
    try {
      const io = getIO();
      const jobCard = {
        id: updatedJob.id,
        tokenNumber: updatedJob.tokenNumber,
        customerName: updatedJob.customerName,
        jobType: updatedJob.jobType,
        fileName: updatedJob.fileName,
        pageCount: updatedJob.pageCount,
        copies: updatedJob.copies,
        colorMode: updatedJob.colorMode,
        sides: updatedJob.sides,
        estimatedPrice: updatedJob.estimatedPrice,
        paymentMethod: updatedJob.paymentMethod,
        status: 'PENDING',
        createdAt: updatedJob.createdAt.toISOString(),
        expiresAt: updatedJob.expiresAt.toISOString(),
      };

      io.to(`shop:${job.shopId}`).emit('job:new', jobCard);
      io.to(`job:${job.id}`).emit('job:status', { jobId: job.id, status: 'PENDING' });
    } catch (socketErr) {
      console.warn('Socket broadcast warning:', socketErr);
    }

    res.json({
      success: true,
      message: 'Job sent to counter successfully',
      job: {
        id: updatedJob.id,
        tokenNumber: updatedJob.tokenNumber,
        status: updatedJob.status,
        estimatedPrice: updatedJob.estimatedPrice,
        paymentMethod: updatedJob.paymentMethod,
      },
    });
  } catch (error: any) {
    console.error('Job confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm job upload' });
  }
});

/**
 * Step 3: Get live status of job for customer tracking
 * GET /api/public/jobs/:jobId
 */
router.get('/jobs/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawJobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
    const jobId = String(rawJobId);

    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        tokenNumber: true,
        customerName: true,
        jobType: true,
        pageCount: true,
        copies: true,
        colorMode: true,
        sides: true,
        estimatedPrice: true,
        paymentMethod: true,
        status: true,
        rejectReason: true,
        createdAt: true,
        expiresAt: true,
        deletedAt: true,
        shop: {
          select: {
            id: true,
            shopName: true,
            upiId: true,
            customQrUrl: true,
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json({ job });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

export default router;
