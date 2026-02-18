import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface UserMetadata {
    id: string;
    email: string;
    displayName: string;
    role: 'admin' | 'staff';
    active: boolean;
    createdAt: number;
}

const USERS_COLLECTION = 'users';

export const UserService = {
    // Sync or create user metadata
    syncUserMetadata: async (uid: string, data: Partial<UserMetadata>) => {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            await setDoc(userRef, {
                ...data,
                updatedAt: Date.now()
            }, { merge: true });
        } catch (error) {
            console.error("Error syncing user metadata:", error);
        }
    },

    // Get all users
    getUsers: async (): Promise<UserMetadata[]> => {
        try {
            const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserMetadata));
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    },

    // Subscribe to users
    subscribeToUsers: (callback: (users: UserMetadata[]) => void) => {
        const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserMetadata));
            callback(users);
        });
    },

    // Update user role or status
    updateUser: async (uid: string, updates: Partial<UserMetadata>) => {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            await updateDoc(userRef, updates);
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    // Delete user from metadata (Note: This doesn't delete from Auth)
    deleteUserMetadata: async (uid: string) => {
        try {
            await deleteDoc(doc(db, USERS_COLLECTION, uid));
        } catch (error) {
            console.error("Error deleting user metadata:", error);
            throw error;
        }
    }
};
