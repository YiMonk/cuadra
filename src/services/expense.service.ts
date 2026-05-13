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
import { Expense } from '@/types/expense';

const COLLECTION = 'expenses';

export const ExpenseService = {
  async createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...expense,
        createdAt: Date.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw toServiceError(error);
    }
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION, id), updates);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw toServiceError(error);
    }
  },

  async deleteExpense(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw toServiceError(error);
    }
  },

  async getExpenses(
    ownerId: string,
    options: { startDate?: number; endDate?: number } = {}
  ): Promise<Expense[]> {
    try {
      const constraints = [where('ownerId', '==', ownerId), orderBy('paidAt', 'desc')];
      const q = query(collection(db, COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      let expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
      if (options.startDate !== undefined) expenses = expenses.filter(e => e.paidAt >= options.startDate!);
      if (options.endDate !== undefined) expenses = expenses.filter(e => e.paidAt <= options.endDate!);
      return expenses;
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  },

  subscribeToExpenses(ownerId: string, callback: (expenses: Expense[]) => void): () => void {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      orderBy('paidAt', 'desc')
    );
    return onSnapshot(
      q,
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense))),
      error => console.error('Error in subscribeToExpenses:', error)
    );
  },
};
