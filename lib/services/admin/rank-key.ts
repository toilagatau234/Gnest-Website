import { generateKeyBetween } from 'fractional-indexing';

export function getRankBefore(firstRank: string | null): string {
  return generateKeyBetween(null, firstRank || null);
}

export function getRankBetween(beforeRank: string | null, afterRank: string | null): string {
  return generateKeyBetween(beforeRank || null, afterRank || null);
}

export function compareRankKey(a?: string | null, b?: string | null): number {
  if (a === b) return 0;
  if (a != null && b == null) return -1;
  if (a == null && b != null) return 1;
  if (a != null && b != null) {
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}
