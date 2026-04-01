export interface Product {
  id: string; // Firestore ID
  name: string;
  price: number; // Base price in USD
  stock: number;
  minStockAlert: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  unit?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  stock: number;
  priceModifier?: number;
  sku?: string;
}
