import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { ActivityLog } from '../types/activity';

const ACTIVITIES_COLLECTION = 'admin_activities';

export const ActivityService = {
    // Log a new administrative action
    logAction: async (log: Omit<ActivityLog, 'id' | 'createdAt'>) => {
        try {
            await addDoc(collection(db, ACTIVITIES_COLLECTION), {
                ...log,
                createdAt: Date.now()
            });
        } catch (error) {
            console.error("Error logging administrative action:", error);
        }
    },

    // Get all activities (Global Log)
    getAllActivities: async (): Promise<ActivityLog[]> => {
        try {
            const q = query(
                collection(db, ACTIVITIES_COLLECTION), 
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
        } catch (error) {
            console.error("Error fetching global activities:", error);
            return [];
        }
    },

    // Get activities related to a specific user
    getUserHistory: async (userId: string): Promise<ActivityLog[]> => {
        try {
            const q = query(
                collection(db, ACTIVITIES_COLLECTION), 
                where('targetUserId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
        } catch (error) {
            console.error("Error fetching user history:", error);
            return [];
        }
    },

    // Subscribe to real-time global activities
    subscribeToGlobalLog: (callback: (logs: ActivityLog[]) => void) => {
        const q = query(
            collection(db, ACTIVITIES_COLLECTION),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(
            q,
            (snapshot) => {
                const logs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ActivityLog));
                callback(logs);
            },
            (error) => {
                console.error('Error en subscribeToGlobalLog:', error);
            }
        );
    }
};
