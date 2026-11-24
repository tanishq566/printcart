import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { hashPassword, verifyPassword, signToken } from '../utils/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

// Helper to set cookie
const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Live slug availability check
 * GET /api/auth/check-slug/:slug
 */
router.get('/check-slug/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawParam = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const rawSlug = String(rawParam || '').trim().toLowerCase();
    const cleanSlug = rawSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    if (!cleanSlug || cleanSlug.length < 3) {
      res.json({ available: false, slug: cleanSlug, message: 'Slug must be at least 3 characters' });
      return;
    }

    const reserved = ['admin', 'api', 'dashboard', 'login', 'register', 's', 'dev-storage'];
    if (reserved.includes(cleanSlug)) {
      res.json({ available: false, slug: cleanSlug, message: 'This slug is reserved' });
      return;
    }

    const existing = await prisma.shop.findUnique({
      where: { slug: cleanSlug },
      select: { id: true },
    });

    res.json({ available: !existing, slug: cleanSlug });
  } catch (error) {
    console.error('Error checking slug:', error);
    res.status(500).json({ error: 'Failed to verify slug availability' });
  }
});

/**
 * Register a new Shopkeeper
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      shopName,
      slug,
      ownerPhone,
      password,
      city,
      upiId,
      bwRate,
      colorRate,
      idCardRate,
    } = req.body;

    if (!shopName || !ownerPhone || !password) {
      res.status(400).json({ error: 'Shop Name, Phone Number, and Password are required' });
      return;
    }

    const cleanPhone = ownerPhone.toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
      return;
    }

    // Auto-generate or sanitize slug
    let candidateSlug = (slug || shopName)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (candidateSlug.length < 3) {
      candidateSlug = `shop-${cleanPhone.slice(-4)}`;
    }

    // Check unique phone
    const existingPhone = await prisma.shop.findUnique({
      where: { ownerPhone: cleanPhone },
    });
    if (existingPhone) {
      res.status(400).json({ error: 'This phone number is already registered. Please log in.' });
      return;
    }

    // Check unique slug (append random suffix if taken)
    let finalSlug = candidateSlug;
    let slugExists = await prisma.shop.findUnique({ where: { slug: finalSlug } });
    let counter = 1;
    while (slugExists) {
      finalSlug = `${candidateSlug}-${counter}`;
      slugExists = await prisma.shop.findUnique({ where: { slug: finalSlug } });
      counter++;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // 3-day free trial ends at now + 3 days
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 3);

    const shop = await prisma.shop.create({
      data: {
        shopName: shopName.trim(),
        slug: finalSlug,
        ownerPhone: cleanPhone,
        passwordHash,
        city: city ? city.trim() : null,
        upiId: upiId ? upiId.trim() : null,
        bwRate: bwRate !== undefined && !isNaN(Number(bwRate)) ? Number(bwRate) : 2,
        colorRate: colorRate !== undefined && !isNaN(Number(colorRate)) ? Number(colorRate) : 10,
        idCardRate: idCardRate !== undefined && !isNaN(Number(idCardRate)) ? Number(idCardRate) : 10,
        planStatus: 'TRIAL',
        trialEndsAt,
        role: 'SHOPKEEPER',
        isCounterOpen: true,
      },
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
        planStatus: true,
        trialEndsAt: true,
        role: true,
        isCounterOpen: true,
        createdAt: true,
      },
    });

    const token = signToken({ shopId: shop.id, role: shop.role });
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Registration successful! Your 3-day trial is active.',
      token,
      shop,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * Login Shopkeeper or Super Admin
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please enter your phone number / shop slug and password' });
      return;
    }

    const cleanIdentifier = identifier.toString().trim();
    const cleanPhone = cleanIdentifier.replace(/[^0-9]/g, '');

    // Search by phone or slug
    const shop = await prisma.shop.findFirst({
      where: {
        OR: [
          ...(cleanPhone.length >= 10 ? [{ ownerPhone: cleanPhone }] : []),
          { slug: cleanIdentifier.toLowerCase() },
          { ownerPhone: cleanIdentifier },
        ],
      },
    });

    if (!shop) {
      res.status(401).json({ error: 'Invalid phone/slug or password' });
      return;
    }

    const isMatch = await verifyPassword(password, shop.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid phone/slug or password' });
      return;
    }

    const token = signToken({ shopId: shop.id, role: shop.role });
    setAuthCookie(res, token);

    const { passwordHash: _, ...safeShop } = shop;

    res.json({
      message: 'Login successful',
      token,
      shop: safeShop,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Get current authenticated user/shop
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
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
        bwRate: true,
        colorRate: true,
        idCardRate: true,
        planStatus: true,
        trialEndsAt: true,
        paidAt: true,
        role: true,
        isCounterOpen: true,
        createdAt: true,
      },
    });

    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }

    res.json({ shop });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
