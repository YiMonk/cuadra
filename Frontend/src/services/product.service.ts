import { api } from '@/lib/api';
import { Product } from '../types/inventory';

interface ApiProduct {
  id: string;
  owner_id: string;
  name: string;
  price: number;
  description?: string | null;
  cost?: number | null;
  stock: number;
  min_stock?: number | null;
  category?: string | null;
  barcode?: string | null;
  image_url?: string | null;
  unit?: string | null;
  location_id?: string | null;
  tags?: unknown;
  variants?: unknown;
  stock_by_location?: Record<string, number> | null;
  active: boolean;
}

function toProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    costPrice: p.cost ?? undefined,
    stock: p.stock,
    minStockAlert: p.min_stock ?? 0,
    imageUrl: p.image_url ?? undefined,
    description: p.description ?? undefined,
    category: p.category ?? undefined,
    unit: p.unit ?? undefined,
    tags: Array.isArray(p.tags) ? p.tags : undefined,
    barcode: p.barcode ?? undefined,
    variants: Array.isArray(p.variants) ? p.variants : undefined,
    stockByLocation: p.stock_by_location ?? undefined,
    location: p.location_id ?? undefined,
    active: p.active,
    ownerId: p.owner_id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function toApiCreate(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Record<string, unknown> {
  return {
    name: product.name,
    price: product.price,
    cost: product.costPrice ?? null,
    stock: product.stock ?? 0,
    min_stock: product.minStockAlert ?? null,
    description: product.description ?? null,
    category: product.category ?? null,
    barcode: product.barcode ?? null,
    image_url: product.imageUrl ?? null,
    unit: product.unit ?? null,
    location_id: product.location ?? null,
    tags: product.tags ?? null,
    variants: product.variants ?? null,
    stock_by_location: product.stockByLocation ?? null,
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const ProductService = {
  async addProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    _ownerId: string
  ): Promise<string> {
    const created = await api.post<ApiProduct>('/api/v1/products', toApiCreate(product));
    return created.id;
  },

  async bulkAddProducts(
    products: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>,
    _ownerId: string,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ inserted: number }> {
    const total = products.length;
    let inserted = 0;
    for (const p of products) {
      await api.post<ApiProduct>('/api/v1/products', toApiCreate(p));
      inserted++;
      onProgress?.(inserted, total);
    }
    return { inserted };
  },

  async adjustStock(
    id: string,
    adjustment: number,
    reason: 'restock' | 'waste' | 'correction',
    notes?: string
  ): Promise<void> {
    await api.post(`/api/v1/products/${id}/stock`, {
      adjustment,
      reason,
      note: notes ?? null,
    });
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.price !== undefined) body.price = updates.price;
    if (updates.costPrice !== undefined) body.cost = updates.costPrice;
    if (updates.stock !== undefined) body.stock = updates.stock;
    if (updates.minStockAlert !== undefined) body.min_stock = updates.minStockAlert;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.category !== undefined) body.category = updates.category;
    if (updates.barcode !== undefined) body.barcode = updates.barcode;
    if (updates.imageUrl !== undefined) body.image_url = updates.imageUrl;
    if (updates.unit !== undefined) body.unit = updates.unit;
    if (updates.location !== undefined) body.location_id = updates.location;
    if (updates.tags !== undefined) body.tags = updates.tags;
    if (updates.variants !== undefined) body.variants = updates.variants;
    if (updates.stockByLocation !== undefined) body.stock_by_location = updates.stockByLocation;
    await api.patch(`/api/v1/products/${id}`, body);
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/v1/products/${id}`);
  },

  subscribeToProducts(
    _ownerId: string,
    callback: (products: Product[]) => void
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiProduct[]>('/api/v1/products');
        callback(list.map(toProduct));
      } catch { /* silent */ }
    });
  },

  getByLocation(products: Product[], locationId: string): Product[] {
    if (locationId === 'all') return products;
    return products.filter(p => p.location === locationId || !p.location);
  },

  async getProducts(_ownerId: string): Promise<Product[]> {
    const list = await api.get<ApiProduct[]>('/api/v1/products');
    return list.map(toProduct);
  },
};
