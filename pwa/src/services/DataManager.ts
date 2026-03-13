import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { UserService } from './user.service';

export const DataManager = {
    /**
     * Wipes the entire database except for the current AdminGod user.
     * @param adminGodId The ID of the current AdminGod user to preserve.
     */
    wipeDatabase: async (adminGodId: string) => {
        try {
            const collections = ['sales', 'products', 'clients', 'users'];
            const batchSize = 400; // Firestore batch limit is 500

            for (const colName of collections) {
                const colRef = collection(db, colName);
                const snapshot = await getDocs(colRef);
                
                if (snapshot.empty) continue;

                // Create batches
                let batch = writeBatch(db);
                let count = 0;

                for (const document of snapshot.docs) {
                    // Safety check: NEVER delete the current AdminGod
                    if (colName === 'users' && document.id === adminGodId) {
                        console.log(`Preserving AdminGod: ${document.id}`);
                        continue;
                    }

                    batch.delete(doc(db, colName, document.id));
                    count++;

                    if (count >= batchSize) {
                        await batch.commit();
                        batch = writeBatch(db);
                        count = 0;
                    }
                }

                if (count > 0) {
                    await batch.commit();
                }
            }
            
            console.log('Database wiped successfully (AdminGod preserved).');
            return true;
        } catch (error) {
            console.error('Error wiping database:', error);
            throw error;
        }
    }
};
