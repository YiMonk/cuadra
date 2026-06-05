export interface Product {
  id: string; // Firestore ID
  name: string;
  price: number; // Base price in USD
  costPrice?: number; // Cost per unit in USD (margin = price - costPrice)
  stock: number; // Stock total (legacy) — autoritativo si stockByLocation no está presente
  stockByLocation?: Record<string, number>; // locationId → unidades. Si existe, es la fuente de verdad.
  minStockAlert: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  unit?: string;
  tags?: string[];
  barcode?: string;
  createdAt: number;
  updatedAt: number;
  variants?: ProductVariant[];
  location?: string; // Legacy: sucursal "principal" del producto
  active?: boolean;
  deletedAt?: number;
  ownerId?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  stock: number;
  priceModifier?: number;
  sku?: string;
}
