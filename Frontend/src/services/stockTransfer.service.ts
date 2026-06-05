import { api } from '@/lib/api';
import { StockTransfer, StockTransferItem } from '@/types/stockTransfer';

interface ApiTransfer {
  id: string;
  owner_id: string;
  from_location_id: string;
  from_location_name?: string | null;
  to_location_id: string;
  to_location_name?: string | null;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    variant_id?: string | null;
  }>;
  notes?: string | null;
  status?: string;
  created_at: string;
  created_by?: string | null;
  created_by_name?: string | null;
}

function toTransfer(t: ApiTransfer): StockTransfer {
  return {
    id: t.id,
    ownerId: t.owner_id,
    fromLocationId: t.from_location_id,
    fromLocationName: t.from_location_name ?? '',
    toLocationId: t.to_location_id,
    toLocationName: t.to_location_name ?? '',
    items: t.items.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
    })),
    notes: t.notes ?? undefined,
    createdAt: new Date(t.created_at).getTime(),
    createdBy: t.created_by ?? null,
    createdByName: t.created_by_name ?? null,
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const StockTransferService = {
  async create(params: {
    ownerId: string;
    fromLocationId: string;
    fromLocationName: string;
    toLocationId: string;
    toLocationName: string;
    items: StockTransferItem[];
    notes?: string;
    createdBy?: { id: string; name: string };
  }): Promise<string> {
    const created = await api.post<ApiTransfer>('/api/v1/stock-transfers', {
      from_location_id: params.fromLocationId,
      to_location_id: params.toLocationId,
      items: params.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
      notes: params.notes ?? null,
    });
    return created.id;
  },

  async list(_ownerId: string, max = 100): Promise<StockTransfer[]> {
    const list = await api.get<ApiTransfer[]>(`/api/v1/stock-transfers?limit=${max}`);
    return list.map(toTransfer);
  },

  subscribe(
    _ownerId: string,
    cb: (items: StockTransfer[]) => void,
    max = 100
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiTransfer[]>(`/api/v1/stock-transfers?limit=${max}`);
        cb(list.map(toTransfer));
      } catch { /* silent */ }
    });
  },
};
