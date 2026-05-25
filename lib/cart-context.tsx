'use client';

import { CatalogItem } from './data';

export function getDiscountedPrice(item: CatalogItem, quantity: number) {
  if (!item.price) return undefined;
  if (!item.bulkDiscounts || item.bulkDiscounts.length === 0) return item.price;
  
  // Sort descending by threshold
  const sorted = [...item.bulkDiscounts].sort((a, b) => b.threshold - a.threshold);
  const applicable = sorted.find(d => quantity >= d.threshold);
  return applicable ? applicable.pricePerUnit : item.price;
}
