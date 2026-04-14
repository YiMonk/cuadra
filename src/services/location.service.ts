import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface Location {
  id: string;
  name: string;
  active: boolean;
  createdAt: number;
}

const LOCATIONS_COLLECTION = 'locations';

export const LocationService = {
  // Create a new location
  addLocation: async (name: string) => {
    try {
      const docRef = await addDoc(collection(db, LOCATIONS_COLLECTION), {
        name,
        active: true,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding location: ", error);
      throw error;
    }
  },

  // Update a location
  updateLocation: async (id: string, updates: Partial<Location>) => {
    try {
      const docRef = doc(db, LOCATIONS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error("Error updating location: ", error);
      throw error;
    }
  },

  // Delete a location
  deleteLocation: async (id: string) => {
    try {
      await deleteDoc(doc(db, LOCATIONS_COLLECTION, id));
      return true;
    } catch (error) {
      console.error("Error deleting location: ", error);
      throw error;
    }
  },

  // Get all locations
  getLocations: async () => {
    try {
      const q = query(collection(db, LOCATIONS_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    } catch (error) {
      console.error("Error getting locations: ", error);
      return [];
    }
  },

  // Subscribe to locations
  subscribeToLocations: (callback: (locations: Location[]) => void) => {
    const q = query(collection(db, LOCATIONS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Location));
      callback(locations);
    });
  }
};
