"use client";

import React, { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuditLogService } from '@/services/auditLogService';
import { AuditLogEntry, AuditLogFilters } from '@/types/audit-log';
import { AuditLogFilters as AuditLogFiltersComponent } from '@/components/audit/AuditLogFilters';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { Shield } from 'lucide-react';

export default function AuditoriaPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [initialLoad, setInitialLoad] = useState(true);

  // Check authorization
  useEffect(() => {
    if (!authLoading && user && user.role !== 'owner') {
      redirect('/dashboard');
    }
  }, [authLoading, user]);

  // Load initial audit log entries
  useEffect(() => {
    if (authLoading || !user || user.role !== 'owner') return;

    const fetchAuditLog = async () => {
      setLoading(true);
      try {
        const response = await AuditLogService.getAuditLog({
          ...filters,
          page_size: 50,
        });
        setEntries(response.entries);
        setNextCursor(response.next_cursor);
      } catch (error) {
        console.error('Error loading audit log:', error);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchAuditLog();
  }, [authLoading, user, filters]);

  const handleFilterChange = (newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setNextCursor(null); // Reset cursor when filters change
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;

    setLoading(true);
    try {
      const response = await AuditLogService.getAuditLog({
        ...filters,
        before_id: nextCursor,
        page_size: 50,
      });
      setEntries((prev) => [...prev, ...response.entries]);
      setNextCursor(response.next_cursor);
    } catch (error) {
      console.error('Error loading more audit entries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  if (user.role !== 'owner') {
    return null; // Redirect should have happened in useEffect
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center">
            <Shield size={20} className="text-accent-primary" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
            Auditoría
          </h1>
        </div>
        <p className="text-sm text-foreground/60 max-w-xl font-medium">
          Registro detallado de todas las acciones realizadas en el sistema. Expande cada fila para ver los cambios específicos.
        </p>
      </div>

      {/* Filters */}
      <AuditLogFiltersComponent onChange={handleFilterChange} />

      {/* Table */}
      <AuditLogTable entries={entries} loading={initialLoad} />

      {/* Load More Button */}
      {nextCursor && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-sm font-bold text-accent-primary hover:bg-accent-primary/20 transition-colors"
          >
            Cargar más registros
          </button>
        </div>
      )}

      {/* Loading indicator while loading more */}
      {loading && nextCursor && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
