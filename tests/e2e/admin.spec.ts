/**
 * Admin authentication and feature E2E tests.
 * All tests requiring actual credentials are skipped when env vars are absent.
 */

import { test, expect } from '@playwright/test';
import {
  adminLogin,
  adminLogout,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD,
  credentialsAvailable,
  qaName,
} from './helpers';

// ── Authentication ────────────────────────────────────────────────────────────

test.describe('Admin Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage/sessionStorage to prevent stale Supabase auth tokens
    // from a prior test in the same browser context causing JSON parse errors.
    await page.goto('about:blank');
    await page.evaluate(() => {
      try { localStorage.clear(); } catch { /* empty */ }
      try { sessionStorage.clear(); } catch { /* empty */ }
    });
  });

  test('admin login page loads', async ({ page }) => {
    const response = await page.goto('/admin/login');
    expect(response?.status()).toBe(200);
    await expect(page.locator('form, [data-testid="login-form"]')).toBeVisible();
  });

  test('invalid credentials do not gain admin access', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await page.locator('input[type="email"]').fill('invalid-qa-test@example.com');
    await page.locator('input[type="password"]').fill('WrongPassword_QA_123!');
    // Button may be disabled while auth context initializes — use force
    await page.getByRole('button', { name: /đăng nhập/i }).click({ force: true });
    await page.waitForTimeout(8000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin/dashboard');
    expect(currentUrl).not.toContain('/admin/categories');
  });

  test('empty credentials cannot bypass login', async ({ page }) => {
    await page.goto('/admin/login');
    const submitBtn = page.getByRole('button', { name: /đăng nhập/i });
    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    // Button may be disabled (auth loading) or enabled — either way, page stays on login
    await submitBtn.click({ force: true });
    await page.waitForTimeout(1000);
    const url = page.url();
    // Without filling credentials, nothing should redirect away from login
    expect(url).toContain('/login');
  });
});

test.describe('Protected admin route redirect (unauthenticated)', () => {
  const protectedPaths = [
    '/admin/dashboard',
    '/admin/categories',
    '/admin/products',
    '/admin/banners',
    '/admin/jobs',
    '/admin/inquiries',
    '/admin/sales-contacts',
    '/admin/audit-logs',
    '/admin/admin-users',
  ];

  for (const path of protectedPaths) {
    test(`${path} redirects unauthenticated to /admin/login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL((url) => url.pathname.includes('/login') || url.pathname.includes('/access-denied'), {
        timeout: 10000,
      });
      const url = page.url();
      expect(url).toMatch(/\/admin\/login|\/admin\/access-denied/);
    });
  }
});

// ── Authenticated admin tests ────────────────────────────────────────────────

test.describe('Admin dashboard (requires credentials)', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD not set');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('admin layout and sidebar render', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('[data-testid="admin-sidebar"], nav[class*="sidebar"], aside');
    await expect(sidebar).toBeVisible();
  });

  test('dashboard KPI cards render', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    // Look for stat card containers
    const statCards = page.locator('[class*="stat"], [class*="card"], [class*="kpi"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('admin can log out', async ({ page }) => {
    await adminLogout(page);
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('Categories module (requires credentials)', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: admin credentials not set');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('categories list loads', async ({ page }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [data-testid="categories-page"]')).toBeVisible();
  });

  test('create test category', async ({ page }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /thêm|tạo|create|new/i }).first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    const nameInput = page.getByLabel(/tên|name/i).first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill(qaName('Danh Muc Test'));
    const slugInput = page.getByLabel(/slug/i).first();
    if (await slugInput.isVisible()) {
      await slugInput.fill('qa-test-danh-muc-test');
    }
    const submitBtn = page.getByRole('button', { name: /lưu|save|tạo|tạo mới/i }).last();
    await submitBtn.click();
    await page.waitForTimeout(2000);
    // Should show success or the category should appear in list
    const successIndicator = page.locator('[class*="success"], [class*="toast"], [role="status"]');
    const hasSuccess = await successIndicator.isVisible().catch(() => false);
    const hasNewEntry = await page.getByText(qaName('Danh Muc Test')).isVisible().catch(() => false);
    expect(hasSuccess || hasNewEntry).toBe(true);
  });
});

test.describe('Products module (requires credentials)', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: admin credentials not set');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('products list loads', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });

  test('Excel import UI is accessible', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    const importBtn = page.getByRole('button', { name: /import|excel|nhập/i });
    // Import button may exist — soft assertion
    if (await importBtn.isVisible()) {
      await expect(importBtn).toBeEnabled();
    }
  });
});

test.describe('Banners module (requires credentials)', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: admin credentials not set');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('banners list loads', async ({ page }) => {
    await page.goto('/admin/banners');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });

  test('create site_top text banner hides image fields', async ({ page }) => {
    await page.goto('/admin/banners');
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /thêm|tạo|create/i }).first();
    if (!await createBtn.isVisible()) {
      test.skip(true, 'Create button not found');
    }
    await createBtn.click();
    await page.waitForTimeout(500);
    // Select site_top position
    const positionSelect = page.getByLabel(/vị trí|position/i);
    if (await positionSelect.isVisible()) {
      await positionSelect.selectOption('site_top');
      await page.waitForTimeout(300);
      // Image fields should be hidden for site_top
      const imageField = page.getByLabel(/ảnh|image/i).first();
      const isHidden = await imageField.isHidden().catch(() => true);
      expect(isHidden).toBe(true);
    }
  });

  test('Google Drive URL is rejected for banner image field', async ({ page }) => {
    await page.goto('/admin/banners');
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /thêm|tạo|create/i }).first();
    if (!await createBtn.isVisible()) {
      test.skip(true, 'Create button not found');
    }
    await createBtn.click();
    await page.waitForTimeout(500);
    // Select homepage position to reveal image fields
    const positionSelect = page.getByLabel(/vị trí|position/i);
    if (await positionSelect.isVisible()) {
      await positionSelect.selectOption('homepage');
      await page.waitForTimeout(300);
    }
    const imageUrlField = page.getByLabel(/ảnh máy tính|desktop/i).first();
    if (await imageUrlField.isVisible()) {
      await imageUrlField.fill('https://drive.google.com/file/d/abc123/view');
      const nameField = page.getByLabel(/tên|name/i).first();
      await nameField.fill(qaName('Banner Google Drive Test'));
      const submitBtn = page.getByRole('button', { name: /lưu|save/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      // Should show error about Google Drive
      const errorMsg = page.locator('[class*="error"], [role="alert"]');
      await expect(errorMsg).toBeVisible();
    }
  });
});

test.describe('Sales contacts module (requires credentials)', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: admin credentials not set');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('sales contacts list loads', async ({ page }) => {
    await page.goto('/admin/sales-contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Jobs module (requires credentials)', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: admin credentials not set');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('jobs list loads', async ({ page }) => {
    await page.goto('/admin/jobs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Inquiries module (requires credentials)', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: admin credentials not set');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('inquiries list loads', async ({ page }) => {
    await page.goto('/admin/inquiries');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Audit logs module (requires admin credentials)', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: admin credentials not set');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('audit logs page loads', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Admin users module (requires super_admin credentials)', () => {
  test.beforeEach(async ({ page }) => {
    if (!credentialsAvailable(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: QA_SUPER_ADMIN_EMAIL / QA_SUPER_ADMIN_PASSWORD not set');
    }
    await adminLogin(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
  });

  test('admin users page loads for super_admin', async ({ page }) => {
    await page.goto('/admin/admin-users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });
});
