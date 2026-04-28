import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  where,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Client } from '../types/client';

const CLIENTS_COLLECTION = 'clients';

export const ClientService = {
  // Add a new client
  addClient: async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>, ownerId: string) => {
    try {
      const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
        ...client,
        ownerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding client: ", error);
      throw error;
    }
  },

  // Update a client
  updateClient: async (id: string, updates: Partial<Client>) => {
    try {
      const clientRef = doc(db, CLIENTS_COLLECTION, id);
      await updateDoc(clientRef, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error updating client: ", error);
      throw error;
    }
  },

  // Soft-delete a client — blocks if client has pending debts
  deleteClient: async (id: string) => {
    try {
      const pendingQ = query(
        collection(db, 'sales'),
        where('clientId', '==', id),
        where('status', '==', 'pending'),
        limit(1)
      );
      const pending = await getDocs(pendingQ);
      if (!pending.empty) {
        throw new Error('No se puede eliminar un cliente con deudas pendientes. Salda la deuda primero.');
      }
      await updateDoc(doc(db, CLIENTS_COLLECTION, id), {
        active: false,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error deleting client: ", error);
      throw error;
    }
  },

  getClientById: async (id: string) => {
    try {
        const docRef = doc(db, CLIENTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Client;
        }
        return null;
    } catch (error) {
        console.error("Error getting client: ", error);
        return null;
    }
  },

  // Subscribe to clients list
  subscribeToClients: (ownerId: string, callback: (clients: Client[]) => void) => {
    const q = query(
      collection(db, CLIENTS_COLLECTION),
      where('ownerId', '==', ownerId),
      orderBy('name')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const clients = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Client))
          .filter(c => c.active !== false);
        callback(clients);
      },
      (error) => {
        console.error('Error en subscribeToClients:', error);
      }
    );
  },

  // Search clients by name (Simple client-side filter approximation for now or direct query)
  // For small DB, client-side filtering is efficient.
};
