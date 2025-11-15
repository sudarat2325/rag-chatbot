import { getRedisClient, isRedisAvailable } from './redis';
import logger from '../logger/winston';

// In-memory cache fallback (when Redis is not available)
class InMemoryCache {
  private cache: Map<string, { value: string; expiry: number | null }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching (only supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.cache.keys()).filter((key) => regex.test(key));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry && entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Singleton in-memory cache
const memoryCache = new InMemoryCache();

/**
 * Cache utility that works with or without Redis
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const redis = getRedisClient();

      if (redis && isRedisAvailable()) {
        const value = await redis.get(key);
        if (value) {
          logger.debug('Cache HIT (Redis)', { key });
          return JSON.parse(value);
        }
      } else {
        const value = await memoryCache.get(key);
        if (value) {
          logger.debug('Cache HIT (Memory)', { key });
          return JSON.parse(value);
        }
      }

      logger.debug('Cache MISS', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  /**
   * Set value in cache
   */
  async set<T = unknown>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const redis = getRedisClient();

      if (redis && isRedisAvailable()) {
        await redis.setex(key, ttlSeconds, serialized);
        logger.debug('Cache SET (Redis)', { key, ttl: ttlSeconds });
      } else {
        await memoryCache.set(key, serialized, ttlSeconds);
        logger.debug('Cache SET (Memory)', { key, ttl: ttlSeconds });
      }
    } catch (error) {
      logger.error('Cache set error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      const redis = getRedisClient();

      if (redis && isRedisAvailable()) {
        await redis.del(key);
        logger.debug('Cache DEL (Redis)', { key });
      } else {
        await memoryCache.del(key);
        logger.debug('Cache DEL (Memory)', { key });
      }
    } catch (error) {
      logger.error('Cache delete error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const redis = getRedisClient();

      if (redis && isRedisAvailable()) {
        return (await redis.exists(key)) === 1;
      } else {
        return await memoryCache.exists(key);
      }
    } catch (error) {
      logger.error('Cache exists error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  },

  /**
   * Clear all cache or keys matching pattern
   */
  async clear(pattern?: string): Promise<void> {
    try {
      const redis = getRedisClient();

      if (redis && isRedisAvailable()) {
        if (pattern) {
          const keys = await redis.keys(pattern);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
          logger.info('Cache cleared (Redis)', { pattern, count: keys.length });
        } else {
          await redis.flushdb();
          logger.warn('All cache cleared (Redis)');
        }
      } else {
        if (pattern) {
          const keys = await memoryCache.keys(pattern);
          for (const key of keys) {
            await memoryCache.del(key);
          }
          logger.info('Cache cleared (Memory)', { pattern, count: keys.length });
        } else {
          await memoryCache.clear();
          logger.warn('All cache cleared (Memory)');
        }
      }
    } catch (error) {
      logger.error('Cache clear error', {
        pattern,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  /**
   * Get or Set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T = unknown>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    await this.set(key, data, ttlSeconds);

    return data;
  },

  /**
   * Increment value (useful for counters)
   */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const redis = getRedisClient();

      if (redis && isRedisAvailable()) {
        const value = await redis.incr(key);
        if (ttlSeconds) {
          await redis.expire(key, ttlSeconds);
        }
        return value;
      } else {
        const current = await memoryCache.get(key);
        const newValue = current ? parseInt(current, 10) + 1 : 1;
        await memoryCache.set(key, String(newValue), ttlSeconds);
        return newValue;
      }
    } catch (error) {
      logger.error('Cache incr error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  },
};

// Cache key generators
export const CacheKeys = {
  restaurant: (id: string) => `restaurant:${id}`,
  restaurants: (filters?: string) => `restaurants:${filters || 'all'}`,
  menu: (restaurantId: string) => `menu:${restaurantId}`,
  order: (id: string) => `order:${id}`,
  orders: (userId: string) => `orders:user:${userId}`,
  user: (id: string) => `user:${id}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  search: (query: string) => `search:${query}`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

export default cache;
