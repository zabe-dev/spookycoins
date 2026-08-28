type CacheEntry<T> = {
  value?: T;
  expiresAt: number;
  staleUntil: number;
  pending?: Promise<T>;
};

const cache = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  staleMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;

  if (existing?.value !== undefined && now < existing.expiresAt) return existing.value;
  if (existing?.pending) return existing.pending;

  const load = loader()
    .then((value) => {
      cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
        staleUntil: Date.now() + ttlMs + staleMs,
      });
      return value;
    })
    .catch((error) => {
      if (existing?.value !== undefined && now < existing.staleUntil) {
        cache.set(key, { ...existing, pending: undefined });
        return existing.value;
      }
      cache.delete(key);
      throw error;
    });

  cache.set(key, {
    ...existing,
    expiresAt: existing?.expiresAt ?? 0,
    staleUntil: existing?.staleUntil ?? 0,
    pending: load,
  });
  return load;
}
