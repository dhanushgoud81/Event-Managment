import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

// In-memory fallback for development when Redis is not available
class InMemoryStore {
  private store = new Map<string, { value: string; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
    let expiry: number | undefined;
    // Parse EX argument (seconds)
    const exIndex = args.indexOf('EX');
    if (exIndex !== -1 && args[exIndex + 1]) {
      expiry = Date.now() + Number(args[exIndex + 1]) * 1000;
    }
    // Parse PX argument (milliseconds)
    const pxIndex = args.indexOf('PX');
    if (pxIndex !== -1 && args[pxIndex + 1]) {
      expiry = Date.now() + Number(args[pxIndex + 1]);
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0', 10) + 1).toString();
    const entry = this.store.get(key);
    this.store.set(key, { value: newValue, expiry: entry?.expiry });
    return parseInt(newValue, 10);
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiry = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (!entry.expiry) return -1;
    return Math.ceil((entry.expiry - Date.now()) / 1000);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }
}

let memoryStore: InMemoryStore | null = null;

export function getRedisClient(): Redis | InMemoryStore {
  if (redis) return redis;
  if (memoryStore) return memoryStore;

  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) {
          logger.warn('Redis connection failed after 3 retries, falling back to in-memory store');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    };

    redis = new Redis(redisConfig);

    redis.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redis.on('error', (error) => {
      logger.warn({ error: error.message }, '⚠️ Redis connection error, using in-memory fallback');
      redis = null;
      if (!memoryStore) {
        memoryStore = new InMemoryStore();
      }
    });

    return redis;
  } catch {
    logger.warn('⚠️ Redis not available, using in-memory store');
    memoryStore = new InMemoryStore();
    return memoryStore;
  }
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  if (client instanceof Redis) {
    try {
      await client.connect();
    } catch {
      logger.warn('⚠️ Redis connection failed, using in-memory fallback');
      redis = null;
      memoryStore = new InMemoryStore();
    }
  }
}

export { InMemoryStore };
