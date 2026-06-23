'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
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
  X,
  RefreshCw,
  PlusCircle,
  FolderOpen,
} from 'lucide-react';
import {
  validateV4ImportAction,
  importV4UpsertAction,
  uploadImportImageAction,
  finalizeImportImagesAction,
  type V4ImportRow,
  type V4ValidationResult,
  type V4ImportResult,
} from '../import-actions';
import { groupSpecAttributes, parseExcelWithTechKeys } from '@/lib/utils/product-import-utils';
import { buildSkuImageMap, type SkuImageGroup } from '@/lib/utils/image-folder';
import type { SpecField, TemplateRegistry } from '@/lib/product-spec-templates';

// ── V4 template CORE columns (row 1 = VI label, row 2 = tech key, row 3 = sample) ─
// Spec columns are appended DYNAMICALLY per product type (from product_spec_fields),
// so each downloaded template carries exactly the spec.* columns of the chosen type.
// Images come from a LOCAL folder named by SKU — never from a URL column.
interface CoreCol {
  vi: string;
  key: string;
  example: string | number;
  required?: boolean;
  note: string;
}

const V4_CORE_COLUMNS: CoreCol[] = [
  { vi: 'Mã sản phẩm', key: 'sku', example: 'HLG100P53', required: true, note: 'Định danh duy nhất. Dùng để đối chiếu & cập nhật (UPSERT). Tên thư mục ảnh phải trùng mã này.' },
  { vi: 'Tên sản phẩm', key: 'name', example: 'Hũ thủy tinh tròn 100ml', required: true, note: 'Tên hiển thị của sản phẩm.' },
  { vi: 'Slug', key: 'slug', example: 'hu-thuy-tinh-tron-100ml', required: true, note: 'Chữ thường, số, gạch ngang; duy nhất.' },
  { vi: 'Loại sản phẩm', key: 'template_code', example: 'glass_container', required: true, note: 'Mã loại — quyết định bộ thông số kỹ thuật bên dưới. Giữ nguyên giá trị mẫu.' },
  { vi: 'Danh mục', key: 'category', example: 'hu-thuy-tinh', note: 'Slug hoặc tên danh mục đang hiển thị. Bỏ trống nếu chưa rõ.' },
  { vi: 'Mô tả ngắn', key: 'description', example: 'Hũ chưng yến cao cấp', note: 'Text thuần.' },
  { vi: 'Trạng thái', key: 'is_active', example: 'Có', note: 'Có / Không (mặc định Có).' },
  { vi: 'Nổi bật', key: 'is_featured', example: 'Không', note: 'Có / Không (mặc định Không).' },
  { vi: 'Giá bán', key: 'price', example: 12000, note: 'Số ≥ 0. Bỏ trống = Liên hệ.' },
  { vi: 'Tồn kho', key: 'stock', example: 1500, note: 'Số nguyên, mặc định 0.' },
  { vi: 'Tiêu đề SEO', key: 'seo_title', example: '', note: 'Tùy chọn.' },
  { vi: 'Mô tả SEO', key: 'seo_description', example: '', note: 'Tùy chọn.' },
  { vi: 'Từ khóa SEO', key: 'seo_keywords', example: '', note: 'Tùy chọn.' },
  { vi: 'Giá sỉ bậc 1', key: 'tier_1_price', example: 11000, note: 'Giá sỉ theo bậc số lượng.' },
  { vi: 'SL tối thiểu bậc 1', key: 'tier_1_min_qty', example: 100, note: 'Số lượng tối thiểu áp dụng giá bậc 1.' },
  { vi: 'Giá sỉ bậc 2', key: 'tier_2_price', example: 10000, note: 'Giá sỉ bậc 2.' },
  { vi: 'SL tối thiểu bậc 2', key: 'tier_2_min_qty', example: 500, note: 'Số lượng tối thiểu áp dụng giá bậc 2.' },
  { vi: 'Giá sỉ bậc 3', key: 'tier_3_price', example: 9200, note: 'Giá sỉ bậc 3.' },
  { vi: 'SL tối thiểu bậc 3', key: 'tier_3_min_qty', example: 1000, note: 'Số lượng tối thiểu áp dụng giá bậc 3.' },
];

const FIELD_TYPE_VI: Record<SpecField['type'], string> = {
  text: 'Chữ', number: 'Số', select: 'Chọn 1', multi_select: 'Chọn nhiều', boolean: 'Có/Không', textarea: 'Đoạn văn',
};

/** Header label: appends a “*” marker for required core columns. */
function coreLabel(c: CoreCol): string {
  return `${c.vi}${c.required ? ' *' : ''}`;
}
/** Header label for a spec column: appends unit and a “*” for required fields. */
function specLabel(f: SpecField): string {
  return `${f.label}${f.unit ? ` (${f.unit})` : ''}${f.required ? ' *' : ''}`;
}
/** A representative example so the sample row (row 3) is meaningful per field type. */
function specExample(f: SpecField): string | number {
  if (f.type === 'select' || f.type === 'multi_select') return f.options?.[0] ?? '';
  if (f.type === 'boolean') return 'Có';
  if (f.type === 'number') {
    if (f.unit === 'ml') return 100;
    if (f.unit === 'mm') return 50;
    if (f.unit === 'cm') return 10;
    if (f.unit === 'g' || f.unit === 'kg') return 50;
    return 1;
  }
  return '';
}

// ── Excel cell styles (xlsx-js-style) — mirror the original V4 palette ────────────
// Core columns → navy header; Spec columns → teal header; thin grey borders.
const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: 'BDC3C7' } },
  bottom: { style: 'thin', color: { rgb: 'BDC3C7' } },
  left: { style: 'thin', color: { rgb: 'BDC3C7' } },
  right: { style: 'thin', color: { rgb: 'BDC3C7' } },
};
const STYLE_CORE_HEAD = {
  font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '2C3E50' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_THIN,
};
const STYLE_SPEC_HEAD = { ...STYLE_CORE_HEAD, fill: { fgColor: { rgb: '117A65' } } };
const STYLE_CORE_KEY = {
  font: { name: 'Segoe UI', italic: true, sz: 10, color: { rgb: 'DFE4EA' } },
  fill: { fgColor: { rgb: '34495E' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_THIN,
};
const STYLE_SPEC_KEY = { ...STYLE_CORE_KEY, fill: { fgColor: { rgb: '16A085' } } };
const STYLE_DATA_TEXT = {
  font: { name: 'Segoe UI', sz: 10, color: { rgb: '2C3E50' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: BORDER_THIN,
};
const STYLE_DATA_NUM = {
  font: { name: 'Segoe UI', sz: 10, color: { rgb: '2C3E50' } },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: BORDER_THIN,
  numFmt: '#,##0',
};
const STYLE_GUIDE_TITLE = {
  font: { name: 'Segoe UI', bold: true, sz: 13, color: { rgb: '2C3E50' } },
  alignment: { horizontal: 'left', vertical: 'center' },
};
const STYLE_GUIDE_SUB = {
  font: { name: 'Segoe UI', italic: true, sz: 10, color: { rgb: '566573' } },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
};
const STYLE_GUIDE_CELL = {
  font: { name: 'Segoe UI', sz: 10, color: { rgb: '2C3E50' } },
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  border: BORDER_THIN,
};

const UPLOAD_CONCURRENCY = 5;

type Phase = 'idle' | 'parsed' | 'importing' | 'uploading' | 'done';

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

interface ImageCounts {
  uploaded: number;
  skipped: number;
  failed: number;
}

interface ImageFailure {
  sku: string;
  filename: string;
  error: string;
}

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

/** SHA-256 hex of a file's bytes (browser-side dedup hash). */
async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Runs an async worker over items with bounded concurrency. */
async function runQueue<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const pump = async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, pump));
}

interface ImportClientProps {
  specTemplates: TemplateRegistry;
}

export function ImportClient({ specTemplates }: ImportClientProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    specTemplates.keys.includes('glass_container') ? 'glass_container' : (specTemplates.keys[0] ?? 'glass_container'),
  );
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [v4Rows, setV4Rows] = useState<V4ImportRow[]>([]);
  const [uiValidation, setUiValidation] = useState<UIValidation | null>(null);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);

  const [imageGroups, setImageGroups] = useState<Map<string, SkuImageGroup<File>>>(new Map());
  const [skippedNonImages, setSkippedNonImages] = useState(0);

  const [commitResult, setCommitResult] = useState<V4ImportResult | null>(null);
  const [imageProgress, setImageProgress] = useState({ done: 0, total: 0 });
  const [imageCounts, setImageCounts] = useState<ImageCounts>({ uploaded: 0, skipped: 0, failed: 0 });
  const [imageFailures, setImageFailures] = useState<ImageFailure[]>([]);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const isBusy = phase === 'importing' || phase === 'uploading';

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
          workbook.SheetNames.find((n) => /SẢN PHẨM|SAN PHAM|ProductTemplate/i.test(n)) ??
          workbook.SheetNames[0];
        const worksheet = workbook.Sheets[dataSheetName];

        const flatRows = await parseExcelWithTechKeys(worksheet);
        if (flatRows.length === 0) {
          setUiValidation({
            ok: false, errors: [], warnings: [], validCount: 0,
            errorCount: 0, insertCount: 0, upsertCount: 0,
            globalError: 'File không có dữ liệu sản phẩm hợp lệ. Đảm bảo dòng 2 chứa tên biến kỹ thuật (sku, slug, spec.*…).',
          });
          setPhase('parsed');
          return;
        }

        const grouped: V4ImportRow[] = flatRows.map((flatRow) => {
          const { cleanRow, specs } = groupSpecAttributes(flatRow);
          return { ...cleanRow, specs } as V4ImportRow;
        });
        setV4Rows(grouped);

        const result = await validateV4ImportAction(grouped);
        setUiValidation(v4ToUI(result));
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
  }, []);

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isBusy) return;
    setExcelFile(file);
    processExcel(file);
  };

  // ── Folder selection (webkitdirectory) → Map<SKU, File[]> ───────────────
  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBusy) return;
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const { groups, skippedNonImages: skipped } = buildSkuImageMap(files);
    setImageGroups(groups);
    setSkippedNonImages(skipped.length);
  };

  // ── Commit: upsert products, then stream images per SKU ─────────────────
  const handleCommitImport = async () => {
    if (v4Rows.length === 0) return;
    setPhase('importing');
    setImageFailures([]);
    setImageCounts({ uploaded: 0, skipped: 0, failed: 0 });

    let result: V4ImportResult;
    try {
      result = await importV4UpsertAction(v4Rows, excelFile?.name ?? null);
    } catch (err) {
      console.error('V4 import failed:', err);
      setCommitResult({
        ok: false, jobId: null, upserted: 0, inserted: 0, updated: 0,
        tierCount: 0, imageCount: 0, skuToProductId: {},
        error: 'Đã xảy ra lỗi hệ thống khi lưu dữ liệu.',
      });
      setPhase('done');
      return;
    }

    setCommitResult(result);
    if (!result.ok) {
      setPhase('done');
      return;
    }

    // Build the upload task list for SKUs that were upserted AND have a folder.
    const tasks: { sku: string; productId: string; file: File; sortOrder: number; isPrimary: boolean }[] = [];
    for (const [sku, group] of imageGroups) {
      const productId = result.skuToProductId[sku];
      if (!productId) continue;
      group.files.forEach((file, idx) => {
        tasks.push({ sku, productId, file, sortOrder: idx, isPrimary: idx === group.thumbnailIndex });
      });
    }

    if (tasks.length === 0) {
      await finalizeImportImagesAction(result.jobId, { uploaded: 0, skipped: 0, failed: 0 });
      setPhase('done');
      return;
    }

    // Stream images with bounded concurrency.
    setPhase('uploading');
    setImageProgress({ done: 0, total: tasks.length });
    const counts: ImageCounts = { uploaded: 0, skipped: 0, failed: 0 };
    const failures: ImageFailure[] = [];

    await runQueue(tasks, UPLOAD_CONCURRENCY, async (task) => {
      try {
        const hash = await sha256Hex(task.file);
        const fd = new FormData();
        fd.set('job_id', result.jobId ?? '');
        fd.set('product_id', task.productId);
        fd.set('sku', task.sku);
        fd.set('sort_order', String(task.sortOrder));
        fd.set('is_primary', task.isPrimary ? 'true' : 'false');
        fd.set('content_hash', hash);
        fd.set('file', task.file);

        const res = await uploadImportImageAction({ status: 'failed' }, fd);
        if (res.status === 'uploaded') counts.uploaded++;
        else if (res.status === 'skipped') counts.skipped++;
        else {
          counts.failed++;
          failures.push({ sku: task.sku, filename: task.file.name, error: res.error ?? 'Lỗi không xác định.' });
        }
      } catch (err) {
        counts.failed++;
        failures.push({ sku: task.sku, filename: task.file.name, error: err instanceof Error ? err.message : 'Lỗi tải ảnh.' });
      } finally {
        setImageProgress((p) => ({ done: p.done + 1, total: p.total }));
        setImageCounts({ ...counts });
      }
    });

    setImageFailures(failures);
    await finalizeImportImagesAction(result.jobId, counts);
    setPhase('done');
  };

  const handleDownloadV4Template = async (code: string) => {
    try {
      const tpl = specTemplates.templates[code];
      const fields = [...(tpl?.fields ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      // xlsx-js-style = SheetJS + cell-style support, so the template keeps the
      // navy/teal header palette of the original V4 file (plain `xlsx` cannot write fills).
      const XLSX = await import('xlsx-js-style');
      const wb = XLSX.utils.book_new();
      const coreCount = V4_CORE_COLUMNS.length;

      // ── Sheet 1: ProductTemplate (row 1 = VI label, row 2 = tech key, row 3 = sample) ──
      const viHeaders = [...V4_CORE_COLUMNS.map(coreLabel), ...fields.map(specLabel)];
      const techKeys = [...V4_CORE_COLUMNS.map((c) => c.key), ...fields.map((f) => `spec.${f.key}`)];
      const exampleRow = [
        ...V4_CORE_COLUMNS.map((c) => (c.key === 'template_code' ? code : c.example)),
        ...fields.map(specExample),
      ];
      const ws = XLSX.utils.aoa_to_sheet([viHeaders, techKeys, exampleRow]);
      const totalCols = viHeaders.length;
      ws['!cols'] = [...V4_CORE_COLUMNS, ...fields].map(() => ({ wch: 22 }));
      ws['!rows'] = [{ hpx: 34 }, { hpx: 22 }, { hpx: 24 }];

      // Two-tone header palette: navy for core columns, teal for spec columns.
      for (let c = 0; c < totalCols; c++) {
        const isSpec = c >= coreCount;
        const headRef = XLSX.utils.encode_cell({ r: 0, c });
        const keyRef = XLSX.utils.encode_cell({ r: 1, c });
        const dataRef = XLSX.utils.encode_cell({ r: 2, c });
        if (ws[headRef]) ws[headRef].s = isSpec ? STYLE_SPEC_HEAD : STYLE_CORE_HEAD;
        if (ws[keyRef]) ws[keyRef].s = isSpec ? STYLE_SPEC_KEY : STYLE_CORE_KEY;
        if (ws[dataRef]) ws[dataRef].s = ws[dataRef].t === 'n' ? STYLE_DATA_NUM : STYLE_DATA_TEXT;
      }
      XLSX.utils.book_append_sheet(wb, ws, 'ProductTemplate');

      // ── Sheet 2: Hướng dẫn (human-readable column guide) ──
      const guideHeader = ['STT', 'Cột (nhãn dòng 1)', 'Khoá kỹ thuật (dòng 2)', 'Bắt buộc', 'Kiểu', 'Đơn vị', 'Giá trị cho phép', 'Ghi chú'];
      const coreGuide = V4_CORE_COLUMNS.map((c, i) => [
        i + 1, c.vi, c.key, c.required ? 'Bắt buộc' : 'Tùy chọn', '', '', '', c.note,
      ]);
      const specGuide = fields.map((f, i) => [
        coreCount + i + 1,
        f.label,
        `spec.${f.key}`,
        f.required ? 'Bắt buộc' : 'Tùy chọn',
        FIELD_TYPE_VI[f.type] ?? f.type,
        f.unit ?? '',
        (f.options ?? []).join(' / '),
        f.type === 'select' || f.type === 'multi_select' ? 'Chỉ nhập đúng một trong các giá trị cho phép.' : '',
      ]);
      const guideAoa = [
        [`HƯỚNG DẪN NHẬP — Loại sản phẩm: ${tpl?.label ?? code} (${code})`],
        ['Dòng 1 = nhãn tiếng Việt · Dòng 2 = khoá kỹ thuật (GIỮ NGUYÊN, không sửa) · Nhập dữ liệu từ dòng 3.'],
        ['Ảnh: tạo thư mục con tên = Mã sản phẩm (SKU), bỏ ảnh vào trong; ưu tiên ảnh đại diện cover.*'],
        [],
        guideHeader,
        ...coreGuide,
        ...specGuide,
      ];
      const guideWs = XLSX.utils.aoa_to_sheet(guideAoa);
      guideWs['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 26 }, { wch: 12 }, { wch: 11 }, { wch: 9 }, { wch: 42 }, { wch: 52 }];
      guideWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
      ];
      if (guideWs['A1']) guideWs['A1'].s = STYLE_GUIDE_TITLE;
      if (guideWs['A2']) guideWs['A2'].s = STYLE_GUIDE_SUB;
      if (guideWs['A3']) guideWs['A3'].s = STYLE_GUIDE_SUB;
      for (let c = 0; c < guideHeader.length; c++) {
        const ref = XLSX.utils.encode_cell({ r: 4, c });
        if (guideWs[ref]) guideWs[ref].s = STYLE_CORE_HEAD;
      }
      for (let r = 5; r < guideAoa.length; r++) {
        for (let c = 0; c < guideHeader.length; c++) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (guideWs[ref]) guideWs[ref].s = STYLE_GUIDE_CELL;
        }
      }
      XLSX.utils.book_append_sheet(wb, guideWs, 'Hướng dẫn');

      XLSX.writeFile(wb, `MauFileSanPham_Gnest_V4_${code}.xlsx`);
    } catch {
      alert('Không thể tạo file mẫu. Vui lòng thử lại.');
    }
  };

  const handleReset = () => {
    if (isBusy) return;
    setPhase('idle');
    setExcelFile(null);
    setV4Rows([]);
    setUiValidation(null);
    setImageGroups(new Map());
    setSkippedNonImages(0);
    setCommitResult(null);
    setImageProgress({ done: 0, total: 0 });
    setImageCounts({ uploaded: 0, skipped: 0, failed: 0 });
    setImageFailures([]);
    if (excelInputRef.current) excelInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const totalRows = v4Rows.length;
  const totalErrors = uiValidation?.errorCount ?? 0;
  const validRowsCount = uiValidation?.validCount ?? totalRows;
  const selectedFields = [...(specTemplates.templates[selectedTemplate]?.fields ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const selectedLabel = specTemplates.templates[selectedTemplate]?.label ?? selectedTemplate;

  const excelSkus = useMemo(
    () => new Set(v4Rows.map((r) => String(r.sku ?? '').trim()).filter(Boolean)),
    [v4Rows],
  );
  const imageSkus = useMemo(() => new Set(imageGroups.keys()), [imageGroups]);
  const matchedSkus = useMemo(
    () => [...imageSkus].filter((s) => excelSkus.has(s)),
    [imageSkus, excelSkus],
  );
  const orphanFolders = useMemo(
    () => [...imageSkus].filter((s) => !excelSkus.has(s)),
    [imageSkus, excelSkus],
  );
  const totalMatchedImages = useMemo(
    () => matchedSkus.reduce((sum, s) => sum + (imageGroups.get(s)?.files.length ?? 0), 0),
    [matchedSkus, imageGroups],
  );
  const folderSelected = imageGroups.size > 0 || skippedNonImages > 0;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={excelInputRef}
        onChange={handleExcelChange}
        accept=".xlsx,.xls"
        disabled={isBusy}
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        disabled={isBusy}
        multiple
        className="hidden"
        // webkitdirectory/directory are non-standard input attributes; cast so TS accepts them.
        {...({ webkitdirectory: '', directory: '' } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
      />

      <div className="flex items-center">
        <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm font-semibold text-[#4880FF] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách sản phẩm
        </Link>
      </div>

      {/* ── PHASE: idle ──────────────────────────────────────────────────── */}
      {phase === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white border border-[#EEF2F6] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">File mẫu Excel V4</h3>

            <div className="space-y-1.5">
              <label htmlFor="tpl-picker" className="text-[11px] font-bold text-slate-500">
                Chọn loại sản phẩm để lấy đúng cột thông số
              </label>
              <select
                id="tpl-picker"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full rounded-lg border border-[#D1D8E8] bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-[#4880FF] focus:outline-none focus:ring-2 focus:ring-[#4880FF]/20"
              >
                {specTemplates.keys.map((k) => (
                  <option key={k} value={k}>
                    {specTemplates.templates[k]?.label ?? k} — {k}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadV4Template(selectedTemplate)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#4880FF] hover:bg-[#3769D6] text-sm font-bold text-white px-4 py-2.5 transition"
            >
              <Download className="h-4 w-4" />
              Tải file mẫu — {selectedLabel}
            </button>

            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 space-y-1">
              <p className="font-bold">Cấu trúc file V4:</p>
              <p><strong>Dòng 1</strong> — Tiêu đề tiếng Việt (hiển thị)</p>
              <p><strong>Dòng 2</strong> — Tên biến kỹ thuật (<code className="bg-amber-100 px-0.5 rounded">sku</code>, <code className="bg-amber-100 px-0.5 rounded">slug</code>, <code className="bg-amber-100 px-0.5 rounded">spec.cap_type</code>…)</p>
              <p><strong>Dòng 3+</strong> — Dữ liệu sản phẩm</p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-[11px] leading-relaxed text-emerald-800 space-y-1">
              <p className="font-bold flex items-center gap-1"><RefreshCw className="h-3 w-3" /> UPSERT theo SKU:</p>
              <p>Đối chiếu &amp; cập nhật theo <code className="bg-emerald-100 px-0.5 rounded">Mã sản phẩm (SKU)</code>. Import lại để bổ sung thông số / ảnh — dữ liệu cũ được giữ nguyên, chỉ ghi đè giá trị mới.</p>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-[11px] leading-relaxed text-blue-800 space-y-1">
              <p className="font-bold flex items-center gap-1"><FolderOpen className="h-3 w-3" /> Ảnh từ thư mục máy tính:</p>
              <p>Chọn thư mục chứa các thư mục con đặt tên đúng theo <code className="bg-blue-100 px-0.5 rounded">SKU</code>, ví dụ <code className="bg-blue-100 px-0.5 rounded">HLG100P53/01.jpg</code>. Ảnh tải thẳng lên Supabase Storage tại <code className="bg-blue-100 px-0.5 rounded">products/&#123;SKU&#125;/</code>. Ưu tiên ảnh đại diện: <code className="bg-blue-100 px-0.5 rounded">cover.*</code> → <code className="bg-blue-100 px-0.5 rounded">01.*</code> → ảnh đầu tiên.</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">
              <p className="font-bold mb-1.5 text-slate-700">
                Thông số kỹ thuật của <span className="text-[#4880FF]">{selectedLabel}</span>{' '}
                <span className="font-normal text-slate-400">({selectedFields.length} cột spec)</span>
              </p>
              {selectedFields.length === 0 ? (
                <p className="text-slate-400 italic">Loại này chưa khai báo thông số kỹ thuật.</p>
              ) : (
                <ul className="space-y-1">
                  {selectedFields.map((f) => (
                    <li key={f.key} className="leading-snug">
                      <code className="bg-white border border-slate-200 px-1 rounded text-[10px]">spec.{f.key}</code>{' '}
                      <span className="text-slate-700">{f.label}</span>
                      {f.unit ? <span className="text-slate-400"> ({f.unit})</span> : null}
                      {f.required ? <span className="text-red-500 font-bold"> *</span> : null}
                      {f.options?.length ? (
                        <span className="block text-slate-400 pl-1">↳ {f.options.join(' / ')}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-white border border-[#EEF2F6] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 mb-1">1 · Chọn file Excel sản phẩm</h3>
            <div
              onClick={() => !isBusy && excelInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center gap-2 min-h-[160px] cursor-pointer ${
                excelFile ? 'border-emerald-400 bg-emerald-50' : 'border-[#D1D8E8] hover:border-[#4880FF] bg-[#F7F9FB] hover:bg-[#F0F4FF]'
              }`}
            >
              {excelFile ? (
                <>
                  <FileSpreadsheet className="h-9 w-9 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-700 break-all px-1">{excelFile.name}</p>
                  <p className="text-[11px] text-emerald-600">Bấm để đổi file</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-9 w-9 text-[#4880FF]/60" />
                  <p className="text-sm font-semibold text-slate-700">Kéo thả hoặc <span className="text-[#4880FF]">chọn file</span></p>
                  <p className="text-[11px] text-slate-400">.xlsx, .xls · Tối đa 2000 sản phẩm</p>
                </>
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-700 mb-1">2 · Chọn thư mục ảnh (tuỳ chọn)</h3>
            <div
              onClick={() => !isBusy && folderInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center gap-2 min-h-[160px] cursor-pointer ${
                folderSelected ? 'border-blue-400 bg-blue-50' : 'border-[#D1D8E8] hover:border-[#4880FF] bg-[#F7F9FB] hover:bg-[#F0F4FF]'
              }`}
            >
              <FolderOpen className={`h-9 w-9 ${folderSelected ? 'text-blue-500' : 'text-[#4880FF]/60'}`} />
              {folderSelected ? (
                <>
                  <p className="text-sm font-semibold text-blue-700">{imageGroups.size} thư mục SKU · {[...imageGroups.values()].reduce((s, g) => s + g.files.length, 0)} ảnh</p>
                  {skippedNonImages > 0 && <p className="text-[11px] text-amber-600">{skippedNonImages} tệp không phải ảnh đã bỏ qua</p>}
                  <p className="text-[11px] text-blue-600">Bấm để chọn lại thư mục</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-700">Chọn <span className="text-[#4880FF]">thư mục gốc</span> chứa các thư mục con theo SKU</p>
                  <p className="text-[11px] text-slate-400">Mỗi thư mục con = 1 SKU · jpg, png, webp</p>
                </>
              )}
            </div>

            {isProcessingExcel && (
              <div className="flex items-center gap-2 text-sm text-[#4880FF]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang phân tích &amp; kiểm tra file Excel…
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PHASE: parsed ────────────────────────────────────────────────── */}
      {phase === 'parsed' && (
        <div className="bg-white border border-[#EEF2F6] rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-start justify-between border-b border-[#EEF2F6] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-700">Xem trước &amp; Kiểm tra dữ liệu</h3>
                <span className="text-[10px] font-bold bg-[#4880FF] text-white px-2 py-0.5 rounded-full">V4 · UPSERT theo SKU</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {excelFile?.name ?? 'File Excel'} · {totalRows} dòng · {totalMatchedImages} ảnh khớp SKU
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={isBusy}
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
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
              <ImageIcon className="h-7 w-7 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-indigo-500">Ảnh khớp SKU</div>
                <div className="text-lg font-black text-indigo-800">{totalMatchedImages}</div>
              </div>
            </div>
          </div>

          {uiValidation?.globalError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {uiValidation.globalError}
            </div>
          )}

          {orphanFolders.length > 0 && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span><strong>{orphanFolders.length} thư mục ảnh</strong> không khớp SKU nào trong Excel và sẽ bị bỏ qua: <code className="text-xs">{orphanFolders.slice(0, 8).join(', ')}{orphanFolders.length > 8 ? '…' : ''}</code></span>
            </div>
          )}

          {(uiValidation?.upsertCount ?? 0) > 0 && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <RefreshCw className="h-4 w-4 mt-0.5 shrink-0" />
              <span><strong>{uiValidation!.upsertCount} sản phẩm</strong> đã tồn tại theo SKU và sẽ được cập nhật. Thông số mới được bổ sung, dữ liệu cũ còn thiếu không bị ghi đè.</span>
            </div>
          )}

          {totalErrors > 0 && (
            <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Danh sách lỗi ({totalErrors})
              </h4>
              <div className="max-h-52 overflow-y-auto text-xs text-red-700 divide-y divide-red-200/60">
                {uiValidation?.errors.map((err, idx) => (
                  <div key={idx} className="py-2">
                    <strong>Dòng {err.row}</strong>{' · '}
                    <code className="bg-red-100 px-0.5 rounded">{err.field}</code>{': '}{err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product preview */}
          <div className="border border-[#EEF2F6] rounded-xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-500 w-10">#</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-500">SKU</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-500">Tên sản phẩm</th>
                    <th className="px-3 py-2.5 text-left font-bold text-slate-500 hidden md:table-cell">Trạng thái</th>
                    <th className="px-3 py-2.5 text-right font-bold text-slate-500 hidden md:table-cell">Giá bán</th>
                    <th className="px-3 py-2.5 text-center font-bold text-slate-500 w-24">Ảnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4FA]">
                  {v4Rows.map((row, idx) => {
                    const sku = String(row.sku ?? '').trim();
                    const isUpdate = (uiValidation?.warnings ?? []).some(
                      (w) => w.row === (row.row ?? idx + 3) && w.field === 'sku',
                    );
                    const imgCount = sku ? (imageGroups.get(sku)?.files.length ?? 0) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{sku || <span className="text-red-400">—</span>}</td>
                        <td className="px-3 py-2 font-medium text-slate-700 max-w-[180px] truncate">{String(row.name ?? '—')}</td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          {isUpdate ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              <RefreshCw className="h-2.5 w-2.5" /> Cập nhật
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                              <PlusCircle className="h-2.5 w-2.5" /> Tạo mới
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600 hidden md:table-cell">
                          {row.price != null && row.price !== '' ? Number(row.price).toLocaleString('vi-VN') + '₫' : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {imgCount > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              <ImageIcon className="h-2.5 w-2.5" /> {imgCount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-300 text-[10px]">Chưa có</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EEF2F6]">
            {totalErrors > 0 && validRowsCount > 0 && (
              <p className="text-xs text-slate-400 italic mr-auto">
                * {totalErrors} dòng lỗi sẽ bị bỏ qua. Chỉ nhập {validRowsCount} dòng hợp lệ.
              </p>
            )}
            <button
              type="button"
              onClick={handleReset}
              disabled={isBusy}
              className="bg-white border border-[#D1D8E8] text-slate-600 font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition disabled:opacity-40"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={validRowsCount === 0 || isBusy}
              className="inline-flex items-center gap-1.5 bg-[#4880FF] text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#3769D6] transition disabled:opacity-40"
            >
              Xác nhận Nhập ({validRowsCount} sản phẩm)
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE: importing / uploading ─────────────────────────────────── */}
      {(phase === 'importing' || phase === 'uploading') && (
        <div className="bg-white border border-[#EEF2F6] rounded-xl p-8 shadow-sm flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#4880FF]" />
          {phase === 'importing' ? (
            <p className="text-sm font-semibold text-slate-600">Đang lưu sản phẩm (UPSERT theo SKU)…</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-600">Đang tải ảnh lên Supabase Storage…</p>
              <div className="w-full max-w-md">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4880FF] transition-all"
                    style={{ width: `${imageProgress.total ? (imageProgress.done / imageProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  {imageProgress.done}/{imageProgress.total} ảnh · {imageCounts.uploaded} tải lên · {imageCounts.skipped} bỏ qua · {imageCounts.failed} lỗi
                </p>
              </div>
            </>
          )}
          <p className="text-[11px] text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-md">
            Vui lòng không đóng trình duyệt cho đến khi hoàn tất.
          </p>
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
                <p className="text-sm text-slate-500">
                  <strong className="text-emerald-700">{commitResult.inserted}</strong> sản phẩm mới ·{' '}
                  <strong className="text-blue-700">{commitResult.updated}</strong> sản phẩm cập nhật
                  {commitResult.tierCount > 0 && <> · <strong className="text-slate-700">{commitResult.tierCount}</strong> mức giá sỉ</>}
                </p>
                {(imageCounts.uploaded > 0 || imageCounts.skipped > 0 || imageCounts.failed > 0) && (
                  <p className="text-xs text-indigo-600 inline-flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    {imageCounts.uploaded} ảnh tải lên · {imageCounts.skipped} bỏ qua (trùng) · {imageCounts.failed} lỗi
                  </p>
                )}
              </div>

              {imageFailures.length > 0 && (
                <div className="w-full max-w-lg text-left bg-red-50/50 border border-red-200 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-red-800">Ảnh lỗi ({imageFailures.length}):</p>
                  <div className="max-h-32 overflow-y-auto text-[11px] text-red-700 divide-y divide-red-200/60">
                    {imageFailures.map((f, i) => (
                      <div key={i} className="py-1"><code>{f.sku}/{f.filename}</code>: {f.error}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <Link href="/admin/products" className="bg-[#4880FF] text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#3769D6] transition">
                  Xem danh sách sản phẩm
                </Link>
                <button type="button" onClick={handleReset} className="bg-white border border-[#D1D8E8] text-slate-600 font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition">
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
              <button type="button" onClick={() => setPhase('parsed')} className="bg-white border border-[#D1D8E8] text-slate-600 font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition">
                Quay lại
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
