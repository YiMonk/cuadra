export interface Product {
  id: string; // Firestore ID
  name: string;
  price: number; // Base price in USD
  stock: number;
  minStockAlert: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  unit?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}
