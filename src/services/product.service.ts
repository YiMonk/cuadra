import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  runTransaction,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { toServiceError } from '@/lib/errors';
import { Product } from '../types/inventory';

const PRODUCTS_COLLECTION = 'products';

export const ProductService = {
  // Add a new product
  addProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, ownerId: string) => {
    try {
      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...product,
        ownerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding product: ", error);
      throw toServiceError(error);
    }
  },

  // Adjust stock (Restock or Waste)
  adjustStock: async (id: string, adjustment: number, reason: 'restock' | 'waste' | 'correction', notes?: string) => {
      try {
          const productRef = doc(db, PRODUCTS_COLLECTION, id);
          
          await runTransaction(db, async (transaction) => {
              const productDoc = await transaction.get(productRef);
              if (!productDoc.exists()) throw new Error("Product not found");

              const currentStock = productDoc.data().stock || 0;
              const newStock = currentStock + adjustment;

              if (newStock < 0) {
                  throw new Error(
                      `Ajuste inválido: el stock resultante sería ${newStock}. Stock actual: ${currentStock}`
                  );
              }

              // 1. Update Product Stock
              transaction.update(productRef, {
                  stock: newStock,
                  updatedAt: Date.now()
              });

              // 2. Log Movement (Optional but recommended for traceability)
              const movementRef = doc(collection(db, 'stock_movements'));
              transaction.set(movementRef, {
                  productId: id,
                  productName: productDoc.data().name,
                  adjustment,
                  reason,
                  notes,
                  createdAt: Date.now()
              });
          });
      } catch (error) {
          console.error("Error adjusting stock: ", error);
          throw toServiceError(error);
      }
  },

  // Update an existing product
  updateProduct: async (id: string, updates: Partial<Product>) => {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error updating product: ", error);
      throw toServiceError(error);
    }
  },

  // Soft-delete a product
  deleteProduct: async (id: string) => {
    try {
      await updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
        active: false,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error deleting product: ", error);
      throw toServiceError(error);
    }
  },

  // Subscribe to products list (Real-time)
  subscribeToProducts: (ownerId: string, callback: (products: Product[]) => void) => {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('ownerId', '==', ownerId),
      orderBy('name')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const products = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.active !== false);
        callback(products);
      },
      (error) => {
        console.error('Error en subscribeToProducts:', error);
      }
    );
  },

  getByLocation: (products: Product[], locationId: string): Product[] => {
    if (locationId === 'all') return products;
    return products.filter(p => p.location === locationId || !p.location);
  },

  // Fetch all products (One-time)
  getProducts: async (ownerId: string): Promise<Product[]> => {
    try {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where('ownerId', '==', ownerId),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
    } catch (error) {
      console.error("Error fetching products: ", error);
      throw toServiceError(error);
    }
  }
};
