import { Page, expect } from '@playwright/test';

export const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL ?? '';
export const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD ?? '';
export const SUPER_ADMIN_EMAIL = process.env.QA_SUPER_ADMIN_EMAIL ?? '';
export const SUPER_ADMIN_PASSWORD = process.env.QA_SUPER_ADMIN_PASSWORD ?? '';
export const EDITOR_EMAIL = process.env.QA_EDITOR_EMAIL ?? '';
export const EDITOR_PASSWORD = process.env.QA_EDITOR_PASSWORD ?? '';
export const VIEWER_EMAIL = process.env.QA_VIEWER_EMAIL ?? '';
export const VIEWER_PASSWORD = process.env.QA_VIEWER_PASSWORD ?? '';

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export function credentialsAvailable(email: string, password: string): boolean {
  return !!(email && password);
}

export async function adminLogin(page: Page, email: string, password: string) {
  await page.goto('/admin/login');
  // Login form uses wrapping labels with span text (no for/id association)
  // Target by input type directly inside the form
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /đăng nhập|login|sign in/i }).click();
  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

export async function adminLogout(page: Page) {
  const logoutBtn = page.getByRole('button', { name: /đăng xuất|logout|sign out/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  }
  await page.waitForURL('**/login', { timeout: 10000 }).catch(() => {});
}

export const QA_PREFIX = 'QA_TEST_';

export function qaName(label: string) {
  return `${QA_PREFIX}${label}`;
}
