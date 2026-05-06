import { db } from '@/config/firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { CashClosing } from '@/types/cashClosing';
import { Sale } from '@/types/sales';
import { SalesService } from './sales.service';

export class CashClosingService {
  private static COLLECTION = 'cashClosings';

  static async createClosing(data: Omit<CashClosing, 'id'>): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...data,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating cash closing:', error);
      throw error;
    }
  }

  static subscribeToClosings(
    ownerId: string,
    callback: (closings: (CashClosing & { id: string })[]) => void
  ): () => void {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('ownerId', '==', ownerId),
        orderBy('closedAt', 'desc')
      );

      return onSnapshot(q, (snap) => {
        const closings = snap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as (CashClosing & { id: string })[];
        callback(closings);
      });
    } catch (error) {
      console.error('Error subscribing to closings:', error);
      return () => {};
    }
  }

  static async getSalesForClosing(
    ownerId: string,
    options: {
      cashboxIds: string[];
      includesUnassigned: boolean;
      from: number;
      to: number;
    }
  ): Promise<Sale[]> {
    try {
      const allSales = await SalesService.getAllSales(ownerId);

      return allSales.filter((sale) => {
        if (sale.status === 'cancelled') return false;
        if (sale.createdAt < options.from || sale.createdAt > options.to) return false;

        if (options.cashboxIds.length === 0 && !options.includesUnassigned) {
          return false;
        }

        const hasCashbox = options.cashboxIds.length > 0 && options.cashboxIds.includes(sale.cashboxId || '');
        const isUnassigned = !sale.cashboxId && options.includesUnassigned;

        return hasCashbox || isUnassigned;
      });
    } catch (error) {
      console.error('Error getting sales for closing:', error);
      return [];
    }
  }

  static async getLastClosingToday(ownerId: string): Promise<(CashClosing & { id: string }) | null> {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = Date.now();

      const q = query(
        collection(db, this.COLLECTION),
        where('ownerId', '==', ownerId),
        where('closedAt', '>=', startOfToday.getTime()),
        where('closedAt', '<=', endOfToday),
        orderBy('closedAt', 'desc')
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      return {
        ...snapshot.docs[0].data(),
        id: snapshot.docs[0].id,
      } as CashClosing & { id: string };
    } catch (error) {
      console.error('Error getting last closing today:', error);
      return null;
    }
  }
}
