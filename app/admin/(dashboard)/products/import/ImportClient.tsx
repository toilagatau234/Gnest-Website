'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { generateTemplateColumnsAction, importProductsExcelAction, type ColumnDef } from '../import-actions';

interface ImportClientProps {
  specTemplates: {
    templates: Record<string, { label: string; fields: { key: string; label: string; unit?: string; required?: boolean }[] }>;
    keys: string[];
  };
}

export function ImportClient({ specTemplates }: ImportClientProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(specTemplates.keys[0] || 'glass_container');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    ok: boolean;
    importedCount: number;
    errors: { row: number; column: string; message: string }[];
    error?: string;
  } | null>(null);
  const [importResult, setImportResult] = useState<{
    ok: boolean;
    importedCount: number;
    errors: { row: number; column: string; message: string }[];
    error?: string;
    driveResults?: { sku: string | null; imported: number; failed: number }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const columns: ColumnDef[] = await generateTemplateColumnsAction(selectedTemplate);
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // ── Sheet 1: HƯỚNG DẪN ──────────────────────────────────────────────────
      const guideRows: Record<string, string>[] = [
        { 'Cột': 'Mã sản phẩm', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Text', 'Ví dụ': 'HU-TT-100ML-P53', 'Ghi chú': 'SKU duy nhất. Để trống nếu chưa có.' },
        { 'Cột': 'Tên sản phẩm', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Text', 'Ví dụ': 'Hũ thủy tinh 100ml Phi 53', 'Ghi chú': 'Để trống để tự động tạo tên từ thông số.' },
        { 'Cột': 'Slug', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Text', 'Ví dụ': 'hu-thuy-tinh-100ml', 'Ghi chú': 'Để trống để tự động tạo từ SKU.' },
        { 'Cột': 'Loại sản phẩm *', 'Bắt buộc': 'Có', 'Kiểu dữ liệu': 'Text (mã)', 'Ví dụ': selectedTemplate, 'Ghi chú': `Mã loại sản phẩm. Xem danh sách: ${specTemplates.keys.join(', ')}` },
        { 'Cột': 'Danh mục', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Text (slug)', 'Ví dụ': 'hu-thuy-tinh', 'Ghi chú': 'Slug danh mục trong hệ thống.' },
        { 'Cột': 'Mô tả ngắn', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Text', 'Ví dụ': 'Hũ thủy tinh cao cấp cho yến sào.', 'Ghi chú': '' },
        { 'Cột': 'Trạng thái', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'true/false', 'Ví dụ': 'true', 'Ghi chú': 'Mặc định: true (hiển thị).' },
        { 'Cột': 'Nổi bật', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'true/false', 'Ví dụ': 'false', 'Ghi chú': 'Mặc định: false.' },
        { 'Cột': 'Giá bán (VNĐ)', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Số', 'Ví dụ': '25000', 'Ghi chú': 'Để trống nếu hiển thị "Liên hệ".' },
        { 'Cột': 'Tồn kho', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Số nguyên', 'Ví dụ': '1000', 'Ghi chú': 'Mặc định: 0.' },
        { 'Cột': 'Tiêu đề SEO', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Text', 'Ví dụ': 'Hũ thủy tinh 100ml | Gnest', 'Ghi chú': 'Tối đa 70 ký tự.' },
        { 'Cột': 'Mô tả SEO', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Text', 'Ví dụ': 'Hũ thủy tinh cao cấp phi 53 cho đóng gói yến sào.', 'Ghi chú': 'Tối đa 160 ký tự.' },
        { 'Cột': 'Từ khóa SEO', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Text', 'Ví dụ': 'hũ thủy tinh, bao bì yến sào', 'Ghi chú': 'Phân cách bằng dấu phẩy.' },
        { 'Cột': 'Link ảnh GG Drive', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'URL', 'Ví dụ': 'https://drive.google.com/drive/folders/...', 'Ghi chú': 'Thư mục GG Drive phải chia sẻ công khai.' },
        { 'Cột': 'Tên ảnh chính', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Text', 'Ví dụ': 'main.jpg', 'Ghi chú': 'Tên file ảnh chính trong thư mục Drive.' },
        { 'Cột': 'Giá sỉ bậc 1', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Số', 'Ví dụ': '20000', 'Ghi chú': '' },
        { 'Cột': 'SL tối thiểu bậc 1', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Số nguyên', 'Ví dụ': '100', 'Ghi chú': '' },
        { 'Cột': 'Giá sỉ bậc 2', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Số', 'Ví dụ': '18000', 'Ghi chú': '' },
        { 'Cột': 'SL tối thiểu bậc 2', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Số nguyên', 'Ví dụ': '500', 'Ghi chú': '' },
        { 'Cột': 'Giá sỉ bậc 3', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Số', 'Ví dụ': '15000', 'Ghi chú': '' },
        { 'Cột': 'SL tối thiểu bậc 3', 'Bắt buộc': 'Không', 'Kiểu dữ liệu': 'Số nguyên', 'Ví dụ': '1000', 'Ghi chú': '' },
      ];

      // Add spec column descriptions
      const specCols = columns.filter((c) => c.fieldKey);
      for (const col of specCols) {
        guideRows.push({
          'Cột': col.header,
          'Bắt buộc': col.required ? 'Có *' : 'Không',
          'Kiểu dữ liệu': col.type ?? 'Text',
          'Ví dụ': col.unit ? `Ví dụ: 100${col.unit}` : '',
          'Ghi chú': col.unit ? `Hệ thống tự chuẩn hóa đơn vị (vd: "100${col.unit}" → ${col.fieldKey}=100)` : '',
        });
      }

      const wsGuide = XLSX.utils.json_to_sheet(guideRows);
      wsGuide['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 40 }, { wch: 55 }];
      XLSX.utils.book_append_sheet(wb, wsGuide, 'HƯỚNG DẪN');

      // ── Sheet 2: DANH SÁCH SẢN PHẨM ─────────────────────────────────────────
      const headers = columns.map((c) => c.header);
      const sampleRow: Record<string, string | number> = {};
      for (const col of columns) {
        if (col.key === 'template_code') sampleRow[col.header] = selectedTemplate;
        else if (col.key === 'is_active') sampleRow[col.header] = 'true';
        else if (col.key === 'is_featured') sampleRow[col.header] = 'false';
        else if (col.key === 'stock') sampleRow[col.header] = 0;
        else sampleRow[col.header] = '';
      }

      const wsData = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
      wsData['!cols'] = headers.map(() => ({ wch: 24 }));
      XLSX.utils.book_append_sheet(wb, wsData, 'DANH SÁCH SẢN PHẨM');

      XLSX.writeFile(wb, `mau-nhap-san-pham-${selectedTemplate}.xlsx`);
    } catch (err) {
      console.error('Failed to generate template:', err);
      alert('Không thể tạo file mẫu. Vui lòng thử lại.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    await processFile(selectedFile);
  };

  const processFile = async (selectedFile: File) => {
    setIsValidating(true);
    setValidationResult(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(data, { type: 'binary' });

        // Support both 2-sheet (new) and 1-sheet (legacy) formats
        // New: Sheet index 1 = "DANH SÁCH SẢN PHẨM"; Old: Sheet index 0
        const dataSheetName =
          workbook.SheetNames.find((n) => n.includes('SẢN PHẨM') || n.includes('SAN PHAM')) ??
          workbook.SheetNames[0];

        const worksheet = workbook.Sheets[dataSheetName];
        const parsed = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as Record<string, unknown>[];

        if (parsed.length === 0) {
          setValidationResult({
            ok: false,
            importedCount: 0,
            errors: [],
            error: 'File không có dữ liệu hàng hóa để nhập.',
          });
          setIsValidating(false);
          return;
        }

        setRows(parsed);

        // Run validation (dryRun = true)
        const result = await importProductsExcelAction(parsed, selectedTemplate, true);
        setValidationResult(result);
      } catch (err) {
        console.error('Error parsing excel:', err);
        setValidationResult({
          ok: false,
          importedCount: 0,
          errors: [],
          error: 'Định dạng file không được hỗ trợ hoặc file bị lỗi.',
        });
      } finally {
        setIsValidating(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleCommitImport = async () => {
    if (rows.length === 0) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importProductsExcelAction(rows, selectedTemplate, false);
      setImportResult(result);
    } catch (err) {
      console.error('Import failed:', err);
      setImportResult({
        ok: false,
        importedCount: 0,
        errors: [],
        error: 'Đã xảy ra lỗi hệ thống khi nhập sản phẩm.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRows([]);
    setValidationResult(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalErrors = validationResult?.errors.length ?? 0;
  const totalRows = rows.length;
  const validRowsCount = totalRows - totalErrors;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#4880FF] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách sản phẩm
        </Link>
      </div>

      {!file ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel: template selector + download */}
          <div className="md:col-span-1 bg-white border border-[#EEF2F6] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Tải file mẫu Excel
            </h3>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Chọn loại sản phẩm
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full rounded-lg border border-[#D1D8E8] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4880FF] bg-white"
              >
                {specTemplates.keys.map((key) => (
                  <option key={key} value={key}>
                    {specTemplates.templates[key]?.label || key}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-[#4880FF] hover:bg-[#4880FF]/5 text-sm font-bold text-[#4880FF] px-4 py-2.5 transition"
            >
              <Download className="h-4 w-4" />
              Tải file mẫu Excel
            </button>

            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 space-y-1">
              <p className="font-bold">File mẫu gồm 2 trang tính:</p>
              <p><strong>HƯỚNG DẪN</strong> — mô tả từng cột, kiểu dữ liệu, ví dụ</p>
              <p><strong>DANH SÁCH SẢN PHẨM</strong> — nhập dữ liệu vào trang này</p>
            </div>
          </div>

          {/* Right panel: file drop zone */}
          <div className="md:col-span-2 bg-white border border-[#EEF2F6] rounded-xl p-6 shadow-sm flex flex-col justify-center min-h-[240px] space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D1D8E8] hover:border-[#4880FF] bg-[#F7F9FB] hover:bg-[#F0F4FF] rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
            >
              <FileSpreadsheet className="h-12 w-12 text-[#4880FF]/60" />
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Kéo thả file Excel của bạn vào đây, hoặc <span className="text-[#4880FF]">chọn file</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">Hỗ trợ file .xlsx và .xls (tối đa 500 sản phẩm)</p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-[11px] text-blue-700">
              <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Điền URL thư mục Google Drive vào cột <strong>Link ảnh GG Drive</strong> để tự động nhập ảnh (thư mục phải chia sẻ công khai).</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#EEF2F6] rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-700">
                Xem trước &amp; Kiểm tra dữ liệu
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                File: {file.name} · Loại sản phẩm: {specTemplates.templates[selectedTemplate]?.label ?? selectedTemplate}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 border border-[#D1D8E8] rounded-lg px-3 py-1.5 transition"
            >
              Chọn file khác
            </button>
          </div>

          {isValidating ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#4880FF]" />
              <p className="text-sm font-semibold text-slate-500">Đang phân tích và kiểm tra dữ liệu...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Validation Summary */}
              {validationResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                    <div>
                      <div className="text-sm font-bold text-slate-600">Tổng số dòng</div>
                      <div className="text-xl font-black text-slate-800">{totalRows}</div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                    <div>
                      <div className="text-sm font-bold text-emerald-600">Hợp lệ để nhập</div>
                      <div className="text-xl font-black text-emerald-800">{validRowsCount}</div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <XCircle className="h-8 w-8 text-red-500" />
                    <div>
                      <div className="text-sm font-bold text-red-600">Lỗi thông tin</div>
                      <div className="text-xl font-black text-red-800">{totalErrors}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Global error */}
              {validationResult?.error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>{validationResult.error}</div>
                </div>
              )}

              {/* Error detail */}
              {totalErrors > 0 && (
                <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Danh sách lỗi cần sửa ({totalErrors})
                  </h4>
                  <div className="max-h-60 overflow-y-auto text-xs text-red-700 divide-y divide-red-200/50">
                    {validationResult?.errors.map((err, idx) => (
                      <div key={idx} className="py-2 flex justify-between gap-4">
                        <span>
                          <strong>Dòng {err.row}</strong> · Cột <code>{err.column}</code>: {err.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drive import results (after commit) */}
              {importResult?.driveResults && importResult.driveResults.length > 0 && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-blue-800 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4" />
                    Kết quả nhập ảnh Google Drive ({importResult.driveResults.length} sản phẩm)
                  </h4>
                  <div className="max-h-40 overflow-y-auto text-xs text-blue-700 divide-y divide-blue-200/50">
                    {importResult.driveResults.map((dr, idx) => (
                      <div key={idx} className="py-1.5 flex gap-4">
                        <span className="font-mono text-blue-600">{dr.sku ?? '—'}</span>
                        <span className="text-emerald-700">{dr.imported} ảnh nhập</span>
                        {dr.failed > 0 ? <span className="text-red-600">{dr.failed} lỗi</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEF2F6]">
                {importResult ? (
                  <div className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Nhập hoàn tất! Đã thêm thành công <strong>{importResult.importedCount}</strong> sản phẩm.
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 transition"
                    >
                      Tiếp tục nhập file mới
                    </button>
                  </div>
                ) : (
                  <>
                    {totalErrors > 0 && (
                      <p className="text-xs text-slate-500 italic mr-auto">
                        * Bạn vẫn có thể nhập các dòng hợp lệ ({validRowsCount} dòng). Dòng lỗi sẽ tự động bỏ qua.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isImporting}
                      className="bg-white border border-[#D1D8E8] text-slate-600 font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitImport}
                      disabled={isImporting || validRowsCount === 0}
                      className="inline-flex items-center gap-1.5 bg-[#4880FF] text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#3769D6] transition disabled:opacity-50"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang lưu vào cơ sở dữ liệu...
                        </>
                      ) : (
                        `Xác nhận Nhập (${validRowsCount} sản phẩm)`
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
