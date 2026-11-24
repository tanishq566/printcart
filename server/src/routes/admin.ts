import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all admin endpoints with Super Admin guard
router.use(requireAdmin);

/**
 * Super Admin Overview Metrics
 * GET /api/admin/overview
 */
router.get('/overview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const startOfIstDay = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - istOffset);

    const [
      totalShops,
      paidShops,
      activeTrials,
      totalPrintsToday,
      totalAllTimePrints,
      successfulPayments,
    ] = await Promise.all([
      prisma.shop.count({ where: { role: 'SHOPKEEPER' } }),
      prisma.shop.count({ where: { role: 'SHOPKEEPER', planStatus: 'ACTIVE_LAUNCH' } }),
      prisma.shop.count({
        where: {
          role: 'SHOPKEEPER',
          planStatus: 'TRIAL',
          trialEndsAt: { gt: now },
        },
      }),
      prisma.printJob.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfIstDay },
        },
      }),
      prisma.printJob.count({
        where: {
          status: 'COMPLETED',
        },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amountInr: true },
      }),
    ]);

    // Total revenue: verified payments or active launch shops * 499
    const recordedPaymentSum = successfulPayments._sum.amountInr || 0;
    const calculatedRevenue = Math.max(recordedPaymentSum, paidShops * 499);

    res.json({
      metrics: {
        totalShops,
        paidShops,
        activeTrials,
        totalPrintsToday,
        totalAllTimePrints,
        totalRevenueInr: calculatedRevenue,
      },
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to fetch admin overview metrics' });
  }
});

/**
 * Super Admin Shop Listing & Search
 * GET /api/admin/shops
 */
router.get('/shops', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status ? String(req.query.status) : '';

    const where: any = {
      role: 'SHOPKEEPER',
    };

    if (search) {
      where.OR = [
        { shopName: { contains: search, mode: 'insensitive' } },
        { ownerPhone: { contains: search } },
        { slug: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && ['TRIAL', 'ACTIVE_LAUNCH', 'EXPIRED', 'SUSPENDED'].includes(status)) {
      where.planStatus = status;
    }

    const shops = await prisma.shop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shopName: true,
        slug: true,
        ownerPhone: true,
        city: true,
        upiId: true,
        bwRate: true,
        colorRate: true,
        idCardRate: true,
        isCounterOpen: true,
        planStatus: true,
        trialEndsAt: true,
        paidAt: true,
        createdAt: true,
        _count: {
          select: {
            printJobs: true,
          },
        },
      },
    });

    res.json({ shops });
  } catch (error) {
    console.error('Admin shops error:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

/**
 * Super Admin Manage Shop
 * PATCH /api/admin/shops/:id
 */
router.patch('/shops/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { planStatus, extendTrialDays, isCounterOpen } = req.body;

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }

    const updateData: any = {};

    if (planStatus) {
      updateData.planStatus = planStatus;
      if (planStatus === 'ACTIVE_LAUNCH' && !shop.paidAt) {
        updateData.paidAt = new Date();
      }
    }

    if (extendTrialDays && !isNaN(Number(extendTrialDays))) {
      const days = Number(extendTrialDays);
      const baseDate = shop.trialEndsAt && shop.trialEndsAt > new Date() ? shop.trialEndsAt : new Date();
      const newTrialEnds = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      updateData.trialEndsAt = newTrialEnds;
      updateData.planStatus = 'TRIAL';
    }

    if (isCounterOpen !== undefined) {
      updateData.isCounterOpen = Boolean(isCounterOpen);
    }

    const updated = await prisma.shop.update({
      where: { id: shopId },
      data: updateData,
      select: {
        id: true,
        shopName: true,
        slug: true,
        ownerPhone: true,
        city: true,
        planStatus: true,
        trialEndsAt: true,
        paidAt: true,
        isCounterOpen: true,
      },
    });

    res.json({
      message: 'Shop updated successfully',
      shop: updated,
    });
  } catch (error) {
    console.error('Admin update shop error:', error);
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

export default router;
