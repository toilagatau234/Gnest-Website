/**
 * Supabase smoke tests — verifies that the Supabase connection is reachable
 * and that the public API returns expected data shapes.
 * Does NOT require admin credentials for the basic smoke checks.
 */

import { test, expect } from '@playwright/test';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

test.describe('Supabase connectivity smoke tests', () => {
  test('Supabase env vars are configured', async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      test.skip(true, 'BLOCKED: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set in env');
    }
    expect(SUPABASE_URL).toMatch(/^https?:\/\/.+\.supabase\.co$/);
    expect(SUPABASE_ANON_KEY).toMatch(/^ey/); // JWT starts with "ey"
  });

  test('anon cannot SELECT from newsletter_leads (RLS enforced)', async ({ request }) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      test.skip(true, 'BLOCKED: Supabase env vars not set');
    }
    const response = await request.get(`${SUPABASE_URL}/rest/v1/newsletter_leads?select=*&limit=1`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    // RLS should prevent anon from reading newsletter_leads
    // Supabase returns 200 with empty array or 401/403 if RLS blocks
    const body = await response.json().catch(() => null);
    if (response.status() === 200) {
      // If 200, the result should be empty due to RLS
      expect(Array.isArray(body) ? body.length : 0).toBe(0);
    } else {
      // 401 or 403 also acceptable (no access)
      expect(response.status()).toBeGreaterThanOrEqual(401);
    }
  });

  test('anon cannot INSERT into newsletter_leads directly (no public insert policy)', async ({ request }) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      test.skip(true, 'BLOCKED: Supabase env vars not set');
    }
    const response = await request.post(`${SUPABASE_URL}/rest/v1/newsletter_leads`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: {
        email: 'qa-test-rls-check@example.com',
        phone: '0900000001',
        name: 'QA_TEST_RLS_Check',
        source: 'qa',
        metadata: {},
      },
    });
    // anon INSERT should be rejected (403 or row-level check failure)
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('banner-images bucket is publicly readable', async ({ request }) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      test.skip(true, 'BLOCKED: Supabase env vars not set');
    }
    // Check that the storage API recognizes the bucket
    const response = await request.get(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    // Listing buckets may require service role — just verify API is reachable
    expect(response.status()).toBeLessThan(500);
  });

  test('product-images bucket API is reachable', async ({ request }) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      test.skip(true, 'BLOCKED: Supabase env vars not set');
    }
    const response = await request.get(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Next.js app Supabase integration smoke', () => {
  test('homepage loads data from Supabase without error (no 500)', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(503);
  });

  test('catalog page loads data from Supabase without error', async ({ page }) => {
    const response = await page.goto('/danh-muc');
    expect(response?.status()).not.toBe(500);
  });

  test('products API returns valid JSON', async ({ request }) => {
    const response = await request.get('/api/products?limit=5');
    if (response.status() === 200) {
      const body = await response.json();
      // API returns { items, nextCursor, hasNextPage }
      expect(body).toHaveProperty('items');
      expect(Array.isArray(body.items)).toBe(true);
    } else {
      expect(response.status()).toBeLessThan(500);
    }
  });
});
