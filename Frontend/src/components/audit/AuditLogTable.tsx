"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AuditLogEntry } from '@/types/audit-log';
import { AuditLogEntryDetail } from './AuditLogEntryDetail';

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  loading: boolean;
}

// Mapa de labels legibles para acciones
const ACTION_LABELS: Record<string, string> = {
  'sale.created': 'Venta creada',
  'sale.cancelled': 'Venta cancelada',
  'user.archived': 'Usuario archivado',
  'user.unarchived': 'Usuario desarchivado',
  'user.invited': 'Usuario invitado',
  'user.updated': 'Usuario actualizado',
  'product.updated': 'Producto actualizado',
  'stock.adjusted': 'Stock ajustado',
  'expense.created': 'Gasto creado',
  'cash_closing.created': 'Cierre de caja',
};

// Mapa de labels legibles para tipos de entidad
const ENTITY_LABELS: Record<string, string> = {
  'sale': 'Venta',
  'user': 'Usuario',
  'product': 'Producto',
  'stock_adjustment': 'Stock',
  'expense': 'Gasto',
  'cash_closing': 'Cierre de Caja',
  'payment': 'Pago',
};

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

function getEntityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] || entityType;
}

function truncateId(id: string, length: number = 8): string {
  return id.length > length ? `${id.substring(0, length)}...` : id;
}

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function AuditLogTable({ entries, loading }: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-ui-surface rounded-lg border border-ui-border/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-ui-surface flex items-center justify-center mb-4">
          <ChevronDown size={28} className="text-foreground/30" />
        </div>
        <p className="text-sm font-semibold text-foreground/60">
          No hay registros de auditoría para los filtros seleccionados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 border border-ui-border/30 rounded-2xl overflow-hidden bg-ui-surface/40">
      {/* Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-ui-surface/60 border-b border-ui-border/30 font-bold text-xs uppercase tracking-wider text-foreground/60">
        <div className="col-span-2">Fecha y Hora</div>
        <div className="col-span-2">Usuario</div>
        <div className="col-span-2">Acción</div>
        <div className="col-span-3">Entidad</div>
        <div className="col-span-2">IP</div>
        <div className="col-span-1" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-ui-border/30">
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.id;

          return (
            <div key={entry.id} className="bg-ui-bg/40 hover:bg-ui-surface/40 transition-colors duration-200">
              {/* Main Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="w-full text-left"
              >
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                  {/* Fecha */}
                  <div className="col-span-2">
                    <span className="text-xs text-foreground/80 font-medium">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </div>

                  {/* Usuario */}
                  <div className="col-span-2">
                    <span className="text-xs text-foreground/80 font-medium truncate">
                      {entry.user_name}
                    </span>
                  </div>

                  {/* Acción */}
                  <div className="col-span-2">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-[10px] font-bold text-accent-primary uppercase tracking-wider">
                      {getActionLabel(entry.action)}
                    </span>
                  </div>

                  {/* Entidad */}
                  <div className="col-span-3">
                    <span className="text-xs text-foreground/70 font-medium">
                      {getEntityLabel(entry.entity_type)} #{truncateId(entry.entity_id)}
                    </span>
                  </div>

                  {/* IP */}
                  <div className="col-span-2">
                    <span className="text-xs text-foreground/60 font-mono">
                      {entry.ip || '—'}
                    </span>
                  </div>

                  {/* Expand Icon */}
                  <div className="col-span-1 flex justify-end">
                    <ChevronRight
                      size={18}
                      className={`text-foreground/40 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Mobile Row */}
                <div className="md:hidden px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/60 uppercase tracking-wider font-bold mb-1">
                        {formatDateTime(entry.created_at)}
                      </p>
                      <p className="text-xs text-foreground/80 font-semibold truncate">
                        {entry.user_name}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      className={`text-foreground/40 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block px-2 py-1 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-[9px] font-bold text-accent-primary uppercase tracking-wider">
                      {getActionLabel(entry.action)}
                    </span>
                    <span className="text-[9px] text-foreground/60">
                      {getEntityLabel(entry.entity_type)} #{truncateId(entry.entity_id, 6)}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 md:px-6 py-4 bg-ui-surface/60 border-t border-ui-border/20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <AuditLogEntryDetail entry={entry} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
