'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { useToast } from '@/components/admin/AdminToast';
import {
  importProductsAction,
  validateProductsImportAction,
  type ImportResult,
  type ImportRow,
  type ImportRowWarning,
  type ValidationResult,
} from '@/app/admin/(dashboard)/products/import-actions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = '.xlsx,.xls,.csv';
const INITIAL_STATE: ImportResult = { ok: false };

const REQUIRED_COLUMNS = ['name', 'slug', 'category_slug'] as const;

const ALL_COLUMNS = [
  // Core — required
  'name',
  'slug',
  // Categories
  'parent_category_slug',
  'category_slug',
  // Core product data
  'base_price',
  'stock',
  'is_active',
  'description',
  // Physical spec fields → merged into specs JSONB
  'unit',
  'volume',
  'height',
  'diameter',
  'material',
  // Product images → product_images table
  'image_1_url',
  'image_2_url',
  'image_3_url',
  // Bulk discount tiers → product_bulk_discounts table
  'tier_1_min_quantity',
  'tier_1_price',
  'tier_2_min_quantity',
  'tier_2_price',
  'tier_3_min_quantity',
  'tier_3_price',
  'tier_4_min_quantity',
  'tier_4_price',
] as const;

// ---------------------------------------------------------------------------
// Professional sample template download
// ---------------------------------------------------------------------------

async function downloadTemplate() {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const sampleRows = [
    {
      name: 'Hũ thủy tinh 500ml nút nhôm',
      slug: 'hu-thuy-tinh-500ml-nut-nhom',
      parent_category_slug: 'bao-bi-thuc-pham',
      category_slug: 'chai-lo-thuy-tinh',
      base_price: 18500,
      stock: 240,
      is_active: 'true',
      description: 'Mô tả ngắn hiển thị trong catalog sỉ.',
      unit: 'chai',
      volume: '500ml',
      height: '12cm',
      diameter: '58mm',
      material: 'Thủy tinh',
      image_1_url: 'https://cdn.example.com/hu-thuy-tinh-500ml-1.jpg',
      image_2_url: 'https://cdn.example.com/hu-thuy-tinh-500ml-2.jpg',
      image_3_url: '',
      tier_1_min_quantity: 10,
      tier_1_price: 17000,
      tier_2_min_quantity: 50,
      tier_2_price: 15000,
      tier_3_min_quantity: 200,
      tier_3_price: 13500,
      tier_4_min_quantity: '',
      tier_4_price: '',
    },
    {
      name: 'Nắp thiếc sơn 58mm vàng',
      slug: 'nap-thiec-son-58mm-vang',
      parent_category_slug: '',
      category_slug: 'phu-kien-nganh-yen-sao',
      base_price: 2100,
      stock: 1000,
      is_active: 'true',
      description: 'Phụ kiện đi kèm cho hũ thủy tinh 58mm.',
      unit: 'cái',
      volume: '',
      height: '',
      diameter: '58mm',
      material: 'Thiếc',
      image_1_url: 'https://cdn.example.com/nap-thiec-58mm.jpg',
      image_2_url: '',
      image_3_url: '',
      tier_1_min_quantity: 100,
      tier_1_price: 1900,
      tier_2_min_quantity: 500,
      tier_2_price: 1700,
      tier_3_min_quantity: '',
      tier_3_price: '',
      tier_4_min_quantity: '',
      tier_4_price: '',
    },
    {
      name: '← Xóa hai dòng mẫu này trước khi nhập dữ liệu thực',
      slug: '',
      parent_category_slug: '',
      category_slug: '',
      base_price: '',
      stock: '',
      is_active: 'true',
      description: '',
      unit: '',
      volume: '',
      height: '',
      diameter: '',
      material: '',
      image_1_url: '',
      image_2_url: '',
      image_3_url: '',
      tier_1_min_quantity: '',
      tier_1_price: '',
      tier_2_min_quantity: '',
      tier_2_price: '',
      tier_3_min_quantity: '',
      tier_3_price: '',
      tier_4_min_quantity: '',
      tier_4_price: '',
    },
  ];

  const instructions = [
    ['#', 'Cột', 'Bắt buộc?', 'Đích DB', 'Mô tả & Quy tắc'],
    ['—', 'name', 'BẮT BUỘC', 'products.name', 'Tên sản phẩm hiển thị trong catalog.'],
    ['—', 'slug', 'BẮT BUỘC', 'products.slug', 'Chỉ chữ thường, số và dấu gạch ngang (không dấu, không khoảng trắng). Phải duy nhất toàn hệ thống.'],
    ['—', 'category_slug', 'BẮT BUỘC', 'products.category_id', 'Slug danh mục hiện đang hiển thị — lấy từ trang Danh mục trong admin.'],
    ['—', 'parent_category_slug', 'Tùy chọn', '(kiểm tra)', 'Slug danh mục cha để xác nhận quan hệ cha-con. Để trống nếu không cần kiểm tra.'],
    ['—', 'base_price', 'Tùy chọn', 'products.price', 'Giá niêm yết. Số không âm (VD: 18500). Để trống → hiển thị "Liên hệ tư vấn".'],
    ['—', 'stock', 'Tùy chọn', 'products.stock', 'Số lượng tồn kho (số nguyên ≥ 0). Để trống → mặc định 0.'],
    ['—', 'is_active', 'Tùy chọn', 'products.is_active', 'Trạng thái hiển thị. Chấp nhận: true/false, 1/0, yes/no, active/hidden. Để trống → true.'],
    ['—', 'description', 'Tùy chọn', 'products.description', 'Mô tả ngắn (text thuần). Không dùng HTML.'],
    ['—', 'unit', 'Tùy chọn', 'products.specs.unit', 'Đơn vị tính. VD: chai, cái, kg, hộp. Được lưu vào trường specs JSON.'],
    ['—', 'volume', 'Tùy chọn', 'products.specs.volume', 'Dung tích. VD: 500ml, 1L. Được lưu vào trường specs JSON.'],
    ['—', 'height', 'Tùy chọn', 'products.specs.height', 'Chiều cao. VD: 12cm. Được lưu vào trường specs JSON.'],
    ['—', 'diameter', 'Tùy chọn', 'products.specs.diameter', 'Đường kính. VD: 58mm. Được lưu vào trường specs JSON.'],
    ['—', 'material', 'Tùy chọn', 'products.specs.material', 'Chất liệu. VD: Thủy tinh, Thiếc, Nhựa PP. Được lưu vào trường specs JSON.'],
    ['—', 'image_1_url', 'Tùy chọn', 'product_images[0]', 'URL ảnh chính (https://...). Ảnh đầu tiên được đặt làm ảnh chính (is_primary=true).'],
    ['—', 'image_2_url', 'Tùy chọn', 'product_images[1]', 'URL ảnh phụ thứ hai (https://...).'],
    ['—', 'image_3_url', 'Tùy chọn', 'product_images[2]', 'URL ảnh phụ thứ ba (https://...).'],
    ['—', 'tier_1_min_quantity', 'Tùy chọn', 'product_bulk_discounts.min_quantity', 'Số lượng tối thiểu của bậc giá sỉ 1 (số nguyên > 0). Phải có cả tier_1_price.'],
    ['—', 'tier_1_price', 'Tùy chọn', 'product_bulk_discounts.price_per_unit', 'Giá mỗi đơn vị ở bậc sỉ 1 (số ≥ 0). Phải có cả tier_1_min_quantity.'],
    ['—', 'tier_2_min_quantity', 'Tùy chọn', 'product_bulk_discounts.min_quantity', 'Tương tự bậc 1 nhưng cho bậc 2.'],
    ['—', 'tier_2_price', 'Tùy chọn', 'product_bulk_discounts.price_per_unit', 'Tương tự bậc 1 nhưng cho bậc 2.'],
    ['—', 'tier_3_min_quantity', 'Tùy chọn', 'product_bulk_discounts.min_quantity', 'Tương tự bậc 1 nhưng cho bậc 3.'],
    ['—', 'tier_3_price', 'Tùy chọn', 'product_bulk_discounts.price_per_unit', 'Tương tự bậc 1 nhưng cho bậc 3.'],
    ['—', 'tier_4_min_quantity', 'Tùy chọn', 'product_bulk_discounts.min_quantity', 'Tương tự bậc 1 nhưng cho bậc 4.'],
    ['—', 'tier_4_price', 'Tùy chọn', 'product_bulk_discounts.price_per_unit', 'Tương tự bậc 1 nhưng cho bậc 4.'],
    ['', '', '', '', ''],
    ['GHI CHÚ', 'Giới hạn', '', '', 'Tối đa 500 dòng dữ liệu mỗi lần import.'],
    ['GHI CHÚ', 'Không đổi tên cột', '', '', 'Tên cột trong sheet "Products Template" phải giữ nguyên (case-insensitive).'],
    ['GHI CHÚ', 'Preview bắt buộc', '', '', 'Hệ thống luôn hiển thị màn hình xem trước. Dữ liệu chỉ được lưu sau khi admin xác nhận.'],
    ['GHI CHÚ', 'Ảnh — URL bên ngoài', '', '', 'Cột image_X_url nhận URL https://... Ảnh không được upload vào Supabase Storage khi import.'],
    ['GHI CHÚ', 'specs JSON nâng cao', '', '', 'Có thể thêm cột "specs" với JSON object để lưu thuộc tính tuỳ ý. Sẽ được merge với unit/volume/...'],
    ['KHÔNG HỖ TRỢ', 'wholesale_price', '', '', 'Không có trong schema. Nếu có giá trị sẽ bị bỏ qua và hiển thị cảnh báo khi preview.'],
    ['KHÔNG HỖ TRỢ', 'tags', '', '', 'Chưa có trong schema. Nếu có giá trị sẽ bị bỏ qua và hiển thị cảnh báo khi preview.'],
    ['KHÔNG HỖ TRỢ', 'sku', '', '', 'SKU chưa có cột riêng trong schema. Có thể lưu vào cột "specs" dưới dạng {"sku":"..."}'],
  ];

  const validValues = [
    ['Cột', 'Giá trị hợp lệ', 'Ví dụ'],
    ['name', 'Văn bản bất kỳ (không rỗng)', 'Hũ thủy tinh 500ml nút nhôm'],
    ['slug', 'Chữ thường + số + dấu gạch ngang; không khoảng trắng; duy nhất', 'hu-thuy-tinh-500ml-nut-nhom'],
    ['parent_category_slug', 'Slug danh mục cha đang hiển thị, hoặc để trống', 'bao-bi-thuc-pham'],
    ['category_slug', 'Slug danh mục con đang hiển thị (lấy từ trang Danh mục)', 'chai-lo-thuy-tinh'],
    ['base_price', 'Số không âm, hoặc để trống (= Liên hệ)', '18500'],
    ['stock', 'Số nguyên ≥ 0, hoặc để trống (= 0)', '240'],
    ['is_active', 'true / false / 1 / 0 / yes / no / active / hidden, hoặc để trống (= true)', 'true'],
    ['description', 'Text thuần, không dùng HTML', 'Mô tả ngắn cho catalog sỉ.'],
    ['unit', 'Text tự do', 'chai'],
    ['volume', 'Text tự do', '500ml'],
    ['height', 'Text tự do', '12cm'],
    ['diameter', 'Text tự do', '58mm'],
    ['material', 'Text tự do', 'Thủy tinh'],
    ['image_1_url', 'URL bắt đầu bằng https://, hoặc để trống', 'https://cdn.example.com/sp.jpg'],
    ['image_2_url', 'URL bắt đầu bằng https://, hoặc để trống', 'https://cdn.example.com/sp2.jpg'],
    ['image_3_url', 'URL bắt đầu bằng https://, hoặc để trống', ''],
    ['tier_N_min_quantity', 'Số nguyên > 0, hoặc để trống', '10'],
    ['tier_N_price', 'Số không âm, hoặc để trống', '17000'],
    ['', '', ''],
    ['Lưu ý bậc giá sỉ', 'Bậc N phải có đủ cả tier_N_min_quantity VÀ tier_N_price', ''],
    ['Lưu ý bậc giá sỉ', 'Các bậc trong cùng sản phẩm không được trùng min_quantity', ''],
    ['Lưu ý bậc giá sỉ', 'Bậc thấp hơn → số lượng nhỏ hơn (không bắt buộc, nhưng nên theo thứ tự)', ''],
  ];

  // Products Template sheet
  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: [...ALL_COLUMNS] });
  ws['!cols'] = [
    { wch: 32 }, // name
    { wch: 32 }, // slug
    { wch: 22 }, // parent_category_slug
    { wch: 22 }, // category_slug
    { wch: 14 }, // base_price
    { wch: 10 }, // stock
    { wch: 12 }, // is_active
    { wch: 40 }, // description
    { wch: 10 }, // unit
    { wch: 10 }, // volume
    { wch: 10 }, // height
    { wch: 10 }, // diameter
    { wch: 14 }, // material
    { wch: 44 }, // image_1_url
    { wch: 44 }, // image_2_url
    { wch: 44 }, // image_3_url
    { wch: 20 }, // tier_1_min_quantity
    { wch: 14 }, // tier_1_price
    { wch: 20 }, // tier_2_min_quantity
    { wch: 14 }, // tier_2_price
    { wch: 20 }, // tier_3_min_quantity
    { wch: 14 }, // tier_3_price
    { wch: 20 }, // tier_4_min_quantity
    { wch: 14 }, // tier_4_price
  ];
  ws['!autofilter'] = { ref: `A1:X${sampleRows.length + 1}` };
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

  // Instructions sheet
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 32 }, { wch: 100 }];

  // Valid Values sheet
  const validValuesSheet = XLSX.utils.aoa_to_sheet(validValues);
  validValuesSheet['!cols'] = [{ wch: 22 }, { wch: 60 }, { wch: 44 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Products Template');
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');
  XLSX.utils.book_append_sheet(wb, validValuesSheet, 'Valid Values');
  XLSX.writeFile(wb, 'mau-nhap-san-pham.xlsx');
}

// ---------------------------------------------------------------------------
// Error CSV export
// ---------------------------------------------------------------------------

async function downloadErrorsCsv(errors: NonNullable<ImportResult['errors']>) {
  const XLSX = await import('xlsx');
  const rows = errors.map((e) => [e.row, e.field, e.value, e.message, e.suggestion ?? '']);
  const ws = XLSX.utils.aoa_to_sheet([['Dòng', 'Cột', 'Giá trị', 'Lỗi', 'Gợi ý'], ...rows]);
  ws['!cols'] = [8, 22, 28, 50, 50].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lỗi');
  XLSX.writeFile(wb, 'loi-nhap-san-pham.xlsx');
}

// ---------------------------------------------------------------------------
// Client-side warning detection (pre-submit, no DB call needed)
// ---------------------------------------------------------------------------

function computeClientWarnings(rows: ImportRow[]): ImportRowWarning[] {
  const warnings: ImportRowWarning[] = [];
  for (const row of rows) {
    const wp = row.wholesale_price;
    const tags = row.tags;
    if (wp !== null && wp !== undefined && wp !== '') {
      warnings.push({
        row: row.row,
        field: 'wholesale_price',
        value: String(wp).slice(0, 30),
        message: 'wholesale_price không có trong schema và sẽ bị bỏ qua.',
      });
    }
    if (tags !== null && tags !== undefined && tags !== '') {
      warnings.push({
        row: row.row,
        field: 'tags',
        value: String(tags).slice(0, 30),
        message: 'tags chưa được hỗ trợ trong schema và sẽ bị bỏ qua.',
      });
    }
  }
  return warnings;
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
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
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

        // Normalise keys and check required columns
        const firstRow = raw[0];
        const keys = Object.keys(firstRow).map((k) => k.trim().toLowerCase());
        const missing = REQUIRED_COLUMNS.filter((c) => !keys.includes(c));
        if (missing.length > 0) {
          return resolve({ rows: [], parseError: `File thiếu cột bắt buộc: ${missing.join(', ')}.` });
        }

        const rows: ImportRow[] = raw.map((r, i) => {
          const norm: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(r)) {
            norm[k.trim().toLowerCase()] = v;
          }

          function str(key: string): string | null {
            const v = norm[key];
            if (v === null || v === undefined || v === '') return null;
            return String(v).trim() || null;
          }

          function raw2(key: string): string | number | null {
            const v = norm[key];
            if (v === null || v === undefined || v === '') return null;
            if (typeof v === 'string' || typeof v === 'number') return v;
            return String(v);
          }

          return {
            row: i + 2, // +2: 1-indexed + header row
            name: String(norm.name ?? ''),
            slug: String(norm.slug ?? ''),
            parent_category_slug: str('parent_category_slug'),
            category_slug: String(norm.category_slug ?? ''),
            description: str('description'),
            // Support both new column name (base_price) and legacy column name (price)
            base_price: raw2('base_price') ?? raw2('price'),
            stock: raw2('stock'),
            is_active: (() => {
              const v = norm.is_active;
              if (v === null || v === undefined) return null;
              if (typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number') return v;
              return String(v);
            })(),
            unit: str('unit'),
            volume: str('volume'),
            height: str('height'),
            diameter: str('diameter'),
            material: str('material'),
            specs: str('specs'),
            image_1_url: str('image_1_url'),
            image_2_url: str('image_2_url'),
            image_3_url: str('image_3_url'),
            tier_1_min_quantity: raw2('tier_1_min_quantity'),
            tier_1_price: raw2('tier_1_price'),
            tier_2_min_quantity: raw2('tier_2_min_quantity'),
            tier_2_price: raw2('tier_2_price'),
            tier_3_min_quantity: raw2('tier_3_min_quantity'),
            tier_3_price: raw2('tier_3_price'),
            tier_4_min_quantity: raw2('tier_4_min_quantity'),
            tier_4_price: raw2('tier_4_price'),
            wholesale_price: raw2('wholesale_price'),
            tags: str('tags'),
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
// Image count helper
// ---------------------------------------------------------------------------

function countImages(row: ImportRow): number {
  return [row.image_1_url, row.image_2_url, row.image_3_url].filter(
    (u) => u !== null && u !== undefined && u !== '',
  ).length;
}

function countTiers(row: ImportRow): number {
  return [
    [row.tier_1_min_quantity, row.tier_1_price],
    [row.tier_2_min_quantity, row.tier_2_price],
    [row.tier_3_min_quantity, row.tier_3_price],
    [row.tier_4_min_quantity, row.tier_4_price],
  ].filter(([q, p]) => q !== null && q !== undefined && q !== '' && p !== null && p !== undefined && p !== '').length;
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function UploadStep({ onFile }: { onFile: (rows: ImportRow[], filename: string) => void }) {
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
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
          Cột trong file Excel (24 cột — xem sheet &quot;Instructions&quot; trong file mẫu)
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          {[
            { col: 'name', note: 'Bắt buộc — tên sản phẩm', required: true },
            { col: 'slug', note: 'Bắt buộc — chữ thường, gạch ngang, duy nhất', required: true },
            { col: 'category_slug', note: 'Bắt buộc — slug danh mục đang hiển thị', required: true },
            { col: 'parent_category_slug', note: 'Tùy chọn — xác nhận quan hệ cha-con' },
            { col: 'base_price', note: 'Tùy chọn — số không âm, trống = Liên hệ' },
            { col: 'stock', note: 'Tùy chọn — số nguyên, mặc định 0' },
            { col: 'is_active', note: 'true/false/1/0/yes/no/active/hidden' },
            { col: 'description', note: 'Tùy chọn — text thuần' },
            { col: 'unit / volume / height / diameter / material', note: 'Tùy chọn — lưu vào specs JSONB' },
            { col: 'image_1_url / image_2_url / image_3_url', note: 'Tùy chọn — URL https://' },
            { col: 'tier_N_min_quantity + tier_N_price', note: 'Tùy chọn — bậc giá sỉ (N=1..4)' },
          ].map(({ col, note, required }) => (
            <div key={col} className="flex items-baseline gap-1.5">
              <code className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${required ? 'bg-[#4880FF]/10 text-[#3749A6] font-bold' : 'bg-slate-100 text-slate-500'}`}>
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

// ─── Preview Step ─────────────────────────────────────────────────────────────

interface PreviewStepProps {
  filename: string;
  rows: ImportRow[];
  validationResult: ValidationResult | null;
  isValidating: boolean;
  importError?: string;
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onRetry: () => void;
}

function PreviewStep({
  filename,
  rows,
  validationResult,
  isValidating,
  importError,
  isPending,
  onBack,
  onConfirm,
  onRetry,
}: PreviewStepProps) {
  const serverErrors = validationResult?.errors ?? [];
  const serverWarnings = validationResult?.warnings ?? [];

  // While server is validating, show client-side warnings immediately for fast feedback
  const pendingWarnings = isValidating ? computeClientWarnings(rows) : [];

  const allWarnings: ImportRowWarning[] = serverWarnings.length > 0 ? serverWarnings : pendingWarnings;

  const errorsByRow = new Map<number, typeof serverErrors>();
  for (const e of serverErrors) {
    if (!errorsByRow.has(e.row)) errorsByRow.set(e.row, []);
    errorsByRow.get(e.row)!.push(e);
  }

  const warnRowSet = new Set(allWarnings.map((w) => w.row));
  const errorRowSet = new Set(serverErrors.map((e) => e.row));

  const validCount = validationResult?.validCount ?? 0;
  const warnOnlyCount = rows.filter((r) => !errorRowSet.has(r.row) && warnRowSet.has(r.row)).length;
  const errorCount = validationResult?.errorCount ?? 0;

  const hasErrors = serverErrors.length > 0;
  const fatalError = validationResult?.error ?? importError;

  // Confirm is only safe when server validation completed with no errors and no fatal error
  const canConfirm =
    !isValidating &&
    !isPending &&
    validationResult !== null &&
    validationResult.ok === true &&
    !validationResult.error &&
    validationResult.errors.length === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
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
            onClick={() => downloadErrorsCsv(serverErrors)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EF] px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-[#F7F9FB] hover:text-[#E31E24]"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất lỗi (.xlsx)
          </button>
        )}
      </div>

      {/* Row summary banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EEF2F6] bg-[#F7F9FB] px-4 py-2.5 text-xs font-semibold">
        {isValidating ? (
          <span className="flex items-center gap-1.5 text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang kiểm tra với cơ sở dữ liệu…
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {validCount} dòng hợp lệ
            </span>
            {warnOnlyCount > 0 && (
              <span className="flex items-center gap-1 text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {warnOnlyCount} dòng có cảnh báo
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-red-700">
                <X className="h-3.5 w-3.5" />
                {errorCount} dòng có lỗi
              </span>
            )}
          </>
        )}
      </div>

      {/* Fatal / global error */}
      {fatalError && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {fatalError}
          </span>
          {validationResult?.error && !importError && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isValidating}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              Thử lại
            </button>
          )}
        </div>
      )}

      {/* Validation errors */}
      {hasErrors && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <p className="text-sm font-semibold text-red-800">
            <AlertCircle className="mr-1.5 inline h-4 w-4" />
            {serverErrors.length} lỗi cần sửa trước khi nhập
          </p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            {serverErrors.map((e, i) => (
              <li key={i} className="text-xs text-red-700">
                <span className="font-semibold">Dòng {e.row}</span>
                {' · '}
                <code className="font-mono">{e.field}</code>
                {e.value ? ` (${e.value.length > 30 ? e.value.slice(0, 30) + '…' : e.value})` : ''}: {e.message}
                {e.suggestion ? <span className="text-red-500"> → {e.suggestion}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {allWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <p className="text-sm font-semibold text-amber-800">
            <AlertTriangle className="mr-1.5 inline h-4 w-4" />
            {allWarnings.length} cảnh báo — import vẫn tiến hành, các cột này sẽ bị bỏ qua
          </p>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
            {allWarnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">
                <span className="font-semibold">Dòng {w.row}</span>
                {' · '}
                <code className="font-mono">{w.field}</code>
                {w.value ? ` (${w.value})` : ''}: {w.message}
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
              <th className="px-3 py-2.5 font-semibold text-slate-500">
                <ImageIcon className="inline h-3 w-3" />
              </th>
              <th className="px-3 py-2.5 font-semibold text-slate-500">
                <Layers className="inline h-3 w-3" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row) => {
              const rowErrors = errorsByRow.get(row.row) ?? [];
              const rowHasError = rowErrors.length > 0;
              const rowHasWarn = !rowHasError && warnRowSet.has(row.row);
              const imgCount = countImages(row);
              const tierCount = countTiers(row);
              return (
                <tr
                  key={row.row}
                  className={`border-b border-[#EEF2F6] last:border-0 ${
                    rowHasError
                      ? 'bg-red-50'
                      : rowHasWarn
                        ? 'bg-amber-50'
                        : 'bg-white even:bg-[#FAFBFD]'
                  }`}
                >
                  <td className="px-3 py-2 text-slate-400">{row.row}</td>
                  <Cell value={row.name} error={rowErrors.find((e) => e.field === 'name')} />
                  <Cell value={row.slug} error={rowErrors.find((e) => e.field === 'slug')} />
                  <Cell value={row.category_slug} error={rowErrors.find((e) => e.field === 'category_slug')} />
                  <Cell
                    value={row.base_price != null ? String(row.base_price) : '—'}
                    error={rowErrors.find((e) => e.field === 'base_price')}
                  />
                  <Cell value={row.stock != null ? String(row.stock) : '0'} />
                  <td className="px-3 py-2 text-slate-600">
                    {String(row.is_active ?? 'true').toLowerCase().replace('true', '✓').replace('false', '✗')}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {imgCount > 0 ? <span className="font-semibold text-slate-600">{imgCount}</span> : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {tierCount > 0 ? <span className="font-semibold text-slate-600">{tierCount}</span> : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length > 50 && (
          <p className="bg-[#F7F9FB] px-3 py-2 text-xs text-slate-400">
            … và {rows.length - 50} dòng khác (đã ẩn khỏi preview)
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending || isValidating}
          className="text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-60"
        >
          ← Chọn file khác
        </button>
        <AdminActionButton
          onClick={onConfirm}
          disabled={!canConfirm}
          icon={
            isValidating || isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Upload className="h-4 w-4" />
          }
        >
          {isValidating
            ? 'Đang kiểm tra…'
            : isPending
              ? 'Đang nhập…'
              : fatalError
                ? 'Không thể nhập'
                : hasErrors
                  ? `Không thể nhập (${serverErrors.length} lỗi)`
                  : validationResult === null
                    ? 'Chờ kiểm tra…'
                    : `Xác nhận nhập ${rows.length} sản phẩm`}
        </AdminActionButton>
      </div>
    </div>
  );
}

function Cell({ value, error }: { value: string; error?: { message: string } }) {
  return (
    <td
      className={`max-w-[140px] truncate px-3 py-2 ${error ? 'text-red-600' : 'text-slate-700'}`}
      title={error ? error.message : value}
    >
      {value || <span className="text-slate-300">—</span>}
    </td>
  );
}

// ─── Success Step ─────────────────────────────────────────────────────────────

function SuccessStep({
  result,
  onClose,
}: {
  result: ImportResult;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <CheckCircle2 className="h-14 w-14 text-emerald-500" />
      <div>
        <p className="text-lg font-extrabold text-slate-800">Nhập thành công!</p>
        <p className="mt-1 text-sm text-slate-500">
          Đã tạo{' '}
          <span className="font-bold text-slate-700">{result.imported}</span> sản phẩm
          {result.image_count ? (
            <>
              {', '}
              <span className="font-bold text-slate-700">{result.image_count}</span> ảnh
            </>
          ) : null}
          {result.tier_count ? (
            <>
              {', '}
              <span className="font-bold text-slate-700">{result.tier_count}</span> bậc giá sỉ
            </>
          ) : null}
          .
        </p>
      </div>
      {result.warnings && result.warnings.length > 0 && (
        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-left">
          <p className="text-xs font-semibold text-amber-800">
            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
            {result.warnings.length} cảnh báo — các cột không được hỗ trợ đã bị bỏ qua:
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {result.warnings.slice(0, 5).map((w, i) => (
              <li key={i} className="text-xs text-amber-700">
                Dòng {w.row} · <code className="font-mono">{w.field}</code>: {w.message}
              </li>
            ))}
            {result.warnings.length > 5 && (
              <li className="text-xs text-amber-500">… và {result.warnings.length - 5} cảnh báo khác</li>
            )}
          </ul>
        </div>
      )}
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
  const [submitted, setSubmitted] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, startValidation] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [importState, formAction, isImporting] = useActionState(importProductsAction, INITIAL_STATE);

  const isPending = isImporting;
  const showSuccess = submitted && importState.ok && importState.imported != null;

  useEffect(() => {
    if (submitted && importState.ok) {
      router.refresh();
    }
  }, [submitted, importState.ok, router]);

  useEffect(() => {
    if (submitted && importState.error && !importState.errors) {
      toast(importState.error, 'error');
    }
  }, [submitted, importState.error, importState.errors, toast]);

  function openDialog() {
    setSubmitted(false);
    setStep('upload');
    setRows([]);
    setFilename('');
    setValidationResult(null);
    setOpen(true);
  }

  function closeDialog() {
    if (isPending || isValidating) return;
    setOpen(false);
  }

  function handleFileParsed(parsedRows: ImportRow[], name: string) {
    setRows(parsedRows);
    setFilename(name);
    setValidationResult(null);
    setStep('preview');
    startValidation(async () => {
      const result = await validateProductsImportAction(parsedRows);
      setValidationResult(result);
    });
  }

  function handleRetry() {
    setValidationResult(null);
    startValidation(async () => {
      const result = await validateProductsImportAction(rows);
      setValidationResult(result);
    });
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
      : isValidating
        ? 'Đang kiểm tra dữ liệu…'
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
          <SuccessStep result={importState} onClose={closeDialog} />
        )}

        {!showSuccess && step === 'upload' && (
          <UploadStep onFile={handleFileParsed} />
        )}

        {!showSuccess && step === 'preview' && (
          <PreviewStep
            filename={filename}
            rows={rows}
            validationResult={validationResult}
            isValidating={isValidating}
            importError={submitted && importState.error && !importState.errors ? importState.error : undefined}
            isPending={isPending}
            onBack={() => { setStep('upload'); setValidationResult(null); }}
            onConfirm={handleConfirm}
            onRetry={handleRetry}
          />
        )}
      </AdminModal>
    </>
  );
}
