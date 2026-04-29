import {
  collection,
  getDocs,
  writeBatch,
  query,
  where,
  doc,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const COLLECTIONS = [
  'products',
  'sales',
  'clients',
  'categories',
  'cashboxes',
  'locations',
  'stock_movements',
];

export type MigrationResult = {
  collection: string;
  stamped: number;
};

// Stamps all documents missing ownerId in each collection with the given ownerId.
// Safe to run multiple times — only touches docs without the field.
export async function stampLegacyDocuments(ownerId: string): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const col of COLLECTIONS) {
    // Firestore has no "field does not exist" filter, so fetch ALL docs and filter client-side.
    // Collections are small enough (< 10k docs per owner) that this is fine.
    const snapshot = await getDocs(collection(db, col));
    const legacy = snapshot.docs.filter(d => !d.data().ownerId);

    if (legacy.length === 0) {
      results.push({ collection: col, stamped: 0 });
      continue;
    }

    const BATCH_LIMIT = 499;
    for (let i = 0; i < legacy.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      legacy.slice(i, i + BATCH_LIMIT).forEach(d => {
        batch.update(doc(db, col, d.id), { ownerId });
      });
      await batch.commit();
    }

    results.push({ collection: col, stamped: legacy.length });
  }

  return results;
}
