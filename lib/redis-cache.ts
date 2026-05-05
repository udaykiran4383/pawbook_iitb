type CacheEntry<T> = {
  value: T;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

function isRedisConfigured() {
  return Boolean(redisUrl && redisToken);
}

async function callRedis<T>(command: string, args: Array<string | number>): Promise<T | null> {
  if (!isRedisConfigured()) return null;

  const response = await fetch(`${redisUrl}/${command}/${args.map((arg) => encodeURIComponent(String(arg))).join('/')}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Redis command failed: ${response.status} ${response.statusText}`);
  }

  const body = await response.json();
  return (body?.result ?? null) as T | null;
}

export async function redisGetJSON<T>(key: string): Promise<T | null> {
  const raw = await callRedis<string>('get', [key]);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as CacheEntry<T>;
  return parsed.value;
}

export async function redisSetJSON<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
  await callRedis('set', [key, JSON.stringify({ value }), 'EX', ttlSeconds]);
}

export async function redisDel(key: string): Promise<void> {
  await callRedis('del', [key]);
}
