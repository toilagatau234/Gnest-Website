/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';

interface FormattedDateProps {
  date: string | number | Date;
  type?: 'time' | 'date' | 'both';
  options?: Intl.DateTimeFormatOptions;
}

export default function FormattedDate({ date, type = 'both', options }: FormattedDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="opacity-0">—</span>;
  }

  let formattedText = '—';
  const d = new Date(date);
  if (!isNaN(d.getTime())) {
    try {
      if (type === 'time') {
        const defaultOptions: Intl.DateTimeFormatOptions = options || { hour: '2-digit', minute: '2-digit' };
        formattedText = d.toLocaleTimeString('vi-VN', defaultOptions);
      } else if (type === 'date') {
        formattedText = d.toLocaleDateString('vi-VN', options);
      } else {
        const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = d.toLocaleDateString('vi-VN');
        formattedText = `${timeStr} - ${dateStr}`;
      }
    } catch (e) {
      formattedText = '—';
    }
  }

  return <span suppressHydrationWarning>{formattedText}</span>;
}

