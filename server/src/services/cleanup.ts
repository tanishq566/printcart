import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { getStorageService } from './storage/index.js';
import { getIO } from '../lib/socket.js';

/**
 * 15-Minute TTL Auto-Expiry Cleanup Engine
 *
 * Runs every 2 minutes. Finds any job with:
 *   - status IN ('PENDING', 'REVIEWING', 'PRINTING')
 *   - expiresAt < NOW()
 *
 * For each expired job:
 *   1. Deletes the R2/local object
 *   2. Updates status to EXPIRED
 *   3. Wipes r2ObjectKey + fileName
 *   4. Notifies shopkeeper and customer via Socket.io
 */
export function startCleanupCron(): void {
  // Runs every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    try {
      const now = new Date();

      // Find all expired jobs that are still in an active state
      const expiredJobs = await prisma.printJob.findMany({
        where: {
          status: { in: ['PENDING', 'REVIEWING', 'PRINTING'] },
          expiresAt: { lt: now },
        },
        select: {
          id: true,
          shopId: true,
          r2ObjectKey: true,
          tokenNumber: true,
        },
      });

      if (expiredJobs.length === 0) return;

      console.log(`🧹 Cleanup: Found ${expiredJobs.length} expired job(s)`);

      const storage = getStorageService();
      const io = getIO();

      for (const job of expiredJobs) {
        try {
          // 1. Delete file from storage
          if (job.r2ObjectKey) {
            await storage.deleteObject(job.r2ObjectKey);
          }

          // 2. Update DB: mark EXPIRED, wipe file references
          await prisma.printJob.update({
            where: { id: job.id },
            data: {
              status: 'EXPIRED',
              r2ObjectKey: null,
              fileName: null,
              deletedAt: now,
            },
          });

          // 3. Notify via Socket.io
          const statusPayload = {
            jobId: job.id,
            status: 'EXPIRED',
            deletedAt: now.toISOString(),
          };

          io.to(`shop:${job.shopId}`).emit('job:status', statusPayload);
          io.to(`job:${job.id}`).emit('job:status', statusPayload);

          console.log(`  ✓ Expired job #${job.tokenNumber} (${job.id})`);
        } catch (err) {
          console.error(`  ✗ Failed to expire job ${job.id}:`, err);
        }
      }
    } catch (err) {
      console.error('🧹 Cleanup cron error:', err);
    }
  });

  console.log('⏰ Cleanup cron started (runs every 2 minutes)');
}
