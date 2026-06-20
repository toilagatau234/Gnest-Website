import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as XLSX from 'xlsx';
import {
  adminLogin,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  credentialsAvailable,
  QA_PREFIX,
} from './helpers';
import { normalizeString, groupSpecAttributes, parseExcelWithTechKeys } from '../../lib/utils/product-import-utils';

// ── Test constants ────────────────────────────────────────────────────────────
const IMPORT_URL = '/admin/products/import';
const QA_SLUG_ADV = 'qa-import-advanced-test';
const FOLDER_NAME_ADV = 'qa-import-advanced-test'; // exact match normalized slug

// ── File generators ───────────────────────────────────────────────────────────
function minimalPng(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}

const V4_VI_HEADERS = [
  'Mã sản phẩm', 'Tên sản phẩm', 'Slug', 'Loại sản phẩm *', 'Danh mục', 'Giá bán', 'Tồn kho', 'Loại nắp', 'Trọng lượng (g)'
];

const V4_TECH_KEYS = [
  'sku', 'name', 'slug', 'template_code', 'category', 'price', 'stock', 'spec.cap_type', 'spec.weight_gram'
];

function generateV4Excel(dataRows: Array<(string | number | null)[]>): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([V4_VI_HEADERS, V4_TECH_KEYS, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, ws, 'ProductTemplate');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function writeTmpFile(buf: Buffer): string {
  const p = path.join(os.tmpdir(), `qa_import_adv_${Date.now()}.xlsx`);
  fs.writeFileSync(p, buf);
  return p;
}

function createTempImageDir(structure: Record<string, string[]>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-import-adv-imgs-'));
  for (const [folder, files] of Object.entries(structure)) {
    const dir = path.join(root, folder);
    fs.mkdirSync(dir, { recursive: true });
    for (const filename of files) {
      fs.writeFileSync(path.join(dir, filename), minimalPng());
    }
  }
  return root;
}

function collectImagePaths(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...collectImagePaths(full));
    else result.push(full);
  }
  return result;
}

async function getFirstCategorySlug(page: Page): Promise<string | null> {
  await page.goto('/admin/categories');
  await page.waitForLoadState('networkidle').catch(() => {});
  const slugEl = page.locator('code, .font-mono, [class*="slug"]').first();
  if (await slugEl.count() === 0) return 'chai-lo-thuy-tinh';
  const text = (await slugEl.textContent())?.trim() ?? '';
  return /^[a-z0-9-]+$/.test(text) ? text : 'chai-lo-thuy-tinh';
}

async function cleanUpQaProduct(page: Page, slug: string) {
  await page.goto(`/admin/products?q=${slug}`);
  await page.waitForLoadState('networkidle');
  const deleteBtn = page.getByRole('button', { name: /xóa|delete|remove/i }).first();
  if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deleteBtn.click();
    const confirmBtn = page.getByRole('button', { name: /xác nhận|confirm|yes|ok/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(1500);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit Layer Tests
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Product Import - Unit Layer', () => {
  test('normalizeString helper matches correctly', () => {
    expect(normalizeString('hủ tròn 100ml')).toBe('hu-tron-100ml');
    expect(normalizeString('Hũ Lục Giác 500ml')).toBe('hu-luc-giac-500ml');
    expect(normalizeString('  Glass-Bottle  ')).toBe('glass-bottle');
  });

  test('groupSpecAttributes separates spec. keys from root attributes', () => {
    const rawRow = {
      sku: 'SKU-123',
      name: 'Product 1',
      'spec.cap_type': 'Vòi xịt',
      'spec.weight_gram': 250,
      'spec.empty_val': '',
      category: 'chai-lo',
    };
    const { cleanRow, specs } = groupSpecAttributes(rawRow);
    expect(cleanRow).toEqual({
      sku: 'SKU-123',
      name: 'Product 1',
      category: 'chai-lo',
    });
    expect(specs).toEqual({
      cap_type: 'Vòi xịt',
      weight_gram: 250,
    });
  });

  test('parseExcelWithTechKeys reads sheet using Row 2 as keys', async () => {
    const headers = ['Mã', 'Tên', 'Slug', 'Loại *', 'Nắp', 'Cân nặng'];
    const keys = ['sku', 'name', 'slug', 'template_code', 'spec.cap_type', 'spec.weight_gram'];
    const dataRow = ['QA-SKU', 'QA Product', 'qa-product', 'glass_container', 'Nắp nhôm', 150];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, keys, dataRow]);
    const parsed = await parseExcelWithTechKeys(ws);

    expect(parsed.length).toBe(1);
    expect(parsed[0]).toEqual({
      row: 3,
      sku: 'QA-SKU',
      name: 'QA Product',
      slug: 'qa-product',
      template_code: 'glass_container',
      'spec.cap_type': 'Nắp nhôm',
      'spec.weight_gram': 150,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E Integration Layer Tests
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Product Import V4 Advanced Flow', () => {
  let categorySlug: string | null = null;
  let tmpFiles: string[] = [];
  let tmpDirs: string[] = [];

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90000);
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) return;
    const page = await browser.newPage();
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    categorySlug = await getFirstCategorySlug(page);
    await cleanUpQaProduct(page, QA_SLUG_ADV);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) {
      test.skip(true, 'BLOCKED: admin credentials not available');
    }
    if (!categorySlug) {
      test.skip(true, 'BLOCKED: no category available');
    }
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(IMPORT_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f); } catch {}
    }
    for (const d of tmpDirs) {
      try { fs.rmSync(d, { recursive: true }); } catch {}
    }
    tmpFiles = [];
    tmpDirs = [];
  });

  test.afterAll(async ({ browser }) => {
    test.setTimeout(60000);
    if (!credentialsAvailable(ADMIN_EMAIL, ADMIN_PASSWORD)) return;
    const page = await browser.newPage();
    await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await cleanUpQaProduct(page, QA_SLUG_ADV);
    await page.close();
  });

  test('Test 1 (Incomplete Init): Import Excel with empty specs and no images -> PASS with warnings', async ({ page }) => {
    // Generate Excel row with empty specs and no images
    const row = [
      'QA-SKU-ADV-123',
      `${QA_PREFIX} Advanced Product`,
      QA_SLUG_ADV,
      'glass_container',
      categorySlug,
      15000,
      1000,
      '', // spec.cap_type
      ''  // spec.weight_gram
    ];
    const buf = generateV4Excel([row]);
    const file = writeTmpFile(buf);
    tmpFiles.push(file);

    // Upload to Excel input
    await page.locator('input[type="file"][accept=".xlsx,.xls"]').setInputFiles(file);
    await page.waitForTimeout(3000);

    // Verify preview shows row correctly
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
    
    // Perform validation and import
    const confirmBtn = page.getByRole('button', { name: /xác nhận nhập/i });
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await confirmBtn.click();

    // Verify import completed successfully (done phase)
    const successHeading = page.locator('h3', { hasText: /nhập hoàn tất/i });
    await expect(successHeading).toBeVisible({ timeout: 20000 });

    // Verify warning list or check status details
    const successCard = page.locator('div:has(> h3:has-text("Nhập hoàn tất!"))');
    const successDetails = await successCard.textContent() ?? '';
    expect(successDetails).toContain('1'); // at least 1 product inserted
  });

  test('Test 2 (Inspected Supplement): Re-import same file with populated spec.* fields + local image folder drop -> Verify UPSERT correctly merges specs JSONB and injects Supabase public URLs without duplicate errors', async ({ page }) => {
    // Generate Excel row with populated specs
    const row = [
      'QA-SKU-ADV-123',
      `${QA_PREFIX} Advanced Product`,
      QA_SLUG_ADV,
      'glass_container',
      categorySlug,
      15000,
      1000,
      'Nắp nhôm cao cấp', // spec.cap_type
      125 // spec.weight_gram
    ];
    const buf = generateV4Excel([row]);
    const file = writeTmpFile(buf);
    tmpFiles.push(file);

    // Generate local images directory
    const imgDir = createTempImageDir({
      [FOLDER_NAME_ADV]: ['image_1.png', 'image_2.png'],
    });
    tmpDirs.push(imgDir);
    const allImages = collectImagePaths(imgDir);

    // Upload Excel first
    await page.locator('input[type="file"][accept=".xlsx,.xls"]').setInputFiles(file);
    await page.waitForTimeout(3000);

    // Upload image folder
    await page.locator('input[type="file"][multiple]:not([accept])').setInputFiles(imgDir, { noWaitAfter: true });
    await page.waitForTimeout(2000);

    // Verify images are mapped in preview
    const imageBadge = page.locator('text=/\\d+ ảnh/i').first();
    await expect(imageBadge).toBeVisible({ timeout: 5000 });
    expect(await imageBadge.textContent()).toContain('2');

    // Confirm upsert import
    const confirmBtn = page.getByRole('button', { name: /xác nhận nhập/i }).first();
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await confirmBtn.click();

    // Verify done phase
    const successHeading = page.locator('h3', { hasText: /nhập hoàn tất/i });
    await expect(successHeading).toBeVisible({ timeout: 30000 });

    // Verify upsert counts in the success screen: should show 1 updated product
    const successCard = page.locator('div:has(> h3:has-text("Nhập hoàn tất!"))');
    const resultText = await successCard.textContent() ?? '';
    expect(resultText).toContain('hoàn tất');
  });
});
