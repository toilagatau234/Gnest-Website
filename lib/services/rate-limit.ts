interface RateLimitRule {
  limit: number;
  windowMs: number;
}

const rules: Record<string, RateLimitRule> = {
  ip: { limit: 5, windowMs: 10 * 60 * 1000 },              // 5 requests / 10 mins
  phone: { limit: 3, windowMs: 30 * 60 * 1000 },           // 3 requests / 30 mins
  phoneProduct: { limit: 2, windowMs: 15 * 60 * 1000 },    // 2 requests / 15 mins
};

// Simple in-memory cache to store timestamps of hits
// Key structure: `rl:${ruleName}:${identifier}`
const cache = new Map<string, number[]>();

// Periodically clean up expired timestamps from memory
if (typeof global !== 'undefined') {
  const intervalId = 'rateLimitCleanupInterval';
  if (!(global as any)[intervalId]) {
    (global as any)[intervalId] = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of cache.entries()) {
        // Find rule name
        const match = key.match(/^rl:([^:]+):/);
        if (match) {
          const ruleName = match[1];
          const rule = rules[ruleName];
          if (rule) {
            const cutoff = now - rule.windowMs;
            const valid = timestamps.filter((t) => t > cutoff);
            if (valid.length === 0) {
              cache.delete(key);
            } else {
              cache.set(key, valid);
            }
          }
        }
      }
    }, 5 * 60 * 1000); // Clean every 5 mins
  }
}

export function isRateLimited(ruleName: 'ip' | 'phone' | 'phoneProduct', identifier: string): boolean {
  try {
    const rule = rules[ruleName];
    if (!rule || !identifier) return false;

    const key = `rl:${ruleName}:${identifier}`;
    const now = Date.now();
    const cutoff = now - rule.windowMs;

    const timestamps = cache.get(key) ?? [];
    const validTimestamps = timestamps.filter((t) => t > cutoff);

    if (validTimestamps.length >= rule.limit) {
      return true;
    }

    validTimestamps.push(now);
    cache.set(key, validTimestamps);
    return false;
  } catch (error) {
    console.error(`[rate-limit] Error checking limit for ${ruleName}:${identifier}`, error);
    return false; // Fail gracefully
  }
}
