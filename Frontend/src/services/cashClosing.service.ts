import { api } from '@/lib/api';
import { CashClosing } from '@/types/cashClosing';
import { Sale } from '@/types/sales';
import { SalesService } from './sales.service';

interface ApiClosing {
  id: string;
  owner_id: string;
  cashier_id?: string | null;
  cashbox_ids?: string[] | null;
  includes_unassigned?: boolean;
  total: number;
  total_by_method?: Record<string, number> | null;
  sales_count: number;
  notes?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  closed_at: string;
}

function toClosing(c: ApiClosing): CashClosing & { id: string } {
  return {
    id: c.id,
    ownerId: c.owner_id,
    closedAt: new Date(c.closed_at).getTime(),
    closedBy: c.cashier_id ?? '',
    closedByName: '',
    cashboxIds: c.cashbox_ids ?? [],
    cashboxNames: [],
    includesUnassigned: c.includes_unassigned ?? false,
    saleIds: [],
    dateRange: {
      from: c.period_start ? new Date(c.period_start).getTime() : 0,
      to: c.period_end ? new Date(c.period_end).getTime() : new Date(c.closed_at).getTime(),
    },
    totalSales: c.total,
    totalByMethod: {
      cash: c.total_by_method?.cash ?? 0,
      transfer: c.total_by_method?.transfer ?? 0,
      mobile_pay: c.total_by_method?.mobile_pay ?? 0,
      credit: c.total_by_method?.credit ?? 0,
    },
    paidAmount: c.total,
    pendingAmount: 0,
    salesCount: c.sales_count,
    notes: c.notes ?? undefined,
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export class CashClosingService {
  static async createClosing(data: Omit<CashClosing, 'id'>): Promise<string> {
    const created = await api.post<ApiClosing>('/api/v1/cash-closings', {
      cashbox_ids: data.cashboxIds ?? [],
      includes_unassigned: data.includesUnassigned ?? false,
      period_start: data.dateRange?.from ? new Date(data.dateRange.from).toISOString() : null,
      period_end: data.dateRange?.to ? new Date(data.dateRange.to).toISOString() : null,
      notes: data.notes ?? null,
    });
    return created.id;
  }

  static subscribeToClosings(
    _ownerId: string,
    callback: (closings: (CashClosing & { id: string })[]) => void
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiClosing[]>('/api/v1/cash-closings');
        callback(list.map(toClosing));
      } catch { /* silent */ }
    });
  }

  static async getSalesForClosing(
    _ownerId: string,
    options: {
      cashboxIds: string[];
      includesUnassigned: boolean;
      from: number;
      to: number;
    }
  ): Promise<Sale[]> {
    const allSales = await SalesService.getAllSales({ startDate: options.from, endDate: options.to });
    return allSales.filter(sale => {
      if (sale.status === 'cancelled') return false;
      if (sale.closedInClosingId) return false;
      const hasCashbox =
        options.cashboxIds.length > 0 && options.cashboxIds.includes(sale.cashboxId || '');
      const isUnassigned = !sale.cashboxId && options.includesUnassigned;
      return hasCashbox || isUnassigned;
    });
  }

  static async getLastClosingToday(
    _ownerId: string
  ): Promise<(CashClosing & { id: string }) | null> {
    try {
      const list = await api.get<ApiClosing[]>('/api/v1/cash-closings');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      const recent = list
        .map(toClosing)
        .filter(c => c.closedAt >= todayMs)
        .sort((a, b) => b.closedAt - a.closedAt);
      return recent[0] ?? null;
    } catch {
      return null;
    }
  }

  static async getAllClosings(
    _ownerId: string
  ): Promise<(CashClosing & { id: string })[]> {
    const list = await api.get<ApiClosing[]>('/api/v1/cash-closings');
    return list.map(toClosing);
  }
}
