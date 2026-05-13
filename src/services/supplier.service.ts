import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { toServiceError } from '@/lib/errors';
import { Supplier } from '@/types/supplier';

const COLLECTION = 'suppliers';

export const SupplierService = {
  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...supplier,
        createdAt: Date.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw toServiceError(error);
    }
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION, id), { ...updates, updatedAt: Date.now() });
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw toServiceError(error);
    }
  },

  async deleteSupplier(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw toServiceError(error);
    }
  },

  async getSuppliers(ownerId: string): Promise<Supplier[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('ownerId', '==', ownerId),
        orderBy('name', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  },

  subscribeToSuppliers(ownerId: string, callback: (suppliers: Supplier[]) => void): () => void {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      orderBy('name', 'asc')
    );
    return onSnapshot(
      q,
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier))),
      error => console.error('Error in subscribeToSuppliers:', error)
    );
  },
};
