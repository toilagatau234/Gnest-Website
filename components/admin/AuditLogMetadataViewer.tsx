import React from 'react';

interface AuditLogMetadataViewerProps {
  metadata: unknown;
}

/**
 * Recursively masks sensitive keys within an object or array.
 */
export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const masked: Record<string, unknown> = {};
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'service_role',
      'authorization',
      'api_key',
      'apikey',
      'access_token',
      'refresh_token',
    ];

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sk) => lowerKey.includes(sk));
      if (isSensitive) {
        masked[key] = '***MASKED***';
      } else if (value && typeof value === 'object') {
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  return data;
}

export function AuditLogMetadataViewer({ metadata }: AuditLogMetadataViewerProps) {
  // Gracefully attempt to parse if metadata is passed as a JSON string
  let parsed: unknown = metadata;
  if (typeof metadata === 'string') {
    try {
      const trimmed = metadata.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        parsed = JSON.parse(metadata);
      }
    } catch {
      // Retain original string if parsing fails
    }
  }

  // Handle null or undefined gracefully
  if (parsed === null || parsed === undefined) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center text-xs text-slate-400 italic">
        Không có dữ liệu metadata chi tiết.
      </div>
    );
  }

  // Handle empty object or empty array gracefully
  if (typeof parsed === 'object') {
    const isEmpty = Array.isArray(parsed) 
      ? parsed.length === 0 
      : Object.keys(parsed as object).length === 0;

    if (isEmpty) {
      return (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center text-xs text-slate-400 italic">
          Metadata rỗng (không có thuộc tính).
        </div>
      );
    }
  }

  // Handle primitive types gracefully (string, number, boolean)
  if (typeof parsed !== 'object') {
    const stringVal = String(parsed);
    // If it looks like a sensitive value itself, mask it (just in case)
    const isSensitiveStr = /password|token|secret|api_key|authorization/i.test(stringVal);
    const renderVal = isSensitiveStr ? '***MASKED***' : stringVal;

    return (
      <div className="rounded-xl bg-slate-900 border border-slate-950 p-3.5 text-xs font-mono text-slate-100 whitespace-pre-wrap break-all select-text">
        {renderVal}
      </div>
    );
  }

  // Handle object or array: apply recursive masking, and pretty-print
  const maskedPayload = maskSensitiveData(parsed);
  const prettyJson = JSON.stringify(maskedPayload, null, 2);

  return (
    <div className="relative group">
      <pre className="overflow-auto max-h-72 rounded-xl bg-slate-900 text-emerald-400 border border-slate-950 p-4 text-xs font-mono whitespace-pre select-text leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {prettyJson}
      </pre>
      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded border border-slate-700 pointer-events-none">
        JSON Payload
      </div>
    </div>
  );
}
