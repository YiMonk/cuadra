"use client";

import React from 'react';
import { AuditLogEntry } from '@/types/audit-log';

interface AuditLogEntryDetailProps {
  entry: AuditLogEntry;
}

export function AuditLogEntryDetail({ entry }: AuditLogEntryDetailProps) {
  const renderPayload = (payload: string | null, label: string, bgClass: string, borderClass: string) => {
    if (!payload) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      parsed = payload;
    }

    const formatted = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);

    return (
      <div className={`rounded-lg border ${bgClass} ${borderClass} p-4`}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-foreground/70">{label}</p>
        <pre className="text-[11px] font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-words">
          {formatted}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {entry.payload_before || entry.payload_after ? (
        <>
          {renderPayload(
            entry.payload_before,
            'Antes',
            'bg-red-950/20',
            'border-red-900/30'
          )}
          {renderPayload(
            entry.payload_after,
            'Después',
            'bg-green-950/20',
            'border-green-900/30'
          )}
        </>
      ) : (
        <div className="text-sm text-foreground/50 py-4">Sin detalle de cambios</div>
      )}
    </div>
  );
}
