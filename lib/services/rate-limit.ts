import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';

interface RateLimitRule {
  limit: number;
  windowMs: number;
}

const rules: Record<string, RateLimitRule> = {
  ip: { limit: 5, windowMs: 10 * 60 * 1000 },              // 5 requests / 10 mins
  phone: { limit: 3, windowMs: 30 * 60 * 1000 },           // 3 requests / 30 mins
  phoneProduct: { limit: 2, windowMs: 15 * 60 * 1000 },    // 2 requests / 15 mins
  ipProduct: { limit: 3, windowMs: 15 * 60 * 1000 },       // 3 requests / 15 mins
};

export type RateLimitRuleName = keyof typeof rules;

/**
 * Durable, cross-instance rate limiting backed by Postgres (rate_limit_hits) via the
 * service-role-only RPC `check_rate_limit`. Unlike an in-memory limiter, this survives cold
 * starts and is shared across all serverless instances.
 *
 * Returns true when the request should be rejected (limit reached). Fails open (returns false)
 * on any error so a transient DB issue never blocks a legitimate submission.
 */
export async function isRateLimited(
  ruleName: RateLimitRuleName,
  identifier: string,
): Promise<boolean> {
  try {
    const rule = rules[ruleName];
    if (!rule || !identifier) return false;

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_rule: ruleName,
      p_identifier: identifier,
      p_limit: rule.limit,
      p_window_seconds: Math.floor(rule.windowMs / 1000),
    });

    if (error) {
      console.error(`[rate-limit] RPC error for ${ruleName}:${identifier}`, error.message);
      return false; // Fail open
    }

    return data === true;
  } catch (error) {
    console.error(`[rate-limit] Error checking limit for ${ruleName}:${identifier}`, error);
    return false; // Fail gracefully
  }
}
