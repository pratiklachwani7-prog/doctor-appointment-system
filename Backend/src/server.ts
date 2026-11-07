import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import app from './app.js';
import logger from './shared/utils/logger.js';

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          env: config.env,
          frontend: config.frontendUrl,
        },
        `Server started on port ${config.port} in ${config.env} mode`
      );
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutting down gracefully...');
      server.close(async () => {
        await import('./config/database.js').then(m => m.disconnectDatabase());
        logger.info('Server closed');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
