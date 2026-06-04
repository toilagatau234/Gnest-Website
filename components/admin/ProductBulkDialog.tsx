'use client';

import { useState } from 'react';
import { FileSpreadsheet, Layers, TableProperties } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { ProductBulkManualTable } from '@/components/admin/ProductBulkManualTable';
import { ProductImportContent } from '@/components/admin/ProductImportDialog';
import type { AdminCategory } from '@/lib/services/admin/categories';

type Tab = 'table' | 'excel';

interface ProductBulkDialogProps {
  categories: AdminCategory[];
}

export function ProductBulkDialog({ categories }: ProductBulkDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('table');
  const [importPending, setImportPending] = useState(false);

  function openDialog() {
    setTab('table');
    setImportPending(false);
    setOpen(true);
  }

  function closeDialog() {
    if (importPending) return;
    setOpen(false);
  }

  return (
    <>
      <AdminActionButton
        variant="secondary"
        icon={<Layers className="h-4 w-4" />}
        onClick={openDialog}
      >
        Thêm nhiều sản phẩm
      </AdminActionButton>

      <AdminModal
        open={open}
        onClose={closeDialog}
        title="Thêm nhiều sản phẩm"
        description="Nhập bằng bảng hoặc import từ file Excel."
        size="2xl"
        dismissible={!importPending}
      >
        {/* Tab bar */}
        <div className="mb-5 flex gap-1 rounded-xl border border-[#EEF2F6] bg-[#F7F9FB] p-1">
          <TabButton
            active={tab === 'table'}
            onClick={() => setTab('table')}
            icon={<TableProperties className="h-3.5 w-3.5" />}
          >
            Nhập bằng bảng
          </TabButton>
          <TabButton
            active={tab === 'excel'}
            onClick={() => setTab('excel')}
            icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
          >
            Import Excel
          </TabButton>
        </div>

        {tab === 'table' && (
          <ProductBulkManualTable categories={categories} />
        )}

        {tab === 'excel' && (
          <ProductImportContent
            onClose={closeDialog}
            onPendingChange={setImportPending}
          />
        )}
      </AdminModal>
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
        active
          ? 'bg-white text-[#1B3A6B] shadow-sm ring-1 ring-[#EEF2F6]'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
