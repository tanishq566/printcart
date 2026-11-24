import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { initializeSocketIO } from './lib/socket.js';
import { startCleanupCron } from './services/cleanup.js';

async function bootstrap(): Promise<void> {
  // Create HTTP server and attach Express
  const httpServer = createServer(app);

  // Initialize Socket.io
  initializeSocketIO(httpServer);

  // Start the 15-minute TTL auto-expiry cleanup cron
  startCleanupCron();

  // Start listening
  httpServer.listen(env.PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  🖨️  PrintCart Server (printcart.in)');
    console.log('═══════════════════════════════════════');
    console.log(`  🌐 HTTP:     http://localhost:${env.PORT}`);
    console.log(`  🔌 Socket:   ws://localhost:${env.PORT}`);
    console.log(`  💾 Storage:  ${env.isR2Configured ? 'Cloudflare R2' : 'Local Dev (tmp/uploads)'}`);
    console.log(`  🏗️  Env:      ${env.NODE_ENV}`);
    console.log('═══════════════════════════════════════');
    console.log('');
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
