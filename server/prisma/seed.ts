import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PrintCart database seed into NeonDB...');

  // 1. Super Admin
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.shop.upsert({
    where: { ownerPhone: '9999999999' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      planStatus: 'ACTIVE_LAUNCH',
    },
    create: {
      shopName: 'PrintCart Super Admin',
      slug: 'super-admin',
      ownerPhone: '9999999999',
      passwordHash: adminPasswordHash,
      city: 'HQ',
      role: 'SUPER_ADMIN',
      planStatus: 'ACTIVE_LAUNCH',
      isCounterOpen: true,
      bwRate: 2,
      colorRate: 10,
      idCardRate: 10,
    },
  });
  console.log(`✅ Super Admin ready: Phone: 9999999999 | Password: Admin@123 (ID: ${admin.id})`);

  // 2. Demo Shopkeeper (/s/demo-shop)
  const demoPasswordHash = await bcrypt.hash('Demo@123', 12);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 3);

  const demoShop = await prisma.shop.upsert({
    where: { slug: 'demo-shop' },
    update: {
      passwordHash: demoPasswordHash,
      ownerPhone: '9876543210',
      shopName: 'Verma Digital Cyber Cafe',
      city: 'Patna, Bihar',
      upiId: 'vermadigital@okhdfcbank',
      bwRate: 2,
      colorRate: 10,
      idCardRate: 10,
      isCounterOpen: true,
      planStatus: 'TRIAL',
      trialEndsAt: trialEnds,
    },
    create: {
      shopName: 'Verma Digital Cyber Cafe',
      slug: 'demo-shop',
      ownerPhone: '9876543210',
      passwordHash: demoPasswordHash,
      city: 'Patna, Bihar',
      upiId: 'vermadigital@okhdfcbank',
      bwRate: 2,
      colorRate: 10,
      idCardRate: 10,
      role: 'SHOPKEEPER',
      isCounterOpen: true,
      planStatus: 'TRIAL',
      trialEndsAt: trialEnds,
      dailyTokenSeq: 14,
      lastTokenDate: new Date().toISOString().slice(0, 10),
    },
  });
  console.log(`✅ Demo Shop ready: Phone: 9876543210 | Slug: demo-shop | Password: Demo@123 (URL: /s/demo-shop)`);

  // 3. Add a few sample print jobs for demo shop today for realistic stats
  const now = new Date();
  const sampleJobsCount = await prisma.printJob.count({ where: { shopId: demoShop.id } });
  if (sampleJobsCount === 0) {
    await prisma.printJob.createMany({
      data: [
        {
          shopId: demoShop.id,
          tokenNumber: 11,
          customerName: 'Rahul Kumar',
          jobType: 'NORMAL',
          fileName: null,
          mimeType: 'application/pdf',
          fileSizeBytes: 245000,
          pageCount: 4,
          copies: 2,
          colorMode: 'BW',
          sides: 'DOUBLE',
          estimatedPrice: 16,
          status: 'COMPLETED',
          expiresAt: new Date(now.getTime() - 30 * 60 * 1000),
          createdAt: new Date(now.getTime() - 40 * 60 * 1000),
          deletedAt: new Date(now.getTime() - 35 * 60 * 1000),
        },
        {
          shopId: demoShop.id,
          tokenNumber: 12,
          customerName: 'Pooja Sharma',
          jobType: 'ID_CARD',
          fileName: null,
          mimeType: 'application/pdf',
          fileSizeBytes: 512000,
          pageCount: 1,
          copies: 1,
          colorMode: 'COLOR',
          sides: 'SINGLE',
          estimatedPrice: 20,
          status: 'COMPLETED',
          expiresAt: new Date(now.getTime() - 15 * 60 * 1000),
          createdAt: new Date(now.getTime() - 25 * 60 * 1000),
          deletedAt: new Date(now.getTime() - 20 * 60 * 1000),
        },
      ],
    });
    console.log('✅ Created initial sample completed stats for Demo Shop');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
