import 'server-only';

import { getReadyRedisClient } from './redis';

type CacheOptions = {
  ttlSeconds: number;
};

export async function rememberJson<T>(
  key: string,
  options: CacheOptions,
  loader: () => Promise<T>,
): Promise<T> {
  const cachedValue = await readJson<T>(key);
  if (cachedValue.hit) {
    logCache('HIT', key);
    return cachedValue.value;
  }

  logCache('MISS', key);
  const value = await loader();
  void writeJson(key, value, options.ttlSeconds);

  return value;
}

export async function incrementCacheCounter(key: string, ttlSeconds: number) {
  try {
    const redis = await getReadyRedisClient();
    if (!redis) return null;

    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, ttlSeconds);

    return count;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[redis-cache] counter skipped:',
        error instanceof Error ? error.message : error,
      );
    }

    return null;
  }
}

export async function forgetJson(...keys: string[]) {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));
  if (!uniqueKeys.length) return;

  try {
    const redis = await getReadyRedisClient();
    if (!redis) return;

    await redis.del(...uniqueKeys);
    logCache('DELETE', uniqueKeys.join(','));
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[redis-cache] delete skipped:', error instanceof Error ? error.message : error);
    }
  }
}

export async function forgetJsonByPattern(...patterns: string[]) {
  const uniquePatterns = Array.from(new Set(patterns.filter(Boolean)));
  if (!uniquePatterns.length) return;

  try {
    const redis = await getReadyRedisClient();
    if (!redis) return;

    for (const pattern of uniquePatterns) {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length) {
          await redis.del(...keys);
          logCache('DELETE', `${pattern} (${keys.length})`);
        }
      } while (cursor !== '0');
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[redis-cache] pattern delete skipped:',
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function readJson<T>(key: string): Promise<{ hit: true; value: T } | { hit: false }> {
  try {
    const redis = await getReadyRedisClient();
    if (!redis) {
      logCache('SKIP', key);
      return { hit: false };
    }

    const rawValue = await redis.get(key);
    if (!rawValue) return { hit: false };

    return { hit: true, value: JSON.parse(rawValue) as T };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[redis-cache] read skipped:', error instanceof Error ? error.message : error);
    }

    return { hit: false };
  }
}

async function writeJson(key: string, value: unknown, ttlSeconds: number) {
  try {
    const redis = await getReadyRedisClient();
    if (!redis) return;

    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    logCache('WRITE', `${key} (${ttlSeconds}s)`);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[redis-cache] write skipped:', error instanceof Error ? error.message : error);
    }
  }
}

function logCache(event: 'HIT' | 'MISS' | 'SKIP' | 'WRITE' | 'DELETE', message: string) {
  if (process.env.NODE_ENV === 'production') return;
  console.info(`[redis-cache] ${event} ${message}`);
}
