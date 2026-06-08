'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowUpDown, CheckCircle2, CircleSlash, GripVertical, Loader2 } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { useToast } from '@/components/admin/AdminToast';

export interface AdminSortableListItem {
  id: string;
  label: string;
  subtitle?: string;
  meta?: string;
  is_active?: boolean;
}

export interface AdminSortableListScope {
  id: string;
  label: string;
  description?: string;
  items: AdminSortableListItem[];
}

interface AdminSortableListDialogProps {
  buttonLabel: string;
  title: string;
  description: string;
  saveLabel?: string;
  successMessage: string;
  errorMessage: string;
  scopes: AdminSortableListScope[];
  onSave: (
    scopeId: string,
    moves: Array<{ itemId: string; beforeId: string | null; afterId: string | null }>
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function getEffectiveMoves(
  originalIds: string[],
  finalIds: string[]
): Array<{ itemId: string; beforeId: string | null; afterId: string | null }> {
  if (originalIds.length !== finalIds.length) {
    return [];
  }
  const isSame = originalIds.every((id, idx) => id === finalIds[idx]);
  if (isSame) {
    return [];
  }

  const m = originalIds.length;
  const n = finalIds.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (originalIds[i - 1] === finalIds[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcsSet = new Set<string>();
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (originalIds[i - 1] === finalIds[j - 1]) {
      lcsSet.add(originalIds[i - 1]);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  const moves: Array<{ itemId: string; beforeId: string | null; afterId: string | null }> = [];

  for (let idx = 0; idx < finalIds.length; idx += 1) {
    const id = finalIds[idx];
    if (!lcsSet.has(id)) {
      const beforeId = idx > 0 ? finalIds[idx - 1] : null;
      const afterId = idx < finalIds.length - 1 ? finalIds[idx + 1] : null;
      moves.push({ itemId: id, beforeId, afterId });
    }
  }

  return moves;
}

function SortableRow({ item }: { item: AdminSortableListItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-[transform,box-shadow,border-color] ${
        isDragging ? 'border-[#4880FF] shadow-lg ring-2 ring-[#4880FF]/15' : 'border-[#E5E7EF]'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={`Kéo để đổi thứ tự ${item.label}`}
          className="admin-focus mt-0.5 inline-flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-xl border border-[#E5E7EF] bg-[#F7F9FB] text-slate-500 transition hover:border-[#4880FF] hover:bg-[#4880FF]/5 hover:text-[#3749A6] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-extrabold text-[#202224]">{item.label}</h3>
            <span
              className={`admin-badge ${
                item.is_active === false ? 'admin-status-muted' : 'admin-status-active'
              }`}
            >
              {item.is_active === false ? (
                <>
                  <CircleSlash className="h-3 w-3" />
                  Đang ẩn
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Đang hiển thị
                </>
              )}
            </span>
          </div>

          {item.subtitle ? (
            <p className="mt-1 truncate text-[11px] font-mono text-slate-400">{item.subtitle}</p>
          ) : null}

          {item.meta ? (
            <p className="mt-2 text-xs font-medium leading-relaxed text-[#646464]">{item.meta}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function AdminSortableListDialog({
  buttonLabel,
  title,
  description,
  saveLabel = 'Lưu thứ tự',
  successMessage,
  errorMessage,
  scopes,
  onSave,
}: AdminSortableListDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedScopeId, setSelectedScopeId] = useState(scopes[0]?.id ?? '');
  const [draftItems, setDraftItems] = useState<AdminSortableListItem[]>([]);

  const scopeMap = useMemo(() => new Map(scopes.map((scope) => [scope.id, scope])), [scopes]);
  const currentScopeId = scopeMap.has(selectedScopeId) ? selectedScopeId : (scopes[0]?.id ?? '');
  const selectedScope = scopeMap.get(currentScopeId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const hasChanges = useMemo(() => {
    if (!selectedScope || selectedScope.items.length !== draftItems.length) {
      return false;
    }

    return draftItems.some((item, index) => item.id !== selectedScope.items[index]?.id);
  }, [draftItems, selectedScope]);

  const handleOpen = () => {
    if (!scopes[0]) {
      return;
    }

    setSelectedScopeId(scopes[0].id);
    setDraftItems(scopes[0].items);
    setOpen(true);
  };

  const handleClose = () => {
    if (!isPending) {
      setOpen(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    setDraftItems((current) => {
      const oldIndex = current.findIndex((item) => item.id === activeId);
      const newIndex = current.findIndex((item) => item.id === overId);

      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }

      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const handleSave = () => {
    if (!selectedScope) {
      return;
    }

    const originalIds = selectedScope.items.map((item) => item.id);
    const finalIds = draftItems.map((item) => item.id);
    const effectiveMoves = getEffectiveMoves(originalIds, finalIds);

    startTransition(() => {
      void (async () => {
        const result = await onSave(
          selectedScope.id,
          effectiveMoves,
        );

        if (!result.ok) {
          toast(result.error || errorMessage, 'error');
          return;
        }

        toast(successMessage, 'success');
        setOpen(false);
        router.refresh();
      })();
    });
  };

  return (
    <>
      <AdminActionButton
        variant="secondary"
        icon={<ArrowUpDown className="h-4 w-4" />}
        onClick={handleOpen}
      >
        {buttonLabel}
      </AdminActionButton>

      <AdminModal
        open={open}
        onClose={handleClose}
        title={title}
        description={description}
        size="xl"
        dismissible={!isPending}
        footer={
          <>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="admin-button-secondary px-5 text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !selectedScope || draftItems.length < 2 || !hasChanges}
              className="admin-button-primary px-6 text-xs"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPending ? 'Đang lưu...' : saveLabel}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {scopes.length > 1 ? (
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]">
                Phạm vi sắp xếp
              </span>
              <select
                value={currentScopeId}
                onChange={(event) => {
                  const nextScopeId = event.target.value;
                  setSelectedScopeId(nextScopeId);
                  setDraftItems(scopeMap.get(nextScopeId)?.items ?? []);
                  setMoves([]);
                }}
                className="admin-select text-xs"
              >
                {scopes.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selectedScope?.description ? (
            <div className="rounded-2xl border border-[#DDE5F8] bg-[#F7F9FF] px-4 py-3 text-xs font-medium leading-relaxed text-[#4B5563]">
              {selectedScope.description}
            </div>
          ) : null}

          {!selectedScope || selectedScope.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8DEEC] bg-[#F7F9FB] px-6 py-14 text-center text-sm font-medium text-[#646464]">
              Không có mục nào trong phạm vi này để sắp xếp.
            </div>
          ) : draftItems.length < 2 ? (
            <div className="rounded-2xl border border-dashed border-[#D8DEEC] bg-[#F7F9FB] px-6 py-14 text-center">
              <p className="text-sm font-extrabold text-[#202224]">Chưa đủ mục để thay đổi thứ tự</p>
              <p className="mt-1 text-xs font-medium text-[#646464]">
                Cần ít nhất 2 mục trong cùng phạm vi để bật kéo thả.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={draftItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {draftItems.map((item) => (
                    <SortableRow key={item.id} item={item} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </AdminModal>
    </>
  );
}
