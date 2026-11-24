import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

// Base URLs for PhonePe
const PHONEPE_HOSTS = {
  sandbox: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  live: 'https://api.phonepe.com/apis/hermes',
};

/**
 * Helper to obtain PhonePe OAuth token in sandbox/live mode
 */
async function getPhonePeAuthToken(mode: 'sandbox' | 'live'): Promise<string> {
  const host = PHONEPE_HOSTS[mode];
  const url = `${host}/v1/oauth/token`;

  const params = new URLSearchParams();
  params.append('client_id', env.PHONEPE_CLIENT_ID);
  params.append('client_secret', env.PHONEPE_CLIENT_SECRET);
  params.append('client_version', env.PHONEPE_CLIENT_VERSION || '1');
  params.append('grant_type', 'client_credentials');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PhonePe Auth failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Step 1: Create PhonePe Payment Order
 * POST /api/payments/create-order
 */
router.post('/create-order', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.auth!.shopId;
    const amountInr = 499;
    const amountPaise = amountInr * 100;

    const merchantOrderId = `PC_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create Payment record in DB (status: CREATED)
    await prisma.payment.create({
      data: {
        shopId,
        amountInr,
        merchantOrderId,
        gateway: 'PHONEPE',
        status: 'CREATED',
      },
    });

    const isMock =
      env.PHONEPE_MODE === 'mock' ||
      !env.PHONEPE_CLIENT_ID ||
      !env.PHONEPE_CLIENT_SECRET;

    if (isMock) {
      // Mock Mode: Clean simulated checkout
      res.json({
        mockMode: true,
        merchantOrderId,
        amountInr,
        message: 'PhonePe Mock Mode: Ready for instant test simulation.',
      });
      return;
    }

    // Sandbox or Live Mode: PhonePe Standard Checkout
    const mode = env.PHONEPE_MODE as 'sandbox' | 'live';
    const host = PHONEPE_HOSTS[mode];
    const token = await getPhonePeAuthToken(mode);

    const redirectUrl = `${env.CLIENT_URL}/payment/status/${merchantOrderId}`;

    const createOrderUrl = `${host}/checkout/v2/order`;
    const payload = {
      merchantOrderId,
      amount: amountPaise,
      merchantId: env.PHONEPE_MERCHANT_ID,
      redirectUrl,
      notes: {
        shopId,
        platform: 'PrintCart',
      },
    };

    const orderRes = await fetch(createOrderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `O-Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      throw new Error(`PhonePe Create Order failed: ${err}`);
    }

    const orderData = await orderRes.json();
    const checkoutUrl = orderData.redirectUrl || orderData.data?.redirectUrl;

    res.json({
      mockMode: false,
      merchantOrderId,
      redirectUrl: checkoutUrl || redirectUrl,
    });
  } catch (error: any) {
    console.error('PhonePe create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment order' });
  }
});

/**
 * Step 2: Verify PhonePe Payment
 * POST /api/payments/verify
 */
router.post('/verify', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.auth!.shopId;
    const { merchantOrderId, mockMode } = req.body;

    if (!merchantOrderId) {
      res.status(400).json({ error: 'merchantOrderId is required' });
      return;
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantOrderId },
    });

    if (!payment || payment.shopId !== shopId) {
      res.status(404).json({ error: 'Payment record not found or access denied' });
      return;
    }

    // If already verified
    if (payment.status === 'PAID') {
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      res.json({
        success: true,
        message: 'Payment already verified.',
        shop,
      });
      return;
    }

    const isMock =
      mockMode ||
      env.PHONEPE_MODE === 'mock' ||
      !env.PHONEPE_CLIENT_ID ||
      !env.PHONEPE_CLIENT_SECRET;

    if (isMock) {
      // Mock Mode Verification
      const now = new Date();
      await prisma.$transaction([
        prisma.payment.update({
          where: { merchantOrderId },
          data: {
            status: 'PAID',
            phonepeTxnId: `T_MOCK_${Date.now()}`,
          },
        }),
        prisma.shop.update({
          where: { id: shopId },
          data: {
            planStatus: 'ACTIVE_LAUNCH',
            paidAt: now,
          },
        }),
      ]);

      const updatedShop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          id: true,
          shopName: true,
          slug: true,
          planStatus: true,
          paidAt: true,
        },
      });

      res.json({
        success: true,
        message: '₹499 Launch Offer activated successfully via PhonePe! Lifetime access unlocked.',
        shop: updatedShop,
      });
      return;
    }

    // Live or Sandbox PhonePe Order Status API
    const mode = env.PHONEPE_MODE as 'sandbox' | 'live';
    const host = PHONEPE_HOSTS[mode];
    const token = await getPhonePeAuthToken(mode);

    const statusUrl = `${host}/checkout/v2/order/${merchantOrderId}/status`;
    const statusRes = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        Authorization: `O-Bearer ${token}`,
      },
    });

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      res.status(400).json({ error: `PhonePe Status Check failed: ${errText}` });
      return;
    }

    const statusData = await statusRes.json();
    const state = statusData.state || statusData.data?.state;
    const txnId = statusData.transactionId || statusData.data?.transactionId;

    if (state === 'COMPLETED' || state === 'PAYMENT_SUCCESS') {
      const now = new Date();
      await prisma.$transaction([
        prisma.payment.update({
          where: { merchantOrderId },
          data: {
            status: 'PAID',
            phonepeTxnId: txnId || `T_PP_${Date.now()}`,
          },
        }),
        prisma.shop.update({
          where: { id: shopId },
          data: {
            planStatus: 'ACTIVE_LAUNCH',
            paidAt: now,
          },
        }),
      ]);

      const updatedShop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          id: true,
          shopName: true,
          slug: true,
          planStatus: true,
          paidAt: true,
        },
      });

      res.json({
        success: true,
        message: 'PhonePe payment verified successfully! Lifetime access unlocked.',
        shop: updatedShop,
      });
    } else {
      res.status(400).json({
        success: false,
        status: state,
        message: 'Payment has not been completed yet.',
      });
    }
  } catch (error: any) {
    console.error('PhonePe verify error:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
});

/**
 * Step 3: PhonePe Webhook (Server-to-Server Callback)
 * POST /api/payments/webhook
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { response } = req.body;
    if (!response) {
      res.status(400).json({ error: 'Missing response payload' });
      return;
    }

    // Decode base64 payload
    const decoded = JSON.parse(Buffer.from(response, 'base64').toString('utf8'));
    const merchantOrderId = decoded.data?.merchantOrderId;
    const code = decoded.code;
    const txnId = decoded.data?.transactionId;

    if (code === 'PAYMENT_SUCCESS' && merchantOrderId) {
      const payment = await prisma.payment.findUnique({
        where: { merchantOrderId },
      });

      if (payment && payment.status !== 'PAID') {
        const now = new Date();
        await prisma.$transaction([
          prisma.payment.update({
            where: { merchantOrderId },
            data: {
              status: 'PAID',
              phonepeTxnId: txnId || `T_WH_${Date.now()}`,
            },
          }),
          prisma.shop.update({
            where: { id: payment.shopId },
            data: {
              planStatus: 'ACTIVE_LAUNCH',
              paidAt: now,
            },
          }),
        ]);
        console.log(`✅ PhonePe Webhook: Activated plan for shop ${payment.shopId} via order ${merchantOrderId}`);
      }
    }

    res.json({ status: 'SUCCESS' });
  } catch (err: any) {
    console.error('PhonePe webhook error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

export default router;
