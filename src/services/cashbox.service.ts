import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  getDocs,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface Cashbox {
  id: string;
  name: string;
  active: boolean;
  createdAt: number;
}

const CASHBOXES_COLLECTION = 'cashboxes';

export const CashboxService = {
  // Create a new cashbox
  addCashbox: async (name: string) => {
    try {
      const docRef = await addDoc(collection(db, CASHBOXES_COLLECTION), {
        name,
        active: true,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding cashbox: ", error);
      throw error;
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
      throw error;
    }
  },

  // Delete a cashbox
  deleteCashbox: async (id: string) => {
    try {
      await deleteDoc(doc(db, CASHBOXES_COLLECTION, id));
      return true;
    } catch (error) {
      console.error("Error deleting cashbox: ", error);
      throw error;
    }
  },

  // Get all cashboxes
  getCashboxes: async () => {
    try {
      const q = query(collection(db, CASHBOXES_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cashbox));
    } catch (error) {
      console.error("Error getting cashboxes: ", error);
      return [];
    }
  },

  // Subscribe to cashboxes
  subscribeToCashboxes: (callback: (cashboxes: Cashbox[]) => void) => {
    const q = query(collection(db, CASHBOXES_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const cashboxes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Cashbox));
      callback(cashboxes);
    });
  }
};
