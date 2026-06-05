import { api } from '@/lib/api';
import { Sale, ReturnItem } from '../types/sales';
import { CartItem } from '../types/sales';

interface ApiSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ApiSale {
  id: string;
  owner_id: string;
  client_id?: string | null;
  cashier_id?: string | null;
  status: string;
  payment_method: string;
  total: number;
  discount?: number | null;
  exchange_rate_at_sale?: number | null;
  notes?: string | null;
  cancel_reason?: string | null;
  cashbox_id?: string | null;
  has_returns: boolean;
  paid_at?: string | null;
  created_at: string;
  items: ApiSaleItem[];
}

function toDate(s: string | null | undefined): number | null {
  if (!s) return null;
  return new Date(s).getTime();
}

function toSale(s: ApiSale): Sale {
  return {
    id: s.id,
    ownerId: s.owner_id,
    items: (s.items ?? []).map(item => ({
      id: item.product_id,
      name: item.product_name,
      quantity: item.quantity,
      finalPrice: item.unit_price,
      price: item.unit_price,
      stock: 0,
      minStockAlert: 0,
      createdAt: 0,
      updatedAt: 0,
      variantId: item.variant_id ?? undefined,
    } as CartItem)),
    total: s.total,
    paymentMethod: s.payment_method as Sale['paymentMethod'],
    clientId: s.client_id ?? null,
    createdAt: new Date(s.created_at).getTime(),
    paidAt: toDate(s.paid_at),
    status: s.status as Sale['status'],
    createdBy: s.cashier_id ?? null,
    cancellationReason: s.cancel_reason ?? undefined,
    hasReturns: s.has_returns,
    cashboxId: s.cashbox_id ?? null,
    notes: s.notes ?? undefined,
    exchangeRateAtSale: s.exchange_rate_at_sale ?? undefined,
    discountAmount: s.discount ?? undefined,
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const SalesService = {
  async createSale(
    sale: Omit<Sale, 'id' | 'createdAt' | 'status'>,
    _creator?: { id: string; name: string; commissionPct?: number }
  ): Promise<boolean> {
    await api.post('/api/v1/sales', {
      items: sale.items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.finalPrice,
        variant_id: item.variantId ?? undefined,
      })),
      payment_method: sale.paymentMethod,
      client_id: sale.clientId ?? null,
      discount: sale.discountAmount ?? null,
      exchange_rate_at_sale: sale.exchangeRateAtSale ?? null,
      notes: sale.notes ?? null,
      cashbox_id: sale.cashboxId ?? null,
    });
    return true;
  },

  async getPendingSales(_ownerId: string): Promise<Sale[]> {
    const list = await api.get<ApiSale[]>('/api/v1/sales?status=pending&page_size=500');
    return list.map(toSale);
  },

  async getDailySales(_ownerId: string, startOfDay: number, endOfDay: number): Promise<Sale[]> {
    const from = new Date(startOfDay).toISOString();
    const to = new Date(endOfDay).toISOString();
    const list = await api.get<ApiSale[]>(
      `/api/v1/sales?start_date=${encodeURIComponent(from)}&end_date=${encodeURIComponent(to)}&page_size=500`
    );
    return list.map(toSale);
  },

  async getSaleById(id: string): Promise<Sale | null> {
    try {
      const s = await api.get<ApiSale>(`/api/v1/sales/${id}`);
      return toSale(s);
    } catch {
      return null;
    }
  },

  async getSalesByClient(clientId: string): Promise<Sale[]> {
    const list = await api.get<ApiSale[]>(`/api/v1/sales?client_id=${clientId}&page_size=500`);
    return list.map(toSale).sort((a, b) => b.createdAt - a.createdAt);
  },

  async getAllSales(
    options: { ownerId?: string; startDate?: number; endDate?: number; pageSize?: number } | string = {}
  ): Promise<Sale[]> {
    const opts = typeof options === 'string' ? {} : options;
    const params = new URLSearchParams();
    params.set('page_size', String(opts.pageSize ?? 500));
    if (opts.startDate) params.set('start_date', new Date(opts.startDate).toISOString());
    if (opts.endDate) params.set('end_date', new Date(opts.endDate).toISOString());
    const list = await api.get<ApiSale[]>(`/api/v1/sales?${params}`);
    return list.map(toSale);
  },

  async getAllSalesPaginated(options: {
    ownerId?: string;
    startDate?: number;
    endDate?: number;
    pageSize?: number;
    startAfterDoc?: unknown;
  } = {}): Promise<{ sales: Sale[]; lastDoc: null }> {
    const params = new URLSearchParams();
    params.set('page_size', String(options.pageSize ?? 50));
    if (options.startDate) params.set('start_date', new Date(options.startDate).toISOString());
    if (options.endDate) params.set('end_date', new Date(options.endDate).toISOString());
    const list = await api.get<ApiSale[]>(`/api/v1/sales?${params}`);
    return { sales: list.map(toSale), lastDoc: null };
  },

  async getSalesSummary(_ownerId: string, startDate?: number, endDate?: number) {
    const sales = await SalesService.getAllSales({ startDate, endDate });
    return SalesService.computeSummary(sales);
  },

  async updateSaleStatus(saleId: string, updates: Partial<Sale>): Promise<boolean> {
    if (updates.status === 'paid') {
      await api.patch(`/api/v1/sales/${saleId}/status`, {
        status: 'paid',
        payment_method: updates.paymentMethod ?? 'cash',
      });
    }
    return true;
  },

  async updateSale(_saleId: string, _updates: Partial<Sale>): Promise<boolean> {
    // Endpoint not yet in backend — no-op for compatibility
    return true;
  },

  async payAllDebts(clientId: string, updates: Partial<Sale>): Promise<boolean> {
    await api.post(`/api/v1/sales/clients/${clientId}/pay-all-debts`, {
      payment_method: updates.paymentMethod ?? 'cash',
      cashbox_id: updates.cashboxId ?? null,
    });
    return true;
  },

  async paySpecificDebts(saleIds: string[], updates: Partial<Sale>): Promise<boolean> {
    await Promise.all(
      saleIds.map(id =>
        api.patch(`/api/v1/sales/${id}/status`, {
          status: 'paid',
          payment_method: updates.paymentMethod ?? 'cash',
        })
      )
    );
    return true;
  },

  subscribeToPendingSales(
    _ownerId: string,
    callback: (sales: Sale[]) => void
  ): () => void {
    return poll(async () => {
      try {
        callback(await SalesService.getPendingSales(_ownerId));
      } catch { /* silent */ }
    });
  },

  subscribeToRecentSales(
    _ownerId: string,
    pageSize: number,
    callback: (sales: Sale[]) => void
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiSale[]>(`/api/v1/sales?page_size=${pageSize}`);
        callback(list.map(toSale));
      } catch { /* silent */ }
    });
  },

  async cancelSale(saleId: string, reason: string): Promise<boolean> {
    await api.post(`/api/v1/sales/${saleId}/cancel`, { reason });
    return true;
  },

  computeSummary(sales: Sale[]) {
    const revenue = sales
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const pending = sales
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const count = sales.filter(s => s.status !== 'cancelled').length;
    const average = count > 0 ? revenue / count : 0;

    const byPaymentMethod: Record<string, number> = {};
    sales.forEach(s => {
      if (s.status !== 'cancelled') {
        byPaymentMethod[s.paymentMethod] =
          (byPaymentMethod[s.paymentMethod] || 0) + (Number(s.total) || 0);
      }
    });

    const byCashbox: Record<
      string,
      { id: string; name: string; real: number; teorico: number; salesCount: number }
    > = {};
    sales.forEach(s => {
      if (s.status === 'cancelled') return;
      const cId = s.createdBy || 'unknown';
      const cName = s.creatorName || 'Desconocido';
      const amount = Number(s.total) || 0;
      if (!byCashbox[cId]) byCashbox[cId] = { id: cId, name: cName, real: 0, teorico: 0, salesCount: 0 };
      byCashbox[cId].teorico += amount;
      byCashbox[cId].salesCount += 1;
      if (s.status === 'paid') {
        const bId = s.cashboxId || 'sincaja';
        const bName = s.cashboxName || 'Sin Caja Asignada';
        if (!byCashbox[bId]) byCashbox[bId] = { id: bId, name: bName, real: 0, teorico: 0, salesCount: 0 };
        byCashbox[bId].real += amount;
      }
    });

    return {
      revenue,
      pending,
      count,
      average,
      byPaymentMethod,
      byCashbox: Object.values(byCashbox).sort((a, b) => b.real - a.real || b.teorico - a.teorico),
    };
  },

  async getSalesWithoutCashbox(_ownerId: string): Promise<Sale[]> {
    const sales = await SalesService.getAllSales({});
    return sales.filter(s => !s.cashboxId && s.status !== 'cancelled' && !s.closedInClosingId);
  },

  async updateMultipleSales(_saleIds: string[], _updates: Partial<Sale>): Promise<void> {
    // No batch endpoint — no-op for compatibility
  },

  async getSalesByIds(saleIds: string[]): Promise<Sale[]> {
    if (!saleIds || saleIds.length === 0) return [];
    const results = await Promise.allSettled(
      saleIds.map(id => api.get<ApiSale>(`/api/v1/sales/${id}`))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<ApiSale> => r.status === 'fulfilled')
      .map(r => toSale(r.value));
  },
};
