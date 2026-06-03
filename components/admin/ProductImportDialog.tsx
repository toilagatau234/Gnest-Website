'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { useToast } from '@/components/admin/AdminToast';
import {
  importProductsAction,
  type ImportResult,
  type ImportRow,
} from '@/app/admin/(dashboard)/products/import-actions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = '.xlsx,.xls,.csv';
const INITIAL_STATE: ImportResult = { ok: false };

const REQUIRED_COLUMNS = ['name', 'slug', 'category_slug'] as const;
const ALL_COLUMNS = [
  'name',
  'slug',
  'category_slug',
  'description',
  'price',
  'stock',
  'is_active',
  'specs',
] as const;

// ---------------------------------------------------------------------------
// Sample template download
// ---------------------------------------------------------------------------

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const sampleRows = [
    {
      name: 'Hũ thủy tinh 500ml nút nhôm',
      slug: 'hu-thuy-tinh-500ml-nut-nhom',
      category_slug: 'chai-lo-thuy-tinh',
      description: 'Mô tả ngắn hiển thị cho catalog sỉ.',
      price: 18500,
      stock: 240,
      is_active: 'true',
      specs: '{"dungTich":"500ml","chatLieu":"Thuy tinh","quyCach":"48 chai/thung"}',
    },
    {
      name: 'Nắp thiếc sơn 58mm',
      slug: 'nap-thiec-son-58mm',
      category_slug: 'phu-kien-nganh-yen-sao',
      description: 'Phụ kiện đi kèm cho hũ thủy tinh.',
      price: 2100,
      stock: 1000,
      is_active: 'true',
      specs: '{"duongKinh":"58mm","mauSac":"Vang"}',
    },
    {
      name: '',
      slug: '',
      category_slug: '',
      description: '',
      price: '',
      stock: '',
      is_active: 'true',
      specs: '',
    },
  ];
  const instructions = [
    ['Hướng dẫn nhanh', 'Chi tiết'],
    ['1', 'Không đổi tên các cột trong sheet Products Template.'],
    ['2', 'Cột bắt buộc: name, slug, category_slug.'],
    ['3', 'slug chỉ dùng chữ thường, số và dấu gạch ngang.'],
    ['4', 'category_slug phải khớp với slug danh mục đang hiển thị trong CMS.'],
    ['5', 'price là số không âm. Để trống nếu muốn hiển thị "Liên hệ".'],
    ['6', 'stock là số nguyên >= 0.'],
    ['7', 'is_active chấp nhận: true/false, 1/0, yes/no, active/hidden.'],
    ['8', 'specs là JSON object hợp lệ, ví dụ {"dungTich":"500ml","chatLieu":"Thuy tinh"}.'],
    ['9', 'Nên nhập tối đa 500 dòng cho mỗi lần import.'],
  ];
  const validValues = [
    ['Trường', 'Giá trị hợp lệ / ghi chú'],
    ['category_slug', 'Lấy từ trang Danh mục trong admin'],
    ['is_active', 'true, false, 1, 0, yes, no, active, hidden'],
    ['price', 'Số không âm, ví dụ 18500'],
    ['stock', 'Số nguyên không âm, ví dụ 240'],
    ['specs', '{"dungTich":"500ml","chatLieu":"Thuy tinh"}'],
  ];
  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: [...ALL_COLUMNS] });
  ws['!cols'] = [28, 32, 24, 40, 14, 12, 14, 44].map((w) => ({ wch: w }));
  ws['!autofilter'] = { ref: 'A1:H4' };
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet['!cols'] = [{ wch: 8 }, { wch: 110 }];

  const validValuesSheet = XLSX.utils.aoa_to_sheet(validValues);
  validValuesSheet['!cols'] = [{ wch: 18 }, { wch: 80 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Products Template');
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');
  XLSX.utils.book_append_sheet(wb, validValuesSheet, 'Valid Values');
  XLSX.writeFile(wb, 'mau-nhap-san-pham.xlsx');
}

// ---------------------------------------------------------------------------
// Error CSV export
// ---------------------------------------------------------------------------

function downloadErrorsCsv(errors: NonNullable<ImportResult['errors']>) {
  const rows = errors.map((e) => [e.row, e.field, e.value, e.message, e.suggestion ?? '']);
  const ws = XLSX.utils.aoa_to_sheet([['Dòng', 'Cột', 'Giá trị', 'Lỗi', 'Gợi ý'], ...rows]);
  ws['!cols'] = [8, 16, 24, 40, 40].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lỗi');
  XLSX.writeFile(wb, 'loi-nhap-san-pham.xlsx');
}

// ---------------------------------------------------------------------------
// Parse Excel / CSV file client-side
// ---------------------------------------------------------------------------

interface ParsedFile {
  rows: ImportRow[];
  parseError?: string;
}

function parseFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return resolve({ rows: [], parseError: 'Không đọc được file.' });

        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) return resolve({ rows: [], parseError: 'File không có sheet dữ liệu.' });

        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: null,
          raw: false,
        });

        if (raw.length === 0) {
          return resolve({ rows: [], parseError: 'File không có dữ liệu (chỉ có header).' });
        }

        // Check required columns
        const firstRow = raw[0];
        const keys = Object.keys(firstRow).map((k) => k.trim().toLowerCase());
        const missing = REQUIRED_COLUMNS.filter((c) => !keys.includes(c));
        if (missing.length > 0) {
          return resolve({
            rows: [],
            parseError: `File thiếu cột bắt buộc: ${missing.join(', ')}.`,
          });
        }

        const rows: ImportRow[] = raw.map((r, i) => {
          const norm: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(r)) {
            norm[k.trim().toLowerCase()] = v;
          }
          const price = norm.price;
          const stock = norm.stock;
          const is_active = norm.is_active;
          return {
            row: i + 2, // +2: 1-indexed + header row
            name: String(norm.name ?? ''),
            slug: String(norm.slug ?? ''),
            category_slug: String(norm.category_slug ?? ''),
            description: norm.description != null ? String(norm.description) : null,
            price:
              price === null || price === undefined
                ? null
                : typeof price === 'string' || typeof price === 'number'
                  ? price
                  : String(price),
            stock:
              stock === null || stock === undefined
                ? null
                : typeof stock === 'string' || typeof stock === 'number'
                  ? stock
                  : String(stock),
            is_active:
              is_active === null || is_active === undefined
                ? null
                : typeof is_active === 'string' ||
                    typeof is_active === 'boolean' ||
                    typeof is_active === 'number'
                  ? is_active
                  : String(is_active),
            specs: norm.specs != null ? String(norm.specs) : null,
          } satisfies ImportRow;
        });

        resolve({ rows });
      } catch {
        resolve({ rows: [], parseError: 'Không thể phân tích file. Vui lòng dùng file .xlsx hoặc .csv.' });
      }
    };
    reader.readAsBinaryString(file);
  });
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function UploadStep({
  onFile,
}: {
  onFile: (rows: ImportRow[], filename: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParseError(null);
    if (file.size > MAX_FILE_BYTES) {
      setParseError('File quá lớn. Tối đa 5 MB.');
      return;
    }
    const { rows, parseError: err } = await parseFile(file);
    if (err) {
      setParseError(err);
      return;
    }
    onFile(rows, file.name);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Tải lên file Excel (.xlsx, .xls) hoặc CSV. Tối đa 500 dòng, 5 MB.
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EF] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-[#F7F9FB] hover:text-[#3749A6]"
        >
          <Download className="h-3.5 w-3.5" />
          Tải file mẫu
        </button>
      </div>

      {/* Drop zone */}
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition ${
          dragOver
            ? 'border-[#4880FF] bg-[#4880FF]/5'
            : 'border-[#D1D8E8] bg-[#F7F9FB] hover:border-[#4880FF]/60 hover:bg-[#F0F4FF]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <FileSpreadsheet className="h-10 w-10 text-[#4880FF]/60" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            Kéo thả file vào đây, hoặc{' '}
            <span className="text-[#4880FF]">chọn từ máy tính</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">.xlsx · .xls · .csv</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>

      {parseError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {parseError}
        </div>
      )}

      {/* Column guide */}
      <div className="rounded-xl border border-[#EEF2F6] bg-white p-4">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-400">
          Cột trong file Excel
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          {[
            { col: 'name', note: 'Bắt buộc' },
            { col: 'slug', note: 'Bắt buộc — chữ thường, gạch ngang' },
            { col: 'category_slug', note: 'Bắt buộc — slug danh mục đang hiển thị' },
            { col: 'description', note: 'Tùy chọn' },
            { col: 'price', note: 'Tùy chọn — số không âm' },
            { col: 'stock', note: 'Tùy chọn — số nguyên, mặc định 0' },
            { col: 'is_active', note: 'true/false, 1/0, yes/no, active/hidden' },
            { col: 'specs', note: 'JSON object — {"key":"value"}' },
          ].map(({ col, note }) => (
            <div key={col} className="flex items-baseline gap-1.5">
              <code className="rounded bg-[#F0F4FF] px-1.5 py-0.5 font-mono text-[11px] text-[#3749A6]">
                {col}
              </code>
              <span className="text-slate-400">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PreviewStepProps {
  filename: string;
  rows: ImportRow[];
  state: ImportResult;
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

function PreviewStep({ filename, rows, state, isPending, onBack, onConfirm }: PreviewStepProps) {
  const errors = state.errors ?? [];
  const errorsByRow = new Map<number, typeof errors>();
  for (const e of errors) {
    if (!errorsByRow.has(e.row)) errorsByRow.set(e.row, []);
    errorsByRow.get(e.row)!.push(e);
  }

  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            <FileSpreadsheet className="mr-1.5 inline h-4 w-4 text-slate-400" />
            {filename}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{rows.length} dòng dữ liệu</p>
        </div>
        {hasErrors && (
          <button
            type="button"
            onClick={() => downloadErrorsCsv(errors)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EF] px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-[#F7F9FB] hover:text-[#E31E24]"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất lỗi (.xlsx)
          </button>
        )}
      </div>

      {/* Global error */}
      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Validation errors summary */}
      {hasErrors && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <p className="text-sm font-semibold text-amber-800">
            <AlertCircle className="mr-1.5 inline h-4 w-4" />
            {errors.length} lỗi cần sửa trước khi nhập
          </p>
          <ul className="mt-2 space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-xs text-amber-700">
                <span className="font-semibold">Dòng {e.row}</span> · <code className="font-mono">{e.field}</code>
                {e.value ? ` (${e.value.length > 30 ? e.value.slice(0, 30) + '…' : e.value})` : ''}: {e.message}
                {e.suggestion ? <span className="text-amber-500"> → {e.suggestion}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Row preview table */}
      <div className="overflow-x-auto rounded-xl border border-[#EEF2F6]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#EEF2F6] bg-[#F7F9FB] text-left">
              <th className="px-3 py-2.5 font-semibold text-slate-500">#</th>
              <th className="px-3 py-2.5 font-semibold text-slate-500">Tên</th>
              <th className="px-3 py-2.5 font-semibold text-slate-500">Slug</th>
              <th className="px-3 py-2.5 font-semibold text-slate-500">Danh mục</th>
              <th className="px-3 py-2.5 font-semibold text-slate-500">Giá</th>
              <th className="px-3 py-2.5 font-semibold text-slate-500">Kho</th>
              <th className="px-3 py-2.5 font-semibold text-slate-500">Hiện</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row) => {
              const rowErrors = errorsByRow.get(row.row) ?? [];
              const rowHasError = rowErrors.length > 0;
              return (
                <tr
                  key={row.row}
                  className={`border-b border-[#EEF2F6] last:border-0 ${rowHasError ? 'bg-red-50' : 'bg-white even:bg-[#FAFBFD]'}`}
                >
                  <td className="px-3 py-2 text-slate-400">{row.row}</td>
                  <Cell value={row.name} error={rowErrors.find((e) => e.field === 'name')} />
                  <Cell value={row.slug} error={rowErrors.find((e) => e.field === 'slug')} />
                  <Cell value={row.category_slug} error={rowErrors.find((e) => e.field === 'category_slug')} />
                  <Cell value={row.price != null ? String(row.price) : '—'} error={rowErrors.find((e) => e.field === 'price')} />
                  <Cell value={row.stock != null ? String(row.stock) : '0'} />
                  <td className="px-3 py-2 text-slate-600">
                    {String(row.is_active ?? 'true').toLowerCase().replace('true', '✓').replace('false', '✗')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length > 50 && (
          <p className="bg-[#F7F9FB] px-3 py-2 text-xs text-slate-400">
            … và {rows.length - 50} dòng khác (đã ẩn)
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-60"
        >
          ← Chọn file khác
        </button>
        <AdminActionButton
          onClick={onConfirm}
          disabled={hasErrors || isPending}
          icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        >
          {isPending ? 'Đang nhập…' : `Xác nhận nhập ${rows.length} sản phẩm`}
        </AdminActionButton>
      </div>
    </div>
  );
}

function Cell({ value, error }: { value: string; error?: { message: string } }) {
  return (
    <td
      className={`max-w-[160px] truncate px-3 py-2 ${error ? 'text-red-600' : 'text-slate-700'}`}
      title={error ? error.message : value}
    >
      {value || <span className="text-slate-300">—</span>}
    </td>
  );
}

function SuccessStep({
  imported,
  onClose,
}: {
  imported: number;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <CheckCircle2 className="h-14 w-14 text-emerald-500" />
      <div>
        <p className="text-lg font-extrabold text-slate-800">Nhập thành công!</p>
        <p className="mt-1 text-sm text-slate-500">
          Đã tạo <span className="font-bold text-slate-700">{imported}</span> sản phẩm mới.
        </p>
      </div>
      <AdminActionButton onClick={onClose}>Đóng</AdminActionButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

type Step = 'upload' | 'preview';

export function ProductImportDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [filename, setFilename] = useState('');
  // Tracks whether a submit has been fired in this dialog session.
  // Allows us to derive showSuccess from state.ok without setState-in-effect.
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(importProductsAction, INITIAL_STATE);

  // showSuccess is purely derived — no setState needed
  const showSuccess = submitted && state.ok && state.imported != null;

  // router.refresh and toast are external side-effects: allowed inside useEffect
  useEffect(() => {
    if (submitted && state.ok) {
      router.refresh();
    }
  }, [submitted, state.ok, router]);

  useEffect(() => {
    if (submitted && state.error && !state.errors) {
      toast(state.error, 'error');
    }
  }, [submitted, state.error, state.errors, toast]);

  function openDialog() {
    setSubmitted(false);
    setStep('upload');
    setRows([]);
    setFilename('');
    setOpen(true);
  }

  function closeDialog() {
    if (isPending) return;
    setOpen(false);
  }

  function handleFileParsed(parsedRows: ImportRow[], name: string) {
    setRows(parsedRows);
    setFilename(name);
    setStep('preview');
  }

  function handleConfirm() {
    const form = formRef.current;
    if (!form) return;
    const input = form.querySelector<HTMLInputElement>('input[name="rows"]');
    if (input) input.value = JSON.stringify(rows);
    setSubmitted(true);
    form.requestSubmit();
  }

  const modalTitle = showSuccess
    ? 'Nhập hoàn tất'
    : step === 'upload'
      ? 'Nhập sản phẩm từ Excel'
      : 'Xem trước & xác nhận';

  const modalDescription = showSuccess
    ? undefined
    : step === 'upload'
      ? 'Tạo nhiều sản phẩm cùng lúc từ file Excel hoặc CSV.'
      : 'Kiểm tra dữ liệu và lỗi trước khi nhập vào hệ thống.';

  return (
    <>
      <AdminActionButton variant="secondary" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={openDialog}>
        Nhập Excel
      </AdminActionButton>

      <AdminModal
        open={open}
        onClose={closeDialog}
        title={modalTitle}
        description={modalDescription}
        size="2xl"
        dismissible={!isPending}
      >
        {/* Hidden form — submits only when user confirms */}
        <form ref={formRef} action={formAction} className="hidden">
          <input type="hidden" name="rows" defaultValue="" />
        </form>

        {showSuccess && (
          <SuccessStep imported={state.imported ?? 0} onClose={closeDialog} />
        )}

        {!showSuccess && step === 'upload' && (
          <UploadStep onFile={handleFileParsed} />
        )}

        {!showSuccess && step === 'preview' && (
          <PreviewStep
            filename={filename}
            rows={rows}
            state={state}
            isPending={isPending}
            onBack={() => setStep('upload')}
            onConfirm={handleConfirm}
          />
        )}
      </AdminModal>
    </>
  );
}
