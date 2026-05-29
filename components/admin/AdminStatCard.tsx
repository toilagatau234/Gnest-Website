'use client';

import React from 'react';
import { Interactive3DTilt } from '@/components/Interactive3DTilt';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  icon,
  description,
  trend,
  className = '',
}: AdminStatCardProps) {
  return (
    <Interactive3DTilt maxTilt={6} className="h-full">
      <div
        className={`
          h-full bg-white border border-[#D7E0EC] rounded-2xl p-6
          shadow-sm hover:shadow-md transition-all duration-300
          relative overflow-hidden group flex flex-col justify-between
          ${className}
        `}
      >
        {/* Decorative background gradient */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-110" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
            <div className="p-2.5 bg-slate-50 rounded-xl text-[#1B3A6B] border border-slate-100 transition-colors duration-300 group-hover:bg-[#1B3A6B]/5 group-hover:text-[#E31E24]">
              {icon}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
            {trend && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  trend.isPositive
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>

        {description && (
          <p className="text-xs text-slate-400 mt-4 leading-normal font-medium">{description}</p>
        )}
      </div>
    </Interactive3DTilt>
  );
}
