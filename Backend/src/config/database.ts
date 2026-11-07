import mongoose from 'mongoose';
import { config } from './index.js';
import logger from '../shared/utils/logger.js';

export async function connectDatabase(): Promise<void> {
  try {
    const uri = config.mongodb.uri;

    // Check if it's a replica set URI (required for transactions)
    const isReplicaSet = uri.includes('replicaSet=') || uri.includes('replicaset=');

    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      w: 'majority',
    };

    await mongoose.connect(uri, options);

    logger.info({ uri: uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') }, 'MongoDB connected');

    // Initialize replica set if not already initialized (for local development)
    if (config.env === 'development' && !isReplicaSet) {
      try {
        await initializeReplicaSet();
      } catch (error) {
        logger.warn({ error }, 'Replica set initialization skipped or failed');
      }
    }
  } catch (error) {
    logger.error({ error }, 'MongoDB connection failed');
    process.exit(1);
  }
}

async function initializeReplicaSet(): Promise<void> {
  try {
    const adminDb = mongoose.connection.db?.admin();
    if (!adminDb) return;

    const status = await adminDb.command({ replSetGetStatus: 1 });
    if (status.ok === 1) {
      logger.info('Replica set already initialized');
      return;
    }
  } catch {
    // Not a replica set, try to initiate
  }

  try {
    const adminDb = mongoose.connection.db?.admin();
    if (adminDb) {
      await adminDb.command({
        replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] },
      });
      logger.info('Replica set initiated');
    }
  } catch (error) {
    logger.warn({ error }, 'Could not initiate replica set (may require manual setup)');
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

export function getConnection(): typeof mongoose {
  return mongoose;
}
