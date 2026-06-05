import { api } from '@/lib/api';
import { CashSession, SessionReport } from '@/types/cashSession';

interface ApiSession {
  id: string;
  owner_id: string;
  cashbox_id?: string | null;
  cashier_id?: string | null;
  cashier_name?: string | null;
  status: string;
  opened_at: string;
  closed_at?: string | null;
  opening_balance?: number | null;
  total_sales?: number | null;
  total_by_method?: Record<string, number> | null;
  debt_collected?: number | null;
  debt_pending_at_open?: number | null;
  debt_pending_at_close?: number | null;
  discrepancies?: number | null;
  notes?: string | null;
}

function toSession(s: ApiSession): CashSession & { id: string } {
  return {
    id: s.id,
    ownerId: s.owner_id,
    cashierId: s.cashier_id ?? '',
    cashierName: s.cashier_name ?? '',
    cashboxId: s.cashbox_id ?? null,
    cashboxName: null,
    openedAt: new Date(s.opened_at).getTime(),
    closedAt: s.closed_at ? new Date(s.closed_at).getTime() : null,
    status: s.status as CashSession['status'],
    saleIds: [],
    totalSales: s.total_sales ?? 0,
    totalByMethod: {
      cash: s.total_by_method?.cash ?? 0,
      transfer: s.total_by_method?.transfer ?? 0,
      mobile_pay: s.total_by_method?.mobile_pay ?? 0,
      credit: s.total_by_method?.credit ?? 0,
    },
    debtCollected: s.debt_collected ?? 0,
    debtPendingAtOpen: s.debt_pending_at_open ?? 0,
    debtPendingAtClose: s.debt_pending_at_close ?? 0,
    totalReturns: 0,
    notes: s.notes ?? undefined,
    discrepancies: s.discrepancies != null ? String(s.discrepancies) : undefined,
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export class CashSessionService {
  static async openSession(
    _ownerId: string,
    _cashierId: string,
    _cashierName: string,
    cashboxId?: string,
    _cashboxName?: string
  ): Promise<string> {
    const session = await api.post<ApiSession>('/api/v1/cash-sessions/open', {
      cashbox_id: cashboxId ?? null,
    });
    return session.id;
  }

  static async closeSession(
    sessionId: string,
    notes?: string,
    discrepancies?: string
  ): Promise<void> {
    await api.post(`/api/v1/cash-sessions/${sessionId}/close`, {
      notes: notes ?? null,
      discrepancies: discrepancies != null ? Number(discrepancies) || null : null,
    });
  }

  static async getOpenSession(
    _ownerId: string
  ): Promise<(CashSession & { id: string }) | null> {
    try {
      const s = await api.get<ApiSession>('/api/v1/cash-sessions/current');
      return toSession(s);
    } catch {
      return null;
    }
  }

  static async getOpenSessions(
    _ownerId: string
  ): Promise<(CashSession & { id: string })[]> {
    try {
      const list = await api.get<ApiSession[]>('/api/v1/cash-sessions');
      return list.filter(s => s.status === 'open').map(toSession);
    } catch {
      return [];
    }
  }

  static async getOpenSessionForCashbox(
    ownerId: string,
    cashboxId: string | null
  ): Promise<(CashSession & { id: string }) | null> {
    const open = await this.getOpenSessions(ownerId);
    return open.find(s => (s.cashboxId ?? null) === (cashboxId ?? null)) || null;
  }

  static async getSessionReport(
    sessionId: string
  ): Promise<(SessionReport & { id: string }) | null> {
    try {
      const stats = await api.get<{
        total_sales: number;
        total_by_method: Record<string, number>;
        sales_count: number;
        paid_count: number;
        pending_count: number;
      }>(`/api/v1/cash-sessions/${sessionId}/stats`);

      const list = await api.get<ApiSession[]>('/api/v1/cash-sessions');
      const s = list.find(x => x.id === sessionId);
      if (!s) return null;

      const session = toSession(s);
      return {
        ...session,
        totalSales: stats.total_sales,
        totalByMethod: {
          cash: stats.total_by_method?.cash ?? 0,
          transfer: stats.total_by_method?.transfer ?? 0,
          mobile_pay: stats.total_by_method?.mobile_pay ?? 0,
          credit: stats.total_by_method?.credit ?? 0,
        },
      } as SessionReport & { id: string };
    } catch {
      return null;
    }
  }

  static subscribeToSessions(
    _ownerId: string,
    callback: (sessions: (CashSession & { id: string })[]) => void
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiSession[]>('/api/v1/cash-sessions');
        callback(list.map(toSession));
      } catch { /* silent */ }
    });
  }

  static async getCurrentSessionStats(sessionId: string, _ownerId: string) {
    try {
      const stats = await api.get<{
        total_sales: number;
        total_by_method: Record<string, number>;
        sales_count: number;
        paid_count: number;
        pending_count: number;
      }>(`/api/v1/cash-sessions/${sessionId}/stats`);

      return {
        totalSales: stats.total_sales,
        totalByMethod: stats.total_by_method ?? {},
        salesCount: stats.sales_count,
        pendingCount: stats.pending_count,
        pendingAmount: 0,
        paidCount: stats.paid_count,
        paidAmount: stats.total_sales,
      };
    } catch {
      return null;
    }
  }
}
