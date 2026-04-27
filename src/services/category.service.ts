import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Category } from '../types/category';

const CATEGORIES_COLLECTION = 'categories';

export const CategoryService = {
  
  // Add Category
  addCategory: async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>, ownerId: string) => {
    try {
      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
        ...category,
        ownerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding category: ", error);
      throw error;
    }
  },

  // Update Category
  updateCategory: async (id: string, updates: Partial<Category>) => {
    try {
      const catRef = doc(db, CATEGORIES_COLLECTION, id);
      await updateDoc(catRef, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error updating category: ", error);
      throw error;
    }
  },

  // Delete Category
  deleteCategory: async (id: string) => {
    try {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    } catch (error) {
      console.error("Error deleting category: ", error);
      throw error;
    }
  },

  // Get Categories (Real-time)
  subscribeToCategories: (ownerId: string, callback: (categories: Category[]) => void) => {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('ownerId', '==', ownerId),
      orderBy('name')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const categories = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        callback(categories);
      },
      (error) => {
        console.error('Error en subscribeToCategories:', error);
      }
    );
  },

  // Get Categories (One-time)
  getCategories: async (ownerId: string): Promise<Category[]> => {
    try {
      const q = query(
        collection(db, CATEGORIES_COLLECTION),
        where('ownerId', '==', ownerId),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));
    } catch (error) {
      console.error("Error fetching categories: ", error);
      return [];
    }
  }
};
