import { Redis } from 'ioredis';
import logger from '../logger/winston';

let redisClient: Redis | null = null;
let isConnected = false;

// Redis configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times: number) => {
    if (times > 3) {
      logger.warn('Redis connection retry limit reached');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 1000, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true, // Don't connect immediately
};

/**
 * Initialize Redis connection (optional)
 * App will work without Redis, but with degraded caching performance
 */
export async function initRedis(): Promise<Redis | null> {
  // Skip if already initialized
  if (redisClient) {
    return redisClient;
  }

  // Skip if Redis is disabled
  if (process.env.REDIS_ENABLED === 'false') {
    logger.info('Redis is disabled via environment variable');
    return null;
  }

  try {
    redisClient = new Redis(REDIS_CONFIG);

    // Event handlers
    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('✅ Redis client connected and ready', {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
        db: REDIS_CONFIG.db,
      });
    });

    redisClient.on('error', (error) => {
      isConnected = false;
      logger.warn('Redis connection error (app will continue without cache)', {
        error: error.message,
      });
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    // Try to connect
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.warn('Failed to initialize Redis (app will continue without cache)', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  return isConnected ? redisClient : null;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info('Redis connection closed');
  }
}

/**
 * Flush all Redis data (use with caution!)
 */
export async function flushRedis(): Promise<void> {
  if (redisClient && isConnected) {
    await redisClient.flushdb();
    logger.warn('Redis database flushed');
  }
}

export default redisClient;
