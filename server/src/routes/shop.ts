import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All shop endpoints require authentication
router.use(requireAuth);

/**
 * Get current shop profile & settings
 * GET /api/shop/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.auth!.shopId },
      select: {
        id: true,
        shopName: true,
        slug: true,
        ownerPhone: true,
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
        paidAt: true,
        role: true,
        dailyTokenSeq: true,
        createdAt: true,
      },
    });

    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }

    res.json({ shop });
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).json({ error: 'Failed to fetch shop details' });
  }
});

/**
 * Update shop settings (Rates, UPI, Counter Open/Close, Profile)
 * PATCH /api/shop/settings
 */
router.patch('/settings', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.auth!.shopId;
    const {
      shopName,
      city,
      upiId,
      customQrUrl,
      bwRate,
      bwExtraRate,
      colorRate,
      colorExtraRate,
      idCardRate,
      isCounterOpen,
    } = req.body;

    const updateData: any = {};

    if (shopName !== undefined) updateData.shopName = shopName.toString().trim();
    if (city !== undefined) updateData.city = city ? city.toString().trim() : null;
    if (upiId !== undefined) updateData.upiId = upiId ? upiId.toString().trim() : null;
    if (customQrUrl !== undefined) {
      if (!customQrUrl || typeof customQrUrl !== 'string' || customQrUrl.trim() === '') {
        updateData.customQrUrl = null;
      } else {
        const trimmedQr = customQrUrl.trim();
        const isSafeQr = trimmedQr.startsWith('data:image/') || trimmedQr.startsWith('https://');
        if (!isSafeQr || trimmedQr.length > 450000) {
          res.status(400).json({ error: 'Invalid QR image format or size (max 300KB).' });
          return;
        }
        updateData.customQrUrl = trimmedQr;
      }
    }
    if (bwRate !== undefined && !isNaN(Number(bwRate))) updateData.bwRate = Math.max(0, Number(bwRate));
    if (bwExtraRate !== undefined) {
      updateData.bwExtraRate =
        bwExtraRate === null || bwExtraRate === '' || isNaN(Number(bwExtraRate))
          ? null
          : Math.max(0, Number(bwExtraRate));
    }
    if (colorRate !== undefined && !isNaN(Number(colorRate))) updateData.colorRate = Math.max(0, Number(colorRate));
    if (colorExtraRate !== undefined) {
      updateData.colorExtraRate =
        colorExtraRate === null || colorExtraRate === '' || isNaN(Number(colorExtraRate))
          ? null
          : Math.max(0, Number(colorExtraRate));
    }
    if (idCardRate !== undefined && !isNaN(Number(idCardRate))) updateData.idCardRate = Math.max(0, Number(idCardRate));
    if (isCounterOpen !== undefined) updateData.isCounterOpen = Boolean(isCounterOpen);

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: updateData,
      select: {
        id: true,
        shopName: true,
        slug: true,
        ownerPhone: true,
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
        paidAt: true,
        role: true,
      },
    });

    res.json({
      message: 'Settings updated successfully',
      shop: updatedShop,
    });
  } catch (error: any) {
    console.error('Error updating shop settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * Get today's live stats
 * GET /api/shop/stats/today
 */
router.get('/stats/today', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.auth!.shopId;

    // Calculate start of today in IST (UTC+5:30) or local day
    const now = new Date();
    // Offset for IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const startOfIstDay = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - istOffset);

    // Completed print jobs today
    const completedJobs = await prisma.printJob.findMany({
      where: {
        shopId,
        status: 'COMPLETED',
        createdAt: { gte: startOfIstDay },
      },
      select: {
        id: true,
        pageCount: true,
        copies: true,
        estimatedPrice: true,
        colorMode: true,
        jobType: true,
      },
    });

    const completedCount = completedJobs.length;
    const totalPrints = completedJobs.reduce((sum, j) => sum + (j.pageCount * j.copies), 0);
    const estimatedRevenue = completedJobs.reduce((sum, j) => sum + j.estimatedPrice, 0);

    // Active pending queue count
    const activeQueueCount = await prisma.printJob.count({
      where: {
        shopId,
        status: { in: ['PENDING', 'REVIEWING', 'PRINTING'] },
      },
    });

    res.json({
      stats: {
        completedJobs: completedCount,
        totalPrints,
        estimatedRevenue,
        activeQueueCount,
      },
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily statistics' });
  }
});

export default router;
