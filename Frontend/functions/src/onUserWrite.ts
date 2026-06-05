import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

/**
 * F4-02 — syncUserClaims
 * Sincroniza los Custom Claims del JWT de Firebase Auth cuando cambia el documento
 * de usuario en Firestore. Esto elimina el need de hacer un get() en cada
 * Security Rule, reduciendo lecturas cobradas.
 *
 * Una vez desplegada esta función, las Security Rules pueden usar:
 *   request.auth.token.role
 *   request.auth.token.ownerId
 * en lugar de get(/databases/$(database)/documents/users/$(request.auth.uid))
 */
export const syncUserClaims = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;

    // Document deleted — clear claims
    if (!change.after.exists) {
      await admin.auth().setCustomUserClaims(userId, null);
      return;
    }

    const data = change.after.data();
    if (!data) return;

    // Only sync if role or ownerId changed
    const before = change.before.data();
    if (
      before &&
      before.role === data.role &&
      before.ownerId === data.ownerId &&
      before.active === data.active
    ) {
      return; // No relevant change
    }

    await admin.auth().setCustomUserClaims(userId, {
      role: data.role,
      ownerId: data.ownerId ?? userId,
      active: data.active ?? true,
    });
  });
