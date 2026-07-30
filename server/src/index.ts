import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { seedSuperAdmin } from './utils/seed';
import fs from 'fs';
import path from 'path';

async function bootstrap(): Promise<void> {
  try {
    // Ensure upload directory exists
    const uploadDir = path.resolve(config.upload.dir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.info(`📁 Created upload directory: ${uploadDir}`);
    }

    // Connect to database
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Seed super admin
    await seedSuperAdmin();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(
        `🚀 Server running on port ${config.port} in ${config.env} mode`
      );
      logger.info(`📡 API URL: ${config.apiUrl}`);
      logger.info(`🌐 Client URL: ${config.appUrl}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled errors
    process.on('unhandledRejection', (reason: Error) => {
      logger.error({ error: reason }, 'Unhandled Rejection');
    });

    process.on('uncaughtException', (error: Error) => {
      logger.fatal({ error }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

bootstrap();
