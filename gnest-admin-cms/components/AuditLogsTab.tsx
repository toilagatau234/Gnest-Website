'use client';

import React, { useState } from 'react';
import { History, Search, ArrowRight, Eye, Code, Calendar, ShieldCheck, Check } from 'lucide-react';
import { AuditLog } from '@/lib/mock-data';
import FormattedDate from './FormattedDate';

interface AuditLogsTabProps {
  auditLogs: AuditLog[];
  searchText: string;
}

export default function AuditLogsTab({
  auditLogs,
  searchText
}: AuditLogsTabProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter(log =>
    log.actor.toLowerCase().includes(searchText.toLowerCase()) ||
    log.action.toLowerCase().includes(searchText.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchText.toLowerCase()) ||
    log.entity_id.toLowerCase().includes(searchText.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'UPDATE': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'UPDATE_STATUS': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-red-50 text-red-700 border-red-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-base font-bold text-[#1B3A6B]">Nhật Ký Hoạt Động Hệ Thống (Audit Logs)</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Truy vết thời gian thực mọi biến đổi dữ liệu, hành động cập nhật thông số sỉ hũ yến, báo giá & website của admin
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-200 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Bảo mật chống gian lận RLS</span>
        </div>
      </div>

      {/* Main split timeline log layout list */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Core Logs Timeline List (Col 2) */}
        <div className="overflow-x-auto xl:col-span-2">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-bold text-sm">Không tìm thấy nhật ký tương thích</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="p-3">Tài khoản Admin</th>
                  <th className="p-3">Hành động</th>
                  <th className="p-3">Đối tượng</th>
                  <th className="p-3">Dữ liệu ID</th>
                  <th className="p-3 text-center">Thời gian</th>
                  <th className="p-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer group ${
                      selectedLog?.id === log.id ? 'bg-[#1B3A6B]/5' : ''
                    }`}
                  >
                    <td className="p-3 font-semibold text-slate-800">
                      {log.actor}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{log.entity}</td>
                    <td className="p-3 font-mono text-slate-400 text-[10px]/none">{log.entity_id}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500 text-center">
                      <span className="block"><FormattedDate date={log.created_at} type="date" /></span>
                      <span className="block text-[9px] text-[#1B3A6B]"><FormattedDate date={log.created_at} type="time" /></span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        className="p-1.5 bg-slate-50 group-hover:bg-[#1B3A6B] group-hover:text-white rounded-lg border border-slate-200 transition-all"
                        title="Xem JSON"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Dynamic JSON Viewport (Col 1) */}
        <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 flex flex-col justify-between h-[60vh] shrink-0 font-mono text-slate-300">
          {selectedLog ? (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-3 uppercase font-sans font-bold">
                <span>Dữ Liệu Metadata Biên Đổi</span>
                <span className="text-[#E31E24] hover:underline cursor-pointer select-none font-bold" onClick={() => setSelectedLog(null)}>Tắt</span>
              </div>
              
              <div className="space-y-1.5 text-[11px] border-b border-slate-800 pb-3 font-sans">
                <p>• Admin: <strong className="text-white font-mono">{selectedLog.actor}</strong></p>
                <p>• Action: <strong className="text-emerald-400">{selectedLog.action}</strong></p>
                <p>• Entity: <strong className="text-white">{selectedLog.entity}</strong> ({selectedLog.entity_id})</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-550 text-slate-500 font-sans">Mã JSON ghi nhận:</p>
                <pre className="text-[10px] text-sky-400 overflow-x-auto leading-relaxed max-w-full text-wrap">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Code className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-xs font-semibold text-slate-400">Chọn một hàng nhật ký</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs">Nhấp vào bất kỳ sự kiện nào bên danh sách để bóc tách thông số kỹ thuật (Payload Metadata JSON) của nó.</p>
            </div>
          )}

          <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-sans mt-4">
            <p className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5 text-[#E31E24]" /> Nhấn row để inspect</p>
            <p className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Log Synced</p>
          </div>
        </div>

      </div>

    </div>
  );
}
