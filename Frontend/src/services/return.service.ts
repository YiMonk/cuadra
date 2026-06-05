import { api } from '@/lib/api';
import { Return, ReturnItem } from '../types/sales';

interface ApiReturn {
  id: string;
  owner_id: string;
  sale_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    variant_id?: string | null;
  }>;
  total_refund: number;
  reason: string;
  created_by?: string | null;
  creator_name?: string | null;
  created_at: string;
}

export const ReturnService = {
  async createReturn(
    saleId: string,
    returnItems: ReturnItem[],
    reason: string,
    creator?: { id: string; name: string }
  ): Promise<boolean> {
    await api.post(`/api/v1/returns`, {
      sale_id: saleId,
      items: returnItems.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        variant_id: item.variantId ?? null,
      })),
      reason: reason.trim(),
    });
    return true;
  },

  async getReturnsBySale(saleId: string): Promise<Return[]> {
    try {
      const list = await api.get<ApiReturn[]>(`/api/v1/sales/${saleId}/returns`);
      return list.map(r => ({
        id: r.id,
        saleId: r.sale_id,
        ownerId: r.owner_id,
        items: r.items.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          variantId: item.variant_id ?? undefined,
        })),
        totalRefund: r.total_refund,
        reason: r.reason,
        createdAt: new Date(r.created_at).getTime(),
        createdBy: r.created_by ?? null,
        creatorName: r.creator_name ?? null,
      }));
    } catch {
      return [];
    }
  },
};
