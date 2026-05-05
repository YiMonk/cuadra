import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface UserMetadata {
    id: string;
    email: string;
    displayName: string;
    role: 'admingod' | 'admin' | 'owner' | 'staff';
    active: boolean;
    ownerId?: string;
    createdAt: number;
    updatedAt?: number;
    subscriptionEndsAt?: number;
    subscriptionPrice?: number;
    termsAccepted?: boolean;
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

    // Get a single user by ID
    getUserById: async (uid: string): Promise<UserMetadata | null> => {
        try {
            const userRef = doc(db, USERS_COLLECTION, uid);
            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                return { 
                    id: docSnap.id, 
                    ...docSnap.data() 
                } as UserMetadata;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user:", error);
            throw error;
        }
    },

    // Get all users
    getUsers: async (): Promise<UserMetadata[]> => {
        try {
            const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as UserMetadata));
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    },

    // Subscribe to users
    subscribeToUsers: (callback: (users: UserMetadata[]) => void) => {
        const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
        return onSnapshot(
            q,
            (snapshot) => {
                const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserMetadata));
                callback(users);
            },
            (error) => {
                console.error('Error en subscribeToUsers:', error);
            }
        );
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

    // Get team members for a specific owner
    getTeamMembers: async (ownerId: string): Promise<UserMetadata[]> => {
        try {
            const q = query(
                collection(db, USERS_COLLECTION), 
                where('ownerId', '==', ownerId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as UserMetadata));
        } catch (error) {
            console.error("Error fetching team members:", error);
            return [];
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
    },

    // Subscribe to team members for a specific owner
    subscribeToTeam: (ownerId: string, callback: (members: UserMetadata[]) => void) => {
        const q = query(
            collection(db, USERS_COLLECTION),
            where('ownerId', '==', ownerId),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(
            q,
            (snapshot) => {
                const members = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as UserMetadata));
                callback(members);
            },
            (error) => {
                console.error('Error en subscribeToTeam:', error);
            }
        );
    }
};
