import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  deleteDoc,
  updateDoc,
  where,
  QueryConstraint,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { toServiceError } from '@/lib/errors';

import type { Role } from '@/types/auth';

export interface UserMetadata {
    id: string;
    email: string;
    displayName: string;
    role: Role;
    active: boolean;
    ownerId?: string;
    createdAt: number;
    updatedAt?: number;
    subscriptionEndsAt?: number;
    subscriptionPrice?: number;
    termsAccepted?: boolean;
    onboardingCompletedAt?: number;
    businessName?: string;
    commissionPct?: number;
    defaultLocationId?: string;
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
            throw toServiceError(error);
        }
    },

    /**
     * Trae usuarios. Si `pageSize` se pasa, devuelve solo esa página; si no,
     * pagina internamente con cursor hasta agotar la colección.
     * Para paginación con cursor explícito usar `getUsersPaginated`.
     */
    getUsers: async (options: { pageSize?: number } = {}): Promise<UserMetadata[]> => {
        const { pageSize } = options;
        try {
            if (pageSize !== undefined) {
                const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'), limit(pageSize));
                const snapshot = await getDocs(q);
                return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserMetadata));
            }
            const all: UserMetadata[] = [];
            let lastDoc: DocumentSnapshot | null = null;
            const BATCH = 500;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const page = await UserService.getUsersPaginated({
                    pageSize: BATCH,
                    startAfterDoc: lastDoc ?? undefined,
                });
                if (page.users.length === 0) break;
                all.push(...page.users);
                if (page.users.length < BATCH || !page.lastDoc) break;
                lastDoc = page.lastDoc;
            }
            return all;
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    },

    /**
     * Cursor-based pagination. Devuelve `users` y el último `DocumentSnapshot`
     * para usarse en la siguiente llamada vía `startAfterDoc`.
     */
    getUsersPaginated: async (options: {
        pageSize?: number;
        startAfterDoc?: DocumentSnapshot;
    } = {}): Promise<{ users: UserMetadata[]; lastDoc: DocumentSnapshot | null }> => {
        const { pageSize = 50, startAfterDoc } = options;
        try {
            const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
            if (startAfterDoc) constraints.push(startAfter(startAfterDoc));
            constraints.push(limit(pageSize));
            const snapshot = await getDocs(query(collection(db, USERS_COLLECTION), ...constraints));
            const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserMetadata));
            const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
            return { users, lastDoc };
        } catch (error) {
            console.error("Error fetching users paginated:", error);
            return { users: [], lastDoc: null };
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
            throw toServiceError(error);
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
            throw toServiceError(error);
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
