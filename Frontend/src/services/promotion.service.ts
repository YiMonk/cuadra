import { api } from '@/lib/api';
import { Promotion, PriceList, Coupon } from '@/types/promotion';

function toMs(s?: string | null): number {
  return s ? new Date(s).getTime() : Date.now();
}

// ── Promotions ────────────────────────────────────────────────────────────────

interface ApiPromotion {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  type: string;
  active?: boolean;
  valid_from?: string | null;
  valid_to?: string | null;
  percent_value?: number | null;
  product_ids?: string[] | null;
  min_cart_total?: number | null;
  buy_x?: number | null;
  pay_y?: number | null;
  bundle_product_ids?: string[] | null;
  bundle_price?: number | null;
  stackable?: boolean | null;
  created_at?: string;
  updated_at?: string | null;
}

function toPromotion(p: ApiPromotion): Promotion {
  return {
    id: p.id,
    ownerId: p.owner_id,
    name: p.name,
    description: p.description ?? undefined,
    type: p.type as Promotion['type'],
    active: p.active ?? true,
    validFrom: p.valid_from ? new Date(p.valid_from).getTime() : null,
    validTo: p.valid_to ? new Date(p.valid_to).getTime() : null,
    percentValue: p.percent_value ?? undefined,
    productIds: p.product_ids ?? undefined,
    minCartTotal: p.min_cart_total ?? undefined,
    buyX: p.buy_x ?? undefined,
    payY: p.pay_y ?? undefined,
    bundleProductIds: p.bundle_product_ids ?? undefined,
    bundlePrice: p.bundle_price ?? undefined,
    stackable: p.stackable ?? undefined,
    createdAt: toMs(p.created_at),
    updatedAt: toMs(p.updated_at),
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const PromotionService = {
  async add(
    _ownerId: string,
    data: Omit<Promotion, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const created = await api.post<ApiPromotion>('/api/v1/promotions', data);
    return created.id;
  },

  async update(id: string, updates: Partial<Promotion>): Promise<void> {
    await api.patch(`/api/v1/promotions/${id}`, updates);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/v1/promotions/${id}`);
  },

  async list(_ownerId: string): Promise<Promotion[]> {
    try {
      const list = await api.get<ApiPromotion[]>('/api/v1/promotions');
      return list.map(toPromotion);
    } catch {
      return [];
    }
  },

  subscribe(_ownerId: string, cb: (items: Promotion[]) => void): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiPromotion[]>('/api/v1/promotions');
        cb(list.map(toPromotion));
      } catch { /* silent */ }
    });
  },
};

// ── Price Lists ───────────────────────────────────────────────────────────────

interface ApiPriceList {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  active?: boolean;
  applies_by_tag?: string | null;
  applies_by_client_ids?: string[] | null;
  items?: Array<{ product_id: string; price: number }> | null;
  created_at?: string;
  updated_at?: string | null;
}

function toPriceList(p: ApiPriceList): PriceList {
  return {
    id: p.id,
    ownerId: p.owner_id,
    name: p.name,
    description: p.description ?? undefined,
    active: p.active ?? true,
    appliesByTag: p.applies_by_tag ?? null,
    appliesByClientIds: p.applies_by_client_ids ?? undefined,
    items: (p.items ?? []).map(i => ({ productId: i.product_id, price: i.price })),
    createdAt: toMs(p.created_at),
    updatedAt: toMs(p.updated_at),
  };
}

export const PriceListService = {
  async add(
    _ownerId: string,
    data: Omit<PriceList, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const created = await api.post<ApiPriceList>('/api/v1/price-lists', data);
    return created.id;
  },

  async update(id: string, updates: Partial<PriceList>): Promise<void> {
    await api.patch(`/api/v1/price-lists/${id}`, updates);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/v1/price-lists/${id}`);
  },

  async list(_ownerId: string): Promise<PriceList[]> {
    try {
      const list = await api.get<ApiPriceList[]>('/api/v1/price-lists');
      return list.map(toPriceList);
    } catch {
      return [];
    }
  },

  subscribe(_ownerId: string, cb: (items: PriceList[]) => void): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiPriceList[]>('/api/v1/price-lists');
        cb(list.map(toPriceList));
      } catch { /* silent */ }
    });
  },
};

// ── Coupons ───────────────────────────────────────────────────────────────────

interface ApiCoupon {
  id: string;
  owner_id: string;
  code: string;
  name?: string | null;
  type?: string;
  value?: number;
  active?: boolean;
  expires_at?: string | null;
  min_cart_total?: number | null;
  usage_limit?: number | null;
  used_count?: number;
  created_at?: string;
  updated_at?: string | null;
}

function toCoupon(c: ApiCoupon): Coupon {
  return {
    id: c.id,
    ownerId: c.owner_id,
    code: c.code,
    name: c.name ?? undefined,
    type: (c.type ?? 'PERCENT') as Coupon['type'],
    value: c.value ?? 0,
    active: c.active ?? true,
    expiresAt: c.expires_at ? new Date(c.expires_at).getTime() : null,
    minCartTotal: c.min_cart_total ?? undefined,
    usageLimit: c.usage_limit ?? null,
    usedCount: c.used_count ?? 0,
    createdAt: toMs(c.created_at),
    updatedAt: toMs(c.updated_at),
  };
}

export const CouponService = {
  normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  },

  async add(
    _ownerId: string,
    data: Omit<Coupon, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'usedCount'>
  ): Promise<string> {
    const created = await api.post<ApiCoupon>('/api/v1/coupons', {
      ...data,
      code: this.normalizeCode(data.code),
    });
    return created.id;
  },

  async update(id: string, updates: Partial<Coupon>): Promise<void> {
    const patch = { ...updates };
    if (typeof updates.code === 'string') {
      (patch as any).code = this.normalizeCode(updates.code);
    }
    await api.patch(`/api/v1/coupons/${id}`, patch);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/v1/coupons/${id}`);
  },

  async list(_ownerId: string): Promise<Coupon[]> {
    try {
      const list = await api.get<ApiCoupon[]>('/api/v1/coupons');
      return list.map(toCoupon);
    } catch {
      return [];
    }
  },

  async findByCode(_ownerId: string, code: string): Promise<Coupon | null> {
    const normalized = this.normalizeCode(code);
    try {
      const coupon = await api.get<ApiCoupon>(`/api/v1/coupons/lookup?code=${encodeURIComponent(normalized)}`);
      return toCoupon(coupon);
    } catch {
      return null;
    }
  },

  async incrementUsage(id: string, _currentUsed: number): Promise<void> {
    await api.post(`/api/v1/coupons/${id}/increment-usage`, {}).catch(() => {});
  },

  subscribe(_ownerId: string, cb: (items: Coupon[]) => void): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiCoupon[]>('/api/v1/coupons');
        cb(list.map(toCoupon));
      } catch { /* silent */ }
    });
  },
};
