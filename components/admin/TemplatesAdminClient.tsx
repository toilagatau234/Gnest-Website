'use client';

import { useActionState, useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Settings,
  Trash2,
  CheckCircle2,
  XCircle,
  Sliders,
} from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { AdminToggle } from '@/components/admin/AdminToggle';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminUser } from '@/lib/types/admin';

import {
  createTemplateAction,
  updateTemplateAction,
  toggleTemplateActiveAction,
  createFieldAction,
  updateFieldAction,
  toggleFieldActiveAction,
  deleteFieldAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/product-spec-templates/actions';

interface TemplatesAdminClientProps {
  initialTemplates: any[];
  initialFields: any[];
  adminUser: AdminUser;
}

const fieldClass = 'admin-input text-xs';
const labelClass = 'mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]';
const selectFieldClass = 'admin-select text-xs';

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Chữ ngắn (text)',
  number: 'Số (number)',
  select: 'Chọn một (select)',
  multi_select: 'Chọn nhiều (multi_select)',
  boolean: 'Đúng/Sai (boolean)',
  textarea: 'Văn bản dài (textarea)',
};

export function TemplatesAdminClient({
  initialTemplates,
  initialFields,
  adminUser,
}: TemplatesAdminClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const canMutate = adminUser.role === 'super_admin' || adminUser.role === 'admin';

  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    initialTemplates.length > 0 ? initialTemplates[0].id : null
  );

  // Modals
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);

  const [confirmDeleteFieldId, setConfirmDeleteFieldId] = useState<string | null>(null);

  // Transitions
  const [isToggling, startToggle] = useTransition();

  // Selected template & fields
  const selectedTemplate = initialTemplates.find((t) => t.id === selectedTemplateId) || null;
  const selectedFields = selectedTemplate
    ? initialFields.filter((f) => f.template_id === selectedTemplate.id)
    : [];

  // Overall stats
  const totalTemplates = initialTemplates.length;
  const activeTemplates = initialTemplates.filter((t) => t.is_active).length;
  const totalFields = selectedFields.length;
  const filterableFields = selectedFields.filter((f) => f.is_filterable).length;

  // Active toggle handlers
  const handleTemplateToggle = (id: string, currentActive: boolean) => {
    if (!canMutate) return;
    startToggle(async () => {
      const formData = new FormData();
      formData.set('id', id);
      formData.set('next_is_active', String(!currentActive));

      try {
        await toggleTemplateActiveAction(formData);
        toast(currentActive ? 'Đã ẩn mẫu thông số.' : 'Đã hiển thị mẫu thông số.', 'success');
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Không thể đổi trạng thái.', 'error');
      }
    });
  };

  const handleFieldToggle = (id: string, currentActive: boolean) => {
    if (!canMutate) return;
    startToggle(async () => {
      const formData = new FormData();
      formData.set('id', id);
      formData.set('next_is_active', String(!currentActive));

      try {
        await toggleFieldActiveAction(formData);
        toast(currentActive ? 'Đã ẩn thuộc tính.' : 'Đã hiển thị thuộc tính.', 'success');
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Không thể đổi trạng thái.', 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Stats Card Row ─────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng số mẫu"
          value={totalTemplates}
          icon={<Layers className="h-4 w-4" />}
          hint="Các mẫu cấu hình trong DB"
        />
        <AdminStatCard
          label="Mẫu đang kích hoạt"
          value={activeTemplates}
          icon={<Eye className="h-4 w-4" />}
          hint="Hiển thị khi tạo/sửa sản phẩm"
        />
        <AdminStatCard
          label="Thuộc tính mẫu hiện tại"
          value={totalFields}
          icon={<Sliders className="h-4 w-4" />}
          hint={selectedTemplate ? `Mẫu: ${selectedTemplate.name}` : 'Chưa chọn mẫu'}
        />
        <AdminStatCard
          label="Thuộc tính lọc tìm kiếm"
          value={filterableFields}
          icon={<Filter className="h-4 w-4" />}
          hint="Cho phép lọc trong catalog"
        />
      </div>

      {/* ── Split Master-Detail Layout ──────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[5fr_7fr]">
        
        {/* ── Left panel: Templates list (Master) ─────────────────────────── */}
        <div className="flex flex-col rounded-2xl border border-[#E5E7EF] bg-white shadow-admin overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EEF2F6] bg-slate-50/50 px-5 py-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#202224]">Danh sách mẫu thông số</h3>
              <p className="text-[11px] font-medium text-[#646464]">Chọn mẫu để cấu hình các trường</p>
            </div>
            {canMutate && (
              <AdminActionButton
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateModalOpen(true);
                }}
              >
                Tạo mẫu
              </AdminActionButton>
            )}
          </div>

          <div className="divide-y divide-[#EEF2F6] overflow-y-auto max-h-[600px] min-h-[300px]">
            {initialTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Layers className="h-8 w-8 stroke-[1.5] text-slate-300" />
                <p className="mt-2 text-xs font-semibold">Chưa có mẫu thông số nào</p>
                <p className="text-[10px] mt-0.5">Nhấp nút Tạo mẫu để khởi tạo cấu trúc đầu tiên.</p>
              </div>
            ) : (
              initialTemplates.map((template) => {
                const isSelected = template.id === selectedTemplateId;
                const fieldCount = initialFields.filter((f) => f.template_id === template.id).length;

                return (
                  <div
                    key={template.id}
                    className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                      isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/40'
                    }`}
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          [{template.code}]
                        </span>
                        <h4 className="text-xs font-extrabold text-[#202224]">{template.name}</h4>
                        <AdminStatusChip tone={template.is_active ? 'success' : 'neutral'} className="text-[9px] px-1.5 py-0">
                          {template.is_active ? 'Hoạt động' : 'Tạm ẩn'}
                        </AdminStatusChip>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] font-medium text-slate-400 leading-relaxed">
                        {template.description || 'Không có mô tả.'}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded w-fit">
                        <span>{fieldCount} thuộc tính</span>
                        <span>·</span>
                        <span>Ưu tiên: {template.sort_order}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {canMutate && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplate(template);
                              setTemplateModalOpen(true);
                            }}
                            title="Chỉnh sửa thông tin mẫu"
                            className="admin-focus p-1.5 rounded-lg border border-[#E5E7EF] bg-white text-slate-500 hover:border-[#4880FF] hover:bg-[#4880FF]/5 hover:text-[#3749A6] transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTemplateToggle(template.id, template.is_active)}
                            disabled={isToggling}
                            title={template.is_active ? 'Tạm ẩn mẫu' : 'Kích hoạt mẫu'}
                            className={`admin-focus p-1.5 rounded-lg border transition-colors ${
                              template.is_active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50'
                                : 'border-[#E5E7EF] bg-white text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {template.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel: Fields list for Selected Template (Detail) ───────── */}
        <div className="flex flex-col rounded-2xl border border-[#E5E7EF] bg-white shadow-admin overflow-hidden">
          {selectedTemplate ? (
            <>
              <div className="flex items-center justify-between border-b border-[#EEF2F6] bg-slate-50/50 px-5 py-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#202224]">
                    Thuộc tính của: <span className="text-[#3749A6]">{selectedTemplate.name}</span>
                  </h3>
                  <p className="text-[11px] font-medium text-[#646464]">
                    Mã liên kết: <code className="font-mono text-[#3749A6]">{selectedTemplate.code}</code>
                  </p>
                </div>
                {canMutate && (
                  <AdminActionButton
                    size="sm"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setEditingField(null);
                      setFieldModalOpen(true);
                    }}
                  >
                    Thêm thuộc tính
                  </AdminActionButton>
                )}
              </div>

              <div className="overflow-x-auto min-h-[300px]">
                {selectedFields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400 h-full">
                    <Sliders className="h-8 w-8 stroke-[1.5] text-slate-300 animate-pulse" />
                    <p className="mt-2 text-xs font-semibold">Chưa có thuộc tính nào</p>
                    <p className="text-[10px] mt-0.5">Mẫu này chưa có các trường dữ liệu tương ứng.</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#EEF2F6] bg-slate-50/30 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3.5">Thuộc tính / Mã</th>
                        <th className="px-4 py-3.5">Kiểu dữ liệu</th>
                        <th className="px-4 py-3.5 text-center">Bắt buộc / Lọc</th>
                        <th className="px-4 py-3.5">Trạng thái</th>
                        <th className="px-5 py-3.5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF2F6]">
                      {selectedFields.map((field) => (
                        <tr key={field.id} className="hover:bg-slate-50/30">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-[#202224]">{field.label}</div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">{field.key}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-[#202224]">
                              {FIELD_TYPE_LABELS[field.type] || field.type}
                            </span>
                            {field.unit && (
                              <span className="ml-1 text-[10px] text-slate-400">({field.unit})</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                title="Yêu cầu nhập"
                                className={`inline-flex h-5 items-center justify-center rounded-md px-1.5 text-[9px] font-bold ${
                                  field.is_required
                                    ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                YC
                              </span>
                              <span
                                title="Cho phép lọc"
                                className={`inline-flex h-5 items-center justify-center rounded-md px-1.5 text-[9px] font-bold ${
                                  field.is_filterable
                                    ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                Lọc
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <AdminStatusChip tone={field.is_active ? 'success' : 'neutral'} className="text-[9px]">
                              {field.is_active ? 'Hoạt động' : 'Tạm ẩn'}
                            </AdminStatusChip>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canMutate && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingField(field);
                                      setFieldModalOpen(true);
                                    }}
                                    title="Chỉnh sửa thuộc tính"
                                    className="admin-focus p-1.5 rounded-lg border border-[#E5E7EF] bg-white text-slate-500 hover:border-[#4880FF] hover:bg-[#4880FF]/5 hover:text-[#3749A6] transition-colors"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFieldToggle(field.id, field.is_active)}
                                    disabled={isToggling}
                                    title={field.is_active ? 'Tạm ẩn' : 'Hiển thị'}
                                    className={`admin-focus p-1.5 rounded-lg border transition-colors ${
                                      field.is_active
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50'
                                        : 'border-[#E5E7EF] bg-white text-slate-400 hover:border-slate-300'
                                    }`}
                                  >
                                    {field.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteFieldId(field.id)}
                                    title="Xóa thuộc tính"
                                    className="admin-focus p-1.5 rounded-lg border border-[#E5E7EF] bg-white text-slate-500 hover:border-[#E31E24] hover:bg-[#E31E24]/5 hover:text-[#E31E24] transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400 min-h-[300px] h-full">
              <Layers className="h-8 w-8 stroke-[1.5] text-slate-300" />
              <p className="mt-2 text-xs font-semibold">Chưa chọn mẫu thông số</p>
              <p className="text-[10px] mt-0.5">Vui lòng nhấp chọn một mẫu thông số từ danh sách bên trái.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Template Modal ─────────────────────────────────────────────────── */}
      {templateModalOpen && (
        <TemplateModalSession
          template={editingTemplate}
          onClose={() => {
            setTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          toast={toast}
          router={router}
        />
      )}

      {/* ── Field Modal ────────────────────────────────────────────────────── */}
      {fieldModalOpen && selectedTemplate && (
        <FieldModalSession
          templateId={selectedTemplate.id}
          field={editingField}
          onClose={() => {
            setFieldModalOpen(false);
            setEditingField(null);
          }}
          toast={toast}
          router={router}
        />
      )}

      {/* ── Field Delete Confirm Dialog ────────────────────────────────────── */}
      {confirmDeleteFieldId && (
        <FieldDeleteConfirmSession
          fieldId={confirmDeleteFieldId}
          field={initialFields.find((f) => f.id === confirmDeleteFieldId)}
          onClose={() => setConfirmDeleteFieldId(null)}
          toast={toast}
          router={router}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Components for Modals (reset state cleanly)
// ─────────────────────────────────────────────────────────────────────────────

interface TemplateModalSessionProps {
  template: any | null;
  onClose: () => void;
  toast: any;
  router: any;
}

const INITIAL_FORM_STATE: AdminFormState = { ok: false };

function TemplateModalSession({ template, onClose, toast, router }: TemplateModalSessionProps) {
  const formId = useId();
  const isEdit = Boolean(template);
  const action = template ? updateTemplateAction : createTemplateAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_FORM_STATE);
  const handledOk = useRef(false);

  const [code, setCode] = useState(template?.code ?? '');
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [sortOrder, setSortOrder] = useState(template?.sort_order ?? 0);

  useEffect(() => {
    if (!state.ok || handledOk.current) return;
    handledOk.current = true;
    toast(isEdit ? 'Đã cập nhật mẫu thông số.' : 'Đã thêm mẫu thông số mới.', 'success');
    onClose();
    router.refresh();
  }, [state.ok, isEdit, onClose, router, toast]);

  return (
    <AdminModal
      open
      onClose={onClose}
      title={isEdit ? 'Cập nhật mẫu thông số' : 'Thêm mẫu thông số mới'}
      description="Cấu trúc nhóm thuộc tính dùng chung cho sản phẩm."
      size="md"
      dismissible={!isPending}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="admin-button-secondary px-5 text-xs"
          >
            Hủy
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isPending}
            className="admin-button-primary px-6 text-xs"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo mẫu'}
          </button>
        </>
      }
    >
      <form id={formId} action={formAction} className="space-y-4">
        {isEdit && <input type="hidden" name="id" value={template.id} />}

        {state.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
            <p className="text-xs font-medium text-[#B42318]">{state.error}</p>
          </div>
        )}

        <label className="block">
          <span className={labelClass}>
            Mã định danh mẫu <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            readOnly={isEdit}
            className={`${fieldClass} ${isEdit ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
            placeholder="VD: plastic"
          />
          {!isEdit && (
            <span className="mt-1 block text-[10px] text-slate-400">
              Mã dùng để lọc và truy xuất, viết thường không dấu, không khoảng trắng, chỉ dùng chữ, số và dấu gạch dưới (VD: plastic). Không thể sửa đổi sau khi tạo.
            </span>
          )}
        </label>

        <label className="block">
          <span className={labelClass}>
            Tên hiển thị <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            placeholder="VD: Bao bì nhựa"
          />
        </label>

        <label className="block">
          <span className={labelClass}>Mô tả mẫu</span>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="admin-input text-xs resize-y min-h-[72px]"
            placeholder="Mô tả công dụng hoặc phạm vi áp dụng..."
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Thứ tự ưu tiên hiển thị</span>
            <input
              name="sort_order"
              type="number"
              min="0"
              required
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="admin-soft-panel px-4 py-3">
          <AdminToggle
            name="is_active"
            defaultChecked={template ? template.is_active : true}
            label="Kích hoạt mẫu"
            description="Tắt để ẩn mẫu này khỏi bộ soạn thảo của sản phẩm."
          />
        </div>
      </form>
    </AdminModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface FieldModalSessionProps {
  templateId: string;
  field: any | null;
  onClose: () => void;
  toast: any;
  router: any;
}

function FieldModalSession({ templateId, field, onClose, toast, router }: FieldModalSessionProps) {
  const formId = useId();
  const isEdit = Boolean(field);
  const action = field ? updateFieldAction : createFieldAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_FORM_STATE);
  const handledOk = useRef(false);

  const [key, setKey] = useState(field?.key ?? '');
  const [label, setLabel] = useState(field?.label ?? '');
  const [type, setType] = useState(field?.type ?? 'text');
  const [unit, setUnit] = useState(field?.unit ?? '');
  const [sortOrder, setSortOrder] = useState(field?.sort_order ?? 0);
  const [optionsText, setOptionsText] = useState(() => {
    if (field?.options && Array.isArray(field.options)) {
      return field.options.join('\n');
    }
    return '';
  });

  useEffect(() => {
    if (!state.ok || handledOk.current) return;
    handledOk.current = true;
    toast(isEdit ? 'Đã cập nhật thuộc tính.' : 'Đã thêm thuộc tính mới.', 'success');
    onClose();
    router.refresh();
  }, [state.ok, isEdit, onClose, router, toast]);

  return (
    <AdminModal
      open
      onClose={onClose}
      title={isEdit ? 'Cập nhật thuộc tính' : 'Thêm thuộc tính mới'}
      description="Trường dữ liệu cấu thành mẫu thông số sản phẩm."
      size="lg"
      dismissible={!isPending}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="admin-button-secondary px-5 text-xs"
          >
            Hủy
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isPending}
            className="admin-button-primary px-6 text-xs"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm thuộc tính'}
          </button>
        </>
      }
    >
      <form id={formId} action={formAction} className="space-y-4">
        <input type="hidden" name="template_id" value={templateId} />
        {isEdit && <input type="hidden" name="id" value={field.id} />}

        {state.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
            <p className="text-xs font-medium text-[#B42318]">{state.error}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>
              Mã thuộc tính <span className="text-[#E31E24]">*</span>
            </span>
            <input
              name="key"
              type="text"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              readOnly={isEdit}
              className={`${fieldClass} ${isEdit ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
              placeholder="VD: neck_size"
            />
            {!isEdit && (
              <span className="mt-1 block text-[10px] text-slate-400 font-medium">
                Dùng lưu trữ, viết thường không dấu, không khoảng trắng, chỉ dùng chữ, số và dấu gạch dưới (VD: material). Không thể sửa đổi sau khi tạo.
              </span>
            )}
          </label>

          <label className="block">
            <span className={labelClass}>
              Tên nhãn hiển thị <span className="text-[#E31E24]">*</span>
            </span>
            <input
              name="label"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={fieldClass}
              placeholder="VD: Phi cổ khớp"
            />
          </label>

          <label className="block">
            <span className={labelClass}>Kiểu dữ liệu <span className="text-[#E31E24]">*</span></span>
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={selectFieldClass}
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Đơn vị đo (nếu có)</span>
            <input
              name="unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={fieldClass}
              placeholder="VD: mm, ml, g..."
            />
          </label>

          {(type === 'select' || type === 'multi_select') && (
            <label className="block sm:col-span-2">
              <span className={labelClass}>
                Danh sách các giá trị lựa chọn (Mỗi dòng là một lựa chọn) <span className="text-[#E31E24]">*</span>
              </span>
              <textarea
                name="options_text"
                required
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                rows={4}
                className="admin-input text-xs resize-y min-h-[96px] font-medium"
                placeholder="Nhôm&#10;Thủy tinh&#10;Nhựa PP"
              />
            </label>
          )}

          <label className="block">
            <span className={labelClass}>Thứ tự ưu tiên hiển thị</span>
            <input
              name="sort_order"
              type="number"
              min="0"
              required
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[#EEF2F6]">
          <div className="admin-soft-panel px-3 py-2 flex items-center justify-between">
            <AdminToggle
              name="is_required"
              defaultChecked={field ? field.is_required : false}
              label="Bắt buộc nhập"
            />
          </div>

          <div className="admin-soft-panel px-3 py-2 flex items-center justify-between">
            <AdminToggle
              name="is_filterable"
              defaultChecked={field ? field.is_filterable : false}
              label="Cho phép bộ lọc"
            />
          </div>
        </div>

        <div className="admin-soft-panel px-4 py-3">
          <AdminToggle
            name="is_active"
            defaultChecked={field ? field.is_active : true}
            label="Kích hoạt thuộc tính"
            description="Tắt để ẩn thuộc tính này khỏi bộ soạn thảo của sản phẩm."
          />
        </div>
      </form>
    </AdminModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface FieldDeleteConfirmProps {
  fieldId: string;
  field: any | null;
  onClose: () => void;
  toast: any;
  router: any;
}

function FieldDeleteConfirmSession({ fieldId, field, onClose, toast, router }: FieldDeleteConfirmProps) {
  const handleConfirm = async () => {
    try {
      const res = await deleteFieldAction(fieldId);
      if (!res.ok) {
        return { ok: false, error: res.error || 'Xóa thuộc tính thất bại.' };
      }

      if (res.softDisabled) {
        toast(
          'Thuộc tính đang được sử dụng bởi sản phẩm. Hệ thống đã tự động chuyển trạng thái của nó sang Tạm ẩn (soft-disable) để bảo vệ tính nhất quán dữ liệu.',
          'info'
        );
      } else if (res.deleted) {
        toast('Đã xóa vĩnh viễn thuộc tính.', 'success');
      }

      router.refresh();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Không thể xóa thuộc tính.',
      };
    }
  };

  return (
    <AdminConfirmDialog
      open
      onClose={onClose}
      title="Xóa thuộc tính sản phẩm"
      description="Hành động này sẽ xóa vĩnh viễn hoặc tạm ẩn thuộc tính này khỏi mẫu. Nếu đang có sản phẩm sử dụng thuộc tính này, hệ thống sẽ tự động đổi sang trạng thái 'Tạm ẩn' (soft-disable) để tránh làm mất thông số của các sản phẩm hiện có."
      itemName={field ? `${field.label} (${field.key})` : 'Thuộc tính này'}
      confirmLabel="Xác nhận xóa"
      onConfirm={handleConfirm}
      onSuccess={() => {}}
    />
  );
}
