import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  runTransaction,
  getDocs
} from 'firebase/firestore';         
import { db } from '../config/firebaseConfig';
import { Product } from '../types/inventory';

const PRODUCTS_COLLECTION = 'products';

export const ProductService = {
  // Add a new product
  addProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...product,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding product: ", error);
      throw error;
    }
  },

  // Adjust stock (Restock or Waste)
  adjustStock: async (id: string, adjustment: number, reason: 'restock' | 'waste' | 'correction', notes?: string) => {
      try {
          const productRef = doc(db, PRODUCTS_COLLECTION, id);
          
          await runTransaction(db, async (transaction) => {
              const productDoc = await transaction.get(productRef);
              if (!productDoc.exists()) throw new Error("Product not found");

              const newStock = (productDoc.data().stock || 0) + adjustment;
              
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
          throw error;
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
      throw error;
    }
  },

  // Delete a product
  deleteProduct: async (id: string) => {
    try {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    } catch (error) {
      console.error("Error deleting product: ", error);
      throw error;
    }
  },

  // Subscribe to products list (Real-time)
  subscribeToProducts: (callback: (products: Product[]) => void) => {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      callback(products);
    });
  },

  // Fetch all products (One-time)
  getProducts: async (): Promise<Product[]> => {
    try {
      const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
    } catch (error) {
      console.error("Error fetching products: ", error);
      throw error;
    }
  }
};
