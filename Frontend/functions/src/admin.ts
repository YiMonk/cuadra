import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

/**
 * F1-03 — wipeDatabase
 * Ejecuta un borrado completo de las colecciones de datos operativos.
 * Solo puede ser invocada por un usuario con role = 'admingod' (Custom Claim).
 */
export const wipeDatabase = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida');
  }

  // Verify the caller has admingod role via Custom Claims
  const claims = context.auth.token;
  if (claims['role'] !== 'admingod') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo AdminGod puede ejecutar esta operación'
    );
  }

  const db = admin.firestore();
  const BATCH_SIZE = 400;

  // Collections to wipe — users is preserved (except non-admingod entries)
  const collectionsToClear = ['sales', 'products', 'clients', 'categories', 'cashboxes', 'locations', 'stock_movements'];

  for (const colName of collectionsToClear) {
    const snapshot = await db.collection(colName).get();
    if (snapshot.empty) continue;

    let batch = db.batch();
    let count = 0;

    for (const docSnap of snapshot.docs) {
      batch.delete(docSnap.ref);
      count++;

      if (count >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) await batch.commit();
  }

  // For users: delete everyone except the calling admingod
  const usersSnapshot = await db.collection('users').get();
  let userBatch = db.batch();
  let userCount = 0;

  for (const docSnap of usersSnapshot.docs) {
    if (docSnap.id === context.auth.uid) continue; // Preserve caller
    userBatch.delete(docSnap.ref);
    userCount++;

    if (userCount >= BATCH_SIZE) {
      await userBatch.commit();
      userBatch = db.batch();
      userCount = 0;
    }
  }

  if (userCount > 0) await userBatch.commit();

  return { success: true, message: 'Base de datos limpiada correctamente' };
});
