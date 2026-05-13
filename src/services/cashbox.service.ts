import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  orderBy,
  onSnapshot,
  where
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { toServiceError } from '@/lib/errors';
import { Cashbox } from '../types/cashbox';

export type { Cashbox };

const CASHBOXES_COLLECTION = 'cashboxes';

export const CashboxService = {
  // Create a new cashbox
  addCashbox: async (name: string, ownerId: string) => {
    try {
      const docRef = await addDoc(collection(db, CASHBOXES_COLLECTION), {
        name,
        ownerId,
        active: true,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding cashbox: ", error);
      throw toServiceError(error);
    }
  },

  // Update a cashbox
  updateCashbox: async (id: string, updates: Partial<Cashbox>) => {
    try {
      const docRef = doc(db, CASHBOXES_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error("Error updating cashbox: ", error);
      throw toServiceError(error);
    }
  },

  // Delete a cashbox
  deleteCashbox: async (id: string) => {
    try {
      await deleteDoc(doc(db, CASHBOXES_COLLECTION, id));
      return true;
    } catch (error) {
      console.error("Error deleting cashbox: ", error);
      throw toServiceError(error);
    }
  },

  // Get all cashboxes
  getCashboxes: async (ownerId: string) => {
    try {
      const q = query(
        collection(db, CASHBOXES_COLLECTION),
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cashbox));
    } catch (error) {
      console.error("Error getting cashboxes: ", error);
      return [];
    }
  },

  // Subscribe to cashboxes
  subscribeToCashboxes: (ownerId: string, callback: (cashboxes: Cashbox[]) => void) => {
    const q = query(
      collection(db, CASHBOXES_COLLECTION),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const cashboxes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Cashbox));
        callback(cashboxes);
      },
      (error) => {
        console.error('Error en subscribeToCashboxes:', error);
      }
    );
  },

  // Get cashbox balance for a date range
  getCashboxBalance: async (cashboxId: string, startDate: number, endDate: number) => {
    try {
      const q = query(
        collection(db, 'sales'),
        where('cashboxId', '==', cashboxId),
        where('status', '==', 'paid'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      const snapshot = await getDocs(q);
      const sales = snapshot.docs.map(d => d.data());
      const total = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
      const byMethod = sales.reduce((acc, s) => {
        const m = s.paymentMethod as string;
        acc[m] = (acc[m] || 0) + (Number(s.total) || 0);
        return acc;
      }, {} as Record<string, number>);
      return { total, count: sales.length, byPaymentMethod: byMethod };
    } catch (error) {
      console.error('Error getting cashbox balance:', error);
      throw toServiceError(error);
    }
  }
};
