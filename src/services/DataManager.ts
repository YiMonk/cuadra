import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const COLLECTIONS_TO_WIPE = [
  'sales', 'products', 'clients', 'categories',
  'cashboxes', 'locations', 'stock_movements',
];

const BATCH_LIMIT = 499;

async function deleteCollection(collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  if (snapshot.empty) return;

  for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    snapshot.docs.slice(i, i + BATCH_LIMIT).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

export const DataManager = {
  // Client-side wipe — works on Spark plan without Cloud Functions.
  // Requires admingod role (enforced by Firestore rules on each delete).
  wipeDatabase: async (callerUid: string) => {
    for (const col of COLLECTIONS_TO_WIPE) {
      await deleteCollection(col);
    }

    // Delete all user documents except the calling admingod
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const others = usersSnapshot.docs.filter(d => d.id !== callerUid);

    for (let i = 0; i < others.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      others.slice(i, i + BATCH_LIMIT).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  },
};
