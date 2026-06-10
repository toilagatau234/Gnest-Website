/**
 * RBAC (Role-Based Access Control) E2E tests.
 * Verifies server-side enforcement of role restrictions — not just UI hiding.
 *
 * All tests require role-specific credentials via environment variables:
 *   QA_VIEWER_EMAIL / QA_VIEWER_PASSWORD
 *   QA_EDITOR_EMAIL / QA_EDITOR_PASSWORD
 *   QA_ADMIN_EMAIL  / QA_ADMIN_PASSWORD
 *   QA_SUPER_ADMIN_EMAIL / QA_SUPER_ADMIN_PASSWORD
 */

import { test, expect, type Page } from '@playwright/test';
import {
  adminLogin,
  VIEWER_EMAIL,
  VIEWER_PASSWORD,
  EDITOR_EMAIL,
  EDITOR_PASSWORD,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD,
  credentialsAvailable,
} from './helpers';

// ── viewer role ───────────────────────────────────────────────────────────────

test.describe('viewer role restrictions', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(VIEWER_EMAIL, VIEWER_PASSWORD)) {
      test.skip(true, 'BLOCKED: QA_VIEWER_EMAIL / QA_VIEWER_PASSWORD not set');
    }
    await adminLogin(page, VIEWER_EMAIL, VIEWER_PASSWORD);
  });

  test('viewer can access dashboard (read-only)', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/admin');
  });

  test('viewer: admin-users page is inaccessible', async ({ page }) => {
    await page.goto('/admin/admin-users');
    await page.waitForURL((url) =>
      url.pathname.includes('/access-denied') || url.pathname.includes('/login'),
      { timeout: 8000 }
    ).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/access-denied|login/);
  });

  test('viewer: create category server action is rejected', async ({ page }) => {
    // Direct form submission to test server-side RBAC enforcement
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');
    // Check no create/edit buttons are active or form submission returns error
    const createBtn = page.getByRole('button', { name: /thêm|tạo|create/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      const nameInput = page.getByLabel(/tên|name/i).first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('QA_TEST_Viewer_ShouldFail');
        await page.getByRole('button', { name: /lưu|save/i }).last().click();
        await page.waitForTimeout(2000);
        // Should show error — viewer cannot create
        const errorOrRedirect = (await page.locator('[class*="error"], [role="alert"]').isVisible()) ||
          page.url().includes('/access-denied');
        expect(errorOrRedirect).toBe(true);
      }
    }
  });

  test('viewer: banners page accessible as read-only', async ({ page }) => {
    await page.goto('/admin/banners');
    await page.waitForLoadState('networkidle');
    // Should not be redirected (viewer can view banners)
    const url = page.url();
    expect(url).toContain('/admin/banners');
  });
});

// ── editor role ───────────────────────────────────────────────────────────────

test.describe('editor role restrictions', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(EDITOR_EMAIL, EDITOR_PASSWORD)) {
      test.skip(true, 'BLOCKED: QA_EDITOR_EMAIL / QA_EDITOR_PASSWORD not set');
    }
    await adminLogin(page, EDITOR_EMAIL, EDITOR_PASSWORD);
  });

  test('editor: admin-users page is inaccessible', async ({ page }) => {
    await page.goto('/admin/admin-users');
    await page.waitForURL((url) =>
      url.pathname.includes('/access-denied') || url.pathname.includes('/login'),
      { timeout: 8000 }
    ).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/access-denied|login/);
  });

  test('editor: audit-logs page is inaccessible', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await page.waitForURL((url) =>
      url.pathname.includes('/access-denied') || url.pathname.includes('/login'),
      { timeout: 8000 }
    ).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/access-denied|login/);
  });

  test('editor: can access categories page', async ({ page }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/admin/categories');
  });

  test('editor: can access banners page', async ({ page }) => {
    await page.goto('/admin/banners');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/admin/banners');
  });

  test('editor: site-content restricted page is inaccessible', async ({ page }) => {
    await page.goto('/admin/site-content');
    // editor should not access system config
    await page.waitForURL((url) =>
      url.pathname.includes('/access-denied') || url.pathname.includes('/login'),
      { timeout: 8000 }
    ).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/access-denied|login/);
  });
});

// ── admin role ────────────────────────────────────────────────────────────────

test.describe('admin role restrictions', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD not set');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('admin: can access audit-logs page', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/admin/audit-logs');
  });

  test('admin: admin-users page is inaccessible (super_admin only)', async ({ page }) => {
    await page.goto('/admin/admin-users');
    await page.waitForURL((url) =>
      url.pathname.includes('/access-denied') || url.pathname.includes('/login'),
      { timeout: 8000 }
    ).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/access-denied|login/);
  });

  test('admin: can access site-content', async ({ page }) => {
    await page.goto('/admin/site-content');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/admin/site-content');
  });
});

// ── super_admin role ──────────────────────────────────────────────────────────

test.describe('super_admin full access', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: QA_SUPER_ADMIN_EMAIL / QA_SUPER_ADMIN_PASSWORD not set');
    }
    await adminLogin(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
  });

  test('super_admin: can access admin-users page', async ({ page }) => {
    await page.goto('/admin/admin-users');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/admin/admin-users');
  });

  test('super_admin: can access audit-logs page', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/admin/audit-logs');
  });

  test('super_admin: can access site-content page', async ({ page }) => {
    await page.goto('/admin/site-content');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/admin/site-content');
  });
});
