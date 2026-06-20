'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  Loader2,
  Image as ImageIcon,
  FolderOpen,
  X,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  validateProductsImportAction,
  importProductsV3Action,
  validateV4ImportAction,
  importV4UpsertAction,
  type V4ImportRow,
  type V4ValidationResult,
  type V4ImportResult,
} from '../import-actions';
import { normalizeString, groupSpecAttributes, parseExcelWithTechKeys } from '@/lib/utils/product-import-utils';
import type { ImportRow, ValidationResult } from '@/lib/services/admin/product-import';

// ── Constants ─────────────────────────────────────────────────────────────────

const IMAGE_BUCKET = 'products';
const MAX_IMAGES_PER_PRODUCT = 3;
const ACCEPTED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ACCEPTED_IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'webp']);

/** Core column layout for the V4 Excel template (row 1 = VI, row 2 = key). */
const V4_CORE_COLUMNS: { vi: string; key: string; example: string | number | null }[] = [
  { vi: 'Mã sản phẩm',                  key: 'sku',                example: 'HTT-TR100' },
  { vi: 'Tên sản phẩm',                 key: 'name',               example: 'Hủ thủy tinh tròn 100ml' },
  { vi: 'Slug',                          key: 'slug',               example: 'hu-thuy-tinh-tron-100ml' },
  { vi: 'Loại sản phẩm *',              key: 'template_code',      example: 'glass_container' },
  { vi: 'Danh mục',                      key: 'category',           example: 'hu-thuy-tinh' },
  { vi: 'Mô tả ngắn',                   key: 'description',        example: 'Hủ chưng yến cao cấp' },
  { vi: 'Trạng thái (Có/Không)',         key: 'is_active',          example: 'Có' },
  { vi: 'Nổi bật (Có/Không)',            key: 'is_featured',        example: 'Không' },
  { vi: 'Giá bán',                       key: 'price',              example: 12000 },
  { vi: 'Tồn kho',                       key: 'stock',              example: 1500 },
  { vi: 'Tiêu đề SEO',                  key: 'seo_title',          example: '' },
  { vi: 'Mô tả SEO',                    key: 'seo_description',    example: '' },
  { vi: 'Từ khóa SEO',                  key: 'seo_keywords',       example: '' },
  { vi: 'Giá sỉ bậc 1',                 key: 'tier_1_price',       example: 11000 },
  { vi: 'SL tối thiểu bậc 1',           key: 'tier_1_min_qty',     example: 100 },
  { vi: 'Giá sỉ bậc 2',                 key: 'tier_2_price',       example: 10000 },
  { vi: 'SL tối thiểu bậc 2',           key: 'tier_2_min_qty',     example: 500 },
  { vi: 'Giá sỉ bậc 3',                 key: 'tier_3_price',       example: 9200 },
  { vi: 'SL tối thiểu bậc 3',           key: 'tier_3_min_qty',     example: 1000 },
  // Spec example columns (users add more based on product type)
  { vi: 'Loại nắp',                      key: 'spec.cap_type',      example: 'Nắp thiếc đen' },
  { vi: 'Trọng lượng (g)',               key: 'spec.weight_gram',   example: 110 },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'parsed' | 'uploading' | 'importing' | 'done';
type ImportFormat = 'v4' | 'legacy';

interface RowItem {
  data: ImportRow;
  matchedFiles: File[];
}

interface UploadProgress {
  completedImages: number;
  totalImages: number;
  currentProductSlug: string;
}

interface CommitResult {
  ok: boolean;
  imported: number;
  tierCount: number;
  imageCount: number;
  inserted?: number;
  updated?: number;
  error?: string;
}

// Normalised validation shape used by the UI (works for both legacy and V4)
interface UIValidation {
  ok: boolean;
  errors: { row: number; field: string; message: string }[];
  warnings: { row: number; field: string; message: string }[];
  validCount: number;
  errorCount: number;
  insertCount: number;
  upsertCount: number;
  globalError?: string;
}

// ── Pure utility functions ────────────────────────────────────────────────────



function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_IMAGE_MIME.has(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ACCEPTED_IMAGE_EXT.has(ext);
}

function getFileExt(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
}

/**
 * Detect whether the parsed keys indicate V4 format
 * (has `template_code` column or any `spec.*` column).
 */
export function detectV4Format(keys: string[]): boolean {
  return keys.some((k) => k === 'template_code' || k.startsWith('spec.'));
}



/** Fall-back for single-header-row (legacy) Excel files. */
async function parseLegacySheet(
  worksheet: import('xlsx').WorkSheet,
): Promise<ImportRow[]> {
  const XLSX = await import('xlsx');
  const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: null });
  return parsed.map((obj, i) => ({ ...obj, row: i + 2 } as unknown as ImportRow));
}



/**
 * Group image files by the normalised parent-folder name and match to slugs.
 * Returns `Map<productSlug, File[]>` (at most `MAX_IMAGES_PER_PRODUCT` per slug).
 */
function buildImageMapping(
  imageFiles: File[],
  slugs: string[],
): Map<string, File[]> {
  const folderMap = new Map<string, File[]>();
  for (const file of imageFiles) {
    if (!isAcceptedImage(file)) continue;
    const parts = file.webkitRelativePath?.split('/') ?? [];
    const parent = parts.length >= 2 ? parts[parts.length - 2] : '';
    if (!parent) continue;
    const key = normalizeString(parent);
    if (!folderMap.has(key)) folderMap.set(key, []);
    folderMap.get(key)!.push(file);
  }

  const mapping = new Map<string, File[]>();
  for (const slug of slugs) {
    if (!slug) continue;
    const normSlug = normalizeString(slug);
    const files = folderMap.get(normSlug);
    if (files && files.length > 0) {
      const sorted = [...files].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );
      mapping.set(slug, sorted.slice(0, MAX_IMAGES_PER_PRODUCT));
    }
  }
  return mapping;
}

/**
 * Upload matched images to Supabase Storage and return updated rows with
 * `image_1_url` / `image_2_url` / `image_3_url` filled in.
 */
async function matchAndUploadLocalImages<T extends { slug?: string | null; image_1_url?: string | null; image_2_url?: string | null; image_3_url?: string | null }>(
  rows: T[],
  imageMapping: Map<string, File[]>,
  onProgress: (completed: number, total: number, slug: string) => void,
): Promise<T[]> {
  const supabase = createClient();
  const totalImages = Array.from(imageMapping.values()).reduce((s, f) => s + f.length, 0);
  let completedImages = 0;

  const updated = rows.map((r) => ({ ...r })) as T[];

  for (const row of updated) {
    const slug = String(row.slug ?? '').trim().toLowerCase();
    if (!slug) continue;

    const files = imageMapping.get(slug);
    if (!files || files.length === 0) continue;

    onProgress(completedImages, totalImages, slug);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Target path: bucket products at ${slug}/image_${index + 1}.png
      const storagePath = `${slug}/image_${i + 1}.png`;

      const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(storagePath, file, { upsert: true, contentType: 'image/png' });

      if (!error) {
        const { data: urlData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);
        const url = urlData.publicUrl;
        if (i === 0) (row as Record<string, unknown>).image_1_url = url;
        else if (i === 1) (row as Record<string, unknown>).image_2_url = url;
        else if (i === 2) (row as Record<string, unknown>).image_3_url = url;
      }

      completedImages++;
      onProgress(completedImages, totalImages, slug);
    }
  }

  return updated;
}

/** Normalise a legacy `ValidationResult` to the common `UIValidation` shape. */
function legacyToUI(r: ValidationResult): UIValidation {
  return {
    ok: r.ok,
    errors: r.errors.map((e) => ({ row: e.row, field: e.field, message: e.message })),
    warnings: r.warnings.map((w) => ({ row: w.row, field: w.field, message: w.message })),
    validCount: r.validCount,
    errorCount: r.errorCount,
    insertCount: r.validCount,
    upsertCount: 0,
    globalError: r.error,
  };
}

/** Normalise a V4 `V4ValidationResult` to the common `UIValidation` shape. */
function v4ToUI(r: V4ValidationResult): UIValidation {
  return {
    ok: r.ok,
    errors: r.errors,
    warnings: r.warnings,
    validCount: r.validCount,
    errorCount: r.errorCount,
    insertCount: r.insertCount,
    upsertCount: r.upsertCount,
    globalError: r.error,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ImportClientProps {
  specTemplates: {
    templates: Record<string, { label: string; fields: { key: string; label: string; unit?: string; required?: boolean }[] }>;
    keys: string[];
  };
}

export function ImportClient({ specTemplates }: ImportClientProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [importFormat, setImportFormat] = useState<ImportFormat>('legacy');
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Legacy state
  const [rowItems, setRowItems] = useState<RowItem[]>([]);

  // V4 state
  const [v4Rows, setV4Rows] = useState<V4ImportRow[]>([]);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageMapping, setImageMapping] = useState<Map<string, File[]>>(new Map());
  const [uiValidation, setUiValidation] = useState<UIValidation | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    completedImages: 0,
    totalImages: 0,
    currentProductSlug: '',
  });
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = phase === 'uploading' || phase === 'importing';

  // Set webkitdirectory via DOM (React typings omit it)
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  // ── Derived slugs ──────────────────────────────────────────────────────

  const allSlugs = importFormat === 'v4'
    ? v4Rows.map((r) => String(r.slug ?? '').trim().toLowerCase()).filter(Boolean)
    : rowItems.map((item) => String(item.data.slug ?? '').trim().toLowerCase()).filter(Boolean);

  // ── Excel processing ────────────────────────────────────────────────────

  const processExcel = useCallback(async (file: File) => {
    setIsProcessingExcel(true);
    setUiValidation(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(e.target?.result, { type: 'binary' });

        const dataSheetName =
          workbook.SheetNames.find((n) =>
            /SẢN PHẨM|SAN PHAM|ProductTemplate/i.test(n),
          ) ?? workbook.SheetNames[0];
        const worksheet = workbook.Sheets[dataSheetName];

        // Detect format from row 1
        const sampleRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          range: 0,
          defval: null,
        });
        const row0 = (sampleRows[0] as unknown[]) ?? [];
        const row1 = (sampleRows[1] as unknown[]) ?? [];

        const techKeysToCheck = ['sku', 'slug', 'template_code', 'category', 'price', 'stock'];
        const row0HasKeys = row0.some(c => typeof c === 'string' && techKeysToCheck.includes(c.trim().toLowerCase()));
        const row1HasKeys = row1.some(c => typeof c === 'string' && techKeysToCheck.includes(c.trim().toLowerCase()));

        const hasRow2Keys = row1HasKeys && !row0HasKeys;
        const row1Keys = row1.filter((c): c is string => typeof c === 'string' && /^[a-z_.]/.test(c.trim()));
        const isV4 = hasRow2Keys && detectV4Format(row1Keys);

        if (hasRow2Keys) {
          // Both V4 and updated-V3 share the 2-row header parser
          const flatRows = await parseExcelWithTechKeys(worksheet);

          if (flatRows.length === 0) {
            setUiValidation({
              ok: false, errors: [], warnings: [], validCount: 0,
              errorCount: 0, insertCount: 0, upsertCount: 0,
              globalError: 'File không có dữ liệu sản phẩm hợp lệ.',
            });
            setIsProcessingExcel(false);
            setPhase('parsed');
            return;
          }

          if (isV4) {
            setImportFormat('v4');
            // Group spec.* attributes on each row
            const grouped: V4ImportRow[] = flatRows.map((flatRow) => {
              const { cleanRow, specs } = groupSpecAttributes(flatRow);
              return { ...cleanRow, specs } as V4ImportRow;
            });
            setV4Rows(grouped);
            setRowItems([]);

            // Recompute image mapping
            const slugsNow = grouped.map((r) => String(r.slug ?? '').trim().toLowerCase());
            if (imageFiles.length > 0) {
              setImageMapping(buildImageMapping(imageFiles, slugsNow));
            }

            const result = await validateV4ImportAction(grouped);
            setUiValidation(v4ToUI(result));
          } else {
            // Updated V3 legacy format (2-row header but old column names)
            setImportFormat('legacy');
            const items: RowItem[] = flatRows.map((row) => ({
              data: row as unknown as ImportRow,
              matchedFiles: [],
            }));
            setRowItems(items);
            setV4Rows([]);

            if (imageFiles.length > 0) {
              setImageMapping(buildImageMapping(imageFiles, items.map((i) => String(i.data.slug ?? ''))));
            }

            const result = await validateProductsImportAction(flatRows as unknown as ImportRow[]);
            setUiValidation(legacyToUI(result));
          }
        } else {
          // Legacy single-header Excel
          setImportFormat('legacy');
          const parsed = await parseLegacySheet(worksheet);
          if (parsed.length === 0) {
            setUiValidation({
              ok: false, errors: [], warnings: [], validCount: 0,
              errorCount: 0, insertCount: 0, upsertCount: 0,
              globalError: 'File không có dữ liệu sản phẩm hợp lệ.',
            });
            setIsProcessingExcel(false);
            setPhase('parsed');
            return;
          }
          const items = parsed.map((row) => ({ data: row, matchedFiles: [] }));
          setRowItems(items);
          setV4Rows([]);

          if (imageFiles.length > 0) {
            setImageMapping(buildImageMapping(imageFiles, items.map((i) => String(i.data.slug ?? ''))));
          }

          const result = await validateProductsImportAction(parsed);
          setUiValidation(legacyToUI(result));
        }

        setPhase('parsed');
      } catch (err) {
        console.error('Excel parse error:', err);
        setUiValidation({
          ok: false, errors: [], warnings: [], validCount: 0,
          errorCount: 0, insertCount: 0, upsertCount: 0,
          globalError: 'Không thể đọc file. Đảm bảo file đúng định dạng .xlsx / .xls.',
        });
        setPhase('parsed');
      } finally {
        setIsProcessingExcel(false);
      }
    };
    reader.readAsBinaryString(file);
  }, [imageFiles]);

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isProcessing) return;
    setExcelFile(file);
    processExcel(file);
  };

  // ── Folder selection ────────────────────────────────────────────────────

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    const files = Array.from(e.target.files ?? []);
    setImageFiles(files);
    if (allSlugs.length > 0) {
      setImageMapping(buildImageMapping(files, allSlugs));
    }
  };

  // ── Commit: upload images → upsert/import products ────────────────────

  const handleCommitImport = async () => {
    const hasRows = importFormat === 'v4' ? v4Rows.length > 0 : rowItems.length > 0;
    if (!hasRows) return;

    const totalImages = Array.from(imageMapping.values()).reduce((s, f) => s + f.length, 0);

    setPhase('uploading');
    setUploadProgress({ completedImages: 0, totalImages, currentProductSlug: '' });

    if (importFormat === 'v4') {
      // ── V4 path: upload images then UPSERT ──────────────────────────
      const updatedV4Rows = await matchAndUploadLocalImages(
        v4Rows,
        imageMapping,
        (completed, total, slug) =>
          setUploadProgress({ completedImages: completed, totalImages: total, currentProductSlug: slug }),
      );

      setPhase('importing');
      try {
        const result: V4ImportResult = await importV4UpsertAction(updatedV4Rows);
        setCommitResult({
          ok: result.ok,
          imported: result.upserted,
          tierCount: result.tierCount,
          imageCount: result.imageCount,
          inserted: result.inserted,
          updated: result.updated,
          error: result.error,
        });
      } catch (err) {
        console.error('V4 import failed:', err);
        setCommitResult({ ok: false, imported: 0, tierCount: 0, imageCount: 0, error: 'Đã xảy ra lỗi hệ thống khi lưu dữ liệu.' });
      }
    } else {
      // ── Legacy V3 path: upload images then INSERT ───────────────────
      const finalRows: ImportRow[] = rowItems.map((item) => ({ ...item.data }));

      const updatedLegacyRows = await matchAndUploadLocalImages(
        finalRows,
        imageMapping,
        (completed, total, slug) =>
          setUploadProgress({ completedImages: completed, totalImages: total, currentProductSlug: slug }),
      );

      setPhase('importing');
      try {
        const result = await importProductsV3Action(updatedLegacyRows);
        setCommitResult({
          ok: result.ok,
          imported: result.imported ?? 0,
          tierCount: result.tierCount ?? 0,
          imageCount: 0,
          error: result.error,
        });
      } catch (err) {
        console.error('Legacy import failed:', err);
        setCommitResult({ ok: false, imported: 0, tierCount: 0, imageCount: 0, error: 'Đã xảy ra lỗi hệ thống khi lưu dữ liệu.' });
      }
    }

    setPhase('done');
  };

  // ── Template download (V4 format) ───────────────────────────────────────

  const handleDownloadV3Template = () => {
    const link = document.createElement('a');
    link.href = '/templates/MauFileSanPham_Gnest_V3.xlsx';
    link.download = 'MauFileSanPham_Gnest_V3.xlsx';
    link.click();
  };

  const handleDownloadV4Template = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const viHeaders = V4_CORE_COLUMNS.map((c) => c.vi);
      const techKeys = V4_CORE_COLUMNS.map((c) => c.key);
      const exampleRow = V4_CORE_COLUMNS.map((c) => c.example ?? '');

      const ws = XLSX.utils.aoa_to_sheet([viHeaders, techKeys, exampleRow]);
      ws['!cols'] = V4_CORE_COLUMNS.map(() => ({ wch: 24 }));
      XLSX.utils.book_append_sheet(wb, ws, 'ProductTemplate');
      XLSX.writeFile(wb, 'MauFileSanPham_Gnest_V4.xlsx');
    } catch {
      alert('Không thể tạo file mẫu. Vui lòng thử lại.');
    }
  };

  const handleReset = () => {
    if (isProcessing) return;
    setPhase('idle');
    setExcelFile(null);
    setRowItems([]);
    setV4Rows([]);
    setImageFiles([]);
    setImageMapping(new Map());
    setUiValidation(null);
    setCommitResult(null);
    setImportFormat('legacy');
    setUploadProgress({ completedImages: 0, totalImages: 0, currentProductSlug: '' });
    if (excelInputRef.current) excelInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  // ── Derived values ──────────────────────────────────────────────────────

  const totalRows = importFormat === 'v4' ? v4Rows.length : rowItems.length;
  const totalErrors = uiValidation?.errorCount ?? 0;
  const totalWarnings = uiValidation?.warnings.length ?? 0;
  const validRowsCount = uiValidation?.validCount ?? totalRows;
  const isV4 = importFormat === 'v4';

  const totalMappedImages = Array.from(imageMapping.values()).reduce((s, f) => s + f.length, 0);
  const mappedProductCount = imageMapping.size;
  const totalImageFiles = imageFiles.filter(isAcceptedImage).length;

  const uploadPct =
    uploadProgress.totalImages > 0
      ? Math.round((uploadProgress.completedImages / uploadProgress.totalImages) * 100)
      : 0;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Hidden inputs always mounted so refs and Playwright locators are always available */}
      <input
        type="file"
        ref={excelInputRef}
        onChange={handleExcelChange}
        accept=".xlsx,.xls"
        disabled={isProcessing}
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        multiple
        {...{ webkitdirectory: "", directory: "" }}
        disabled={isProcessing}
        className="hidden"
      />
      <div className="flex items-center">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#4880FF] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách sản phẩm
        </Link>
      </div>

      {/* ── PHASE: idle ──────────────────────────────────────────────────── */}
      {phase === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel */}
          <div className="md:col-span-1 bg-white border border-[#EEF2F6] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              File mẫu Excel
            </h3>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDownloadV3Template}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-[#4880FF] hover:bg-[#4880FF]/5 text-sm font-bold text-[#4880FF] px-4 py-2.5 transition"
              >
                <Download className="h-4 w-4" />
                Tải file mẫu V3
              </button>

              <button
                type="button"
                onClick={handleDownloadV4Template}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-[#4880FF] hover:bg-[#4880FF]/5 text-sm font-bold text-[#4880FF] px-4 py-2.5 transition"
              >
                <Download className="h-4 w-4" />
                Tải file mẫu V4
              </button>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 space-y-1">
              <p className="font-bold">Cấu trúc file V4:</p>
              <p><strong>Dòng 1</strong> — Tiêu đề tiếng Việt (hiển thị)</p>
              <p><strong>Dòng 2</strong> — Tên biến kỹ thuật (<code className="bg-amber-100 px-0.5 rounded">sku</code>, <code className="bg-amber-100 px-0.5 rounded">slug</code>, <code className="bg-amber-100 px-0.5 rounded">spec.cap_type</code>…)</p>
              <p><strong>Dòng 3+</strong> — Dữ liệu sản phẩm</p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-[11px] leading-relaxed text-emerald-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Hỗ trợ Import Đè (UPSERT):
              </p>
              <p>Import lại cùng file để bổ sung thông số <code className="bg-emerald-100 px-0.5 rounded">spec.*</code> hoặc ảnh sau khi đo kiểm — dữ liệu hiện tại sẽ được cập nhật, không mất dữ liệu cũ.</p>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-[11px] leading-relaxed text-blue-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                Tải ảnh cục bộ:
              </p>
              <p>Chọn thư mục ảnh — tên thư mục con được chuẩn hóa tự động để khớp với <code className="bg-blue-100 px-0.5 rounded">slug</code> sản phẩm.</p>
            </div>
          </div>

          {/* Right panel */}
          <div className="md:col-span-2 bg-white border border-[#EEF2F6] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 mb-1">Chọn dữ liệu nhập</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Zone 1: Excel */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  1. File Excel sản phẩm
                </p>

                <div
                  onClick={() => !isProcessing && excelInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition flex flex-col items-center justify-center gap-2 min-h-[160px] ${
                    isProcessing ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    excelFile
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-[#D1D8E8] hover:border-[#4880FF] bg-[#F7F9FB] hover:bg-[#F0F4FF]'
                  }`}
                >
                  {excelFile ? (
                    <>
                      <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                      <p className="text-xs font-semibold text-emerald-700 break-all px-1">
                        {excelFile.name}
                      </p>
                      <p className="text-[11px] text-emerald-600">Bấm để đổi file</p>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-8 w-8 text-[#4880FF]/60" />
                      <p className="text-xs font-semibold text-slate-700">
                        Kéo thả hoặc <span className="text-[#4880FF]">chọn file</span>
                      </p>
                      <p className="text-[11px] text-slate-400">.xlsx, .xls · Tối đa 500 sản phẩm</p>
                    </>
                  )}
                </div>
              </div>

              {/* Zone 2: Image folder */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  2. Thư mục ảnh <span className="text-slate-300 font-normal">(tuỳ chọn)</span>
                </p>

                <div
                  onClick={() => !isProcessing && folderInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition flex flex-col items-center justify-center gap-2 min-h-[160px] ${
                    isProcessing ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    imageFiles.length > 0
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-[#D1D8E8] hover:border-violet-400 bg-[#F7F9FB] hover:bg-violet-50/30'
                  }`}
                >
                  {imageFiles.length > 0 ? (
                    <>
                      <FolderOpen className="h-8 w-8 text-violet-500" />
                      <p className="text-xs font-semibold text-violet-700">
                        {totalImageFiles} file ảnh đã quét
                      </p>
                      {allSlugs.length > 0 && (
                        <p className="text-[11px] text-violet-600">
                          Khớp {mappedProductCount} / {allSlugs.length} sản phẩm
                        </p>
                      )}
                      <p className="text-[11px] text-violet-500">Bấm để đổi thư mục</p>
                    </>
                  ) : (
                    <>
                      <FolderOpen className="h-8 w-8 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-700">Chọn thư mục ảnh</p>
                      <p className="text-[11px] text-slate-400">png · jpg · jpeg · webp</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isProcessingExcel && (
              <div className="flex items-center gap-2 text-sm text-[#4880FF]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang phân tích file Excel…
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PHASE: parsed ────────────────────────────────────────────────── */}
      {phase === 'parsed' && (
        <div className="bg-white border border-[#EEF2F6] rounded-xl p-6 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#EEF2F6] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-700">Xem trước & Kiểm tra dữ liệu</h3>
                {isV4 ? (
                  <span className="text-[10px] font-bold bg-[#4880FF] text-white px-2 py-0.5 rounded-full">V4 · UPSERT</span>
                ) : (
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Legacy</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {excelFile?.name ?? 'File Excel'} · {totalRows} dòng
                {imageFiles.length > 0 && ` · ${totalMappedImages} ảnh đã khớp`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={isProcessing}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 border border-[#D1D8E8] rounded-lg px-3 py-1.5 transition flex items-center gap-1 disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
              Chọn lại
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
              <FileSpreadsheet className="h-7 w-7 text-slate-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-500">Tổng dòng</div>
                <div className="text-lg font-black text-slate-800">{totalRows}</div>
              </div>
            </div>

            {isV4 ? (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <PlusCircle className="h-7 w-7 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-600">Tạo mới</div>
                    <div className="text-lg font-black text-emerald-800">{uiValidation?.insertCount ?? 0}</div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                  <RefreshCw className="h-7 w-7 text-blue-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-blue-600">Cập nhật</div>
                    <div className="text-lg font-black text-blue-800">{uiValidation?.upsertCount ?? 0}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="h-7 w-7 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-600">Hợp lệ</div>
                  <div className="text-lg font-black text-emerald-800">{validRowsCount}</div>
                </div>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <XCircle className="h-7 w-7 text-red-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-red-500">Lỗi</div>
                <div className="text-lg font-black text-red-800">{totalErrors}</div>
              </div>
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
              <ImageIcon className="h-7 w-7 text-violet-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-violet-600">Ảnh khớp</div>
                <div className="text-lg font-black text-violet-800">{totalMappedImages}</div>
              </div>
            </div>
          </div>

          {/* Global error */}
          {uiValidation?.globalError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {uiValidation.globalError}
            </div>
          )}

          {/* UPSERT info banner (V4 only) */}
          {isV4 && (uiValidation?.upsertCount ?? 0) > 0 && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <RefreshCw className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>{uiValidation!.upsertCount} sản phẩm</strong> đã tồn tại và sẽ được cập nhật (UPSERT).
                Thông số kỹ thuật mới sẽ được bổ sung vào, không ghi đè dữ liệu cũ còn thiếu.
              </span>
            </div>
          )}

          {/* Warnings (UPSERT notices) */}
          {totalWarnings > 0 && !isV4 && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Cảnh báo ({totalWarnings})
              </h4>
              <div className="max-h-36 overflow-y-auto text-xs text-amber-700 divide-y divide-amber-200/60">
                {uiValidation?.warnings.map((w, idx) => (
                  <div key={idx} className="py-1.5">
                    <strong>Dòng {w.row}</strong>
                    {' · '}
                    <code className="bg-amber-100 px-0.5 rounded">{w.field}</code>
                    {': '}
                    {w.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error list */}
          {totalErrors > 0 && (
            <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Danh sách lỗi ({totalErrors})
              </h4>
              <div className="max-h-52 overflow-y-auto text-xs text-red-700 divide-y divide-red-200/60">
                {uiValidation?.errors.map((err, idx) => (
                  <div key={idx} className="py-2">
                    <strong>Dòng {err.row}</strong>
                    {' · '}
                    <code className="bg-red-100 px-0.5 rounded">{err.field}</code>
                    {': '}
                    {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product preview table */}
          <div className="border border-[#EEF2F6] rounded-xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-500 w-10">#</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-500">Tên sản phẩm</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-500 hidden sm:table-cell">Slug</th>
                    {isV4 && (
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500 hidden md:table-cell">Trạng thái</th>
                    )}
                    {!isV4 && (
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500 hidden md:table-cell">Danh mục</th>
                    )}
                    <th className="px-3 py-2.5 text-right font-bold text-slate-500 hidden md:table-cell">Giá bán</th>
                    <th className="px-3 py-2.5 text-center font-bold text-slate-500 w-28">Ảnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4FA]">
                  {isV4
                    ? v4Rows.map((row, idx) => {
                        const slug = String(row.slug ?? '').trim().toLowerCase();
                        const matched = imageMapping.get(slug);
                        const isUpdate = (uiValidation?.warnings ?? []).some(
                          (w) => w.row === (row.row ?? idx + 3) && w.field === 'slug',
                        );
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium text-slate-700 max-w-[180px] truncate">
                              {String(row.name ?? '—')}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-400 hidden sm:table-cell max-w-[140px] truncate">
                              {slug || '—'}
                            </td>
                            <td className="px-3 py-2 hidden md:table-cell">
                              {isUpdate ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  <RefreshCw className="h-2.5 w-2.5" />
                                  Cập nhật
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                  <PlusCircle className="h-2.5 w-2.5" />
                                  Tạo mới
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600 hidden md:table-cell">
                              {row.price != null && row.price !== ''
                                ? Number(row.price).toLocaleString('vi-VN') + '₫'
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {matched && matched.length > 0 ? (
                                <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                  <ImageIcon className="h-2.5 w-2.5" />
                                  {matched.length} ảnh
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-300 text-[10px]">Chưa có ảnh</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    : rowItems.map((item, idx) => {
                        const slug = String(item.data.slug ?? '').trim().toLowerCase();
                        const matched = imageMapping.get(slug);
                        const price = item.data.base_price;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium text-slate-700 max-w-[180px] truncate">
                              {String(item.data.name ?? '—')}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-400 hidden sm:table-cell max-w-[140px] truncate">
                              {slug || '—'}
                            </td>
                            <td className="px-3 py-2 text-slate-500 hidden md:table-cell">
                              {String(item.data.category_slug ?? '—')}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600 hidden md:table-cell">
                              {price != null && price !== ''
                                ? Number(price).toLocaleString('vi-VN') + '₫'
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {matched && matched.length > 0 ? (
                                <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                  <ImageIcon className="h-2.5 w-2.5" />
                                  {matched.length} ảnh
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-300 text-[10px]">Chưa có ảnh</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Folder picker (parsed phase) */}
          <div className="flex items-center gap-3 bg-[#F7F9FB] border border-[#EEF2F6] rounded-xl p-3">
            <FolderOpen className="h-5 w-5 text-violet-400 shrink-0" />
            <div className="flex-1 min-w-0">
              {imageFiles.length > 0 ? (
                <p className="text-xs text-slate-600">
                  <strong>{totalImageFiles}</strong> file ảnh ·{' '}
                  <strong>{mappedProductCount}</strong> sản phẩm được khớp ảnh
                </p>
              ) : (
                <p className="text-xs text-slate-500">Chưa chọn thư mục ảnh</p>
              )}
              <p className="text-[11px] text-slate-400">
                Tên thư mục con tự động chuẩn hóa để khớp với slug sản phẩm
              </p>
            </div>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing}
              className="text-xs font-bold text-violet-600 border border-violet-200 bg-white hover:bg-violet-50 px-3 py-1.5 rounded-lg transition shrink-0 disabled:opacity-40"
            >
              {imageFiles.length > 0 ? 'Đổi thư mục' : 'Chọn thư mục ảnh'}
            </button>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EEF2F6]">
            {totalErrors > 0 && validRowsCount > 0 && (
              <p className="text-xs text-slate-400 italic mr-auto">
                * {totalErrors} dòng lỗi sẽ bị bỏ qua. Chỉ nhập {validRowsCount} dòng hợp lệ.
              </p>
            )}
            <button
              type="button"
              onClick={handleReset}
              disabled={isProcessing}
              className="bg-white border border-[#D1D8E8] text-slate-600 font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition disabled:opacity-40"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={validRowsCount === 0 || isProcessing}
              className="inline-flex items-center gap-1.5 bg-[#4880FF] text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#3769D6] transition disabled:opacity-40"
            >
              {isV4
                ? `Xác nhận Nhập (${validRowsCount} sản phẩm)`
                : `Xác nhận Nhập (${validRowsCount} sản phẩm)`}
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE: uploading / importing ────────────────────────────────── */}
      {(phase === 'uploading' || phase === 'importing') && (
        <div className="bg-white border border-[#EEF2F6] rounded-xl p-8 shadow-sm flex flex-col items-center gap-6">
          <div className="w-full max-w-md space-y-4">
            {phase === 'uploading' ? (
              <>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Đang tải ảnh lên…</span>
                  <span className="tabular-nums text-[#4880FF]">
                    {uploadProgress.completedImages} / {uploadProgress.totalImages}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  role="progressbar"
                  aria-valuenow={uploadPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"
                >
                  <div
                    className="h-full bg-[#4880FF] rounded-full transition-all duration-200"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>

                {uploadProgress.currentProductSlug && (
                  <p className="text-xs text-slate-400 text-center font-mono truncate">
                    {uploadProgress.currentProductSlug}
                  </p>
                )}

                <p className="text-[11px] text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Vui lòng không đóng trình duyệt trong quá trình tải ảnh.
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#4880FF]" />
                <p className="text-sm font-semibold text-slate-600">
                  Đang lưu vào cơ sở dữ liệu…
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PHASE: done ──────────────────────────────────────────────────── */}
      {phase === 'done' && commitResult && (
        <div className="bg-white border border-[#EEF2F6] rounded-xl p-8 shadow-sm">
          {commitResult.ok ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800">Nhập hoàn tất!</h3>

                {isV4 && commitResult.inserted !== undefined && commitResult.updated !== undefined ? (
                  <p className="text-sm text-slate-500">
                    <strong className="text-emerald-700">{commitResult.inserted}</strong> sản phẩm mới · {' '}
                    <strong className="text-blue-700">{commitResult.updated}</strong> sản phẩm cập nhật
                    {commitResult.tierCount > 0 && (
                      <> · <strong className="text-slate-700">{commitResult.tierCount}</strong> mức giá sỉ</>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    Đã thêm thành công{' '}
                    <strong className="text-emerald-700">{commitResult.imported}</strong> sản phẩm
                    {commitResult.tierCount > 0 && (
                      <> và <strong className="text-emerald-700">{commitResult.tierCount}</strong> mức giá sỉ</>
                    )}
                    .
                  </p>
                )}

                {(commitResult.imageCount ?? 0) > 0 && (
                  <p className="text-xs text-violet-600">
                    {commitResult.imageCount} ảnh đã được tải lên Supabase Storage.
                  </p>
                )}
                {totalMappedImages > 0 && !commitResult.imageCount && (
                  <p className="text-xs text-violet-600">
                    {totalMappedImages} ảnh đã được tải lên Supabase Storage.
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-2">
                <Link
                  href="/admin/products"
                  className="bg-[#4880FF] text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#3769D6] transition"
                >
                  Xem danh sách sản phẩm
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-white border border-[#D1D8E8] text-slate-600 font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  Nhập file mới
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <XCircle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-black text-slate-800">Nhập thất bại</h3>
                <p className="text-sm text-red-600 mt-1">{commitResult.error}</p>
              </div>
              <button
                type="button"
                onClick={() => setPhase('parsed')}
                className="bg-white border border-[#D1D8E8] text-slate-600 font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                Quay lại
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
