"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { AuditLogFilters, EntityType } from '@/types/audit-log';
import { TeamService } from '@/services/teamService';

interface AuditLogFiltersProps {
  onChange: (filters: AuditLogFilters) => void;
}

interface TeamMember {
  id: string;
  displayName: string;
}

const ENTITY_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'sale', label: 'Ventas' },
  { value: 'user', label: 'Usuarios' },
  { value: 'product', label: 'Productos' },
  { value: 'stock_adjustment', label: 'Stock' },
  { value: 'expense', label: 'Gastos' },
  { value: 'cash_closing', label: 'Cierre de Caja' },
  { value: 'payment', label: 'Pagos' },
];

export function AuditLogFilters({ onChange }: AuditLogFiltersProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // Load team members on mount
  useEffect(() => {
    (async () => {
      try {
        const members = await TeamService.getTeamMembers(true); // include archived
        setTeamMembers(members.map(m => ({ id: m.id, displayName: m.displayName })));
      } catch (error) {
        console.error('Error loading team members:', error);
      } finally {
        setLoadingTeam(false);
      }
    })();
  }, []);

  // Emit filter changes
  const emitFilters = (fd: string, td: string, uid: string, et: string) => {
    const filters: AuditLogFilters = {};
    if (fd) filters.from_date = fd;
    if (td) filters.to_date = td;
    if (uid) filters.user_id = uid;
    if (et) filters.entity_type = et;
    onChange(filters);
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedUserId('');
    setSelectedEntity('');
    onChange({});
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* From Date */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">
            Desde
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              emitFilters(e.target.value, toDate, selectedUserId, selectedEntity);
            }}
            className="px-3 py-2.5 rounded-lg border border-ui-border bg-ui-bg text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          />
        </div>

        {/* To Date */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">
            Hasta
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              emitFilters(fromDate, e.target.value, selectedUserId, selectedEntity);
            }}
            className="px-3 py-2.5 rounded-lg border border-ui-border bg-ui-bg text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          />
        </div>

        {/* User Select */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">
            Usuario
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              emitFilters(fromDate, toDate, e.target.value, selectedEntity);
            }}
            disabled={loadingTeam}
            className="px-3 py-2.5 rounded-lg border border-ui-border bg-ui-bg text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/50 disabled:opacity-50"
          >
            <option value="">Todos los usuarios</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type Select */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground/60">
            Tipo de Entidad
          </label>
          <select
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value);
              emitFilters(fromDate, toDate, selectedUserId, e.target.value);
            }}
            className="px-3 py-2.5 rounded-lg border border-ui-border bg-ui-bg text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          >
            <option value="">Todas las entidades</option>
            {ENTITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Button */}
      {(fromDate || toDate || selectedUserId || selectedEntity) && (
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ui-surface hover:bg-ui-surface-hover border border-ui-border/50 text-sm font-semibold text-foreground/70 transition-colors"
        >
          <X size={16} />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
