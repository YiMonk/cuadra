import { api } from '@/lib/api';
import { Cashbox } from '../types/cashbox';

export type { Cashbox };

interface ApiCashbox {
  id: string;
  owner_id: string;
  name: string;
  location_id?: string | null;
  assigned_user_id?: string | null;
  active: boolean;
}

function toCashbox(c: ApiCashbox): Cashbox {
  return {
    id: c.id,
    name: c.name,
    ownerId: c.owner_id,
    active: c.active,
    createdAt: Date.now(),
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const CashboxService = {
  async addCashbox(name: string, _ownerId: string, locationId?: string): Promise<string> {
    const created = await api.post<ApiCashbox>('/api/v1/cashboxes', {
      name,
      location_id: locationId ?? null,
    });
    return created.id;
  },

  async updateCashbox(id: string, updates: Partial<Cashbox>): Promise<boolean> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    await api.patch(`/api/v1/cashboxes/${id}`, body);
    return true;
  },

  async deleteCashbox(id: string): Promise<boolean> {
    await api.delete(`/api/v1/cashboxes/${id}`);
    return true;
  },

  async getCashboxes(_ownerId: string): Promise<Cashbox[]> {
    const list = await api.get<ApiCashbox[]>('/api/v1/cashboxes');
    return list.map(toCashbox);
  },

  subscribeToCashboxes(
    _ownerId: string,
    callback: (cashboxes: Cashbox[]) => void
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiCashbox[]>('/api/v1/cashboxes');
        callback(list.map(toCashbox));
      } catch { /* silent */ }
    });
  },

  async getCashboxBalance(
    cashboxId: string,
    startDate: number,
    endDate: number
  ): Promise<{ total: number; count: number; byPaymentMethod: Record<string, number> }> {
    const from = new Date(startDate).toISOString();
    const to = new Date(endDate).toISOString();
    return api.get(
      `/api/v1/cashboxes/${cashboxId}/balance?start_date=${encodeURIComponent(from)}&end_date=${encodeURIComponent(to)}`
    );
  },
};
