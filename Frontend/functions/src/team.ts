import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

interface CreateStaffData {
  email: string;
  password: string;
  displayName: string;
}

/**
 * F1-04 — createStaffMember
 * Crea un usuario de Firebase Auth + documento en Firestore sin desloguear al owner.
 * Solo puede ser invocada por un usuario con role = 'owner'.
 */
export const createStaffMember = functions.https.onCall(
  async (data: CreateStaffData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida');
    }

    const callerDoc = await admin
      .firestore()
      .collection('users')
      .doc(context.auth.uid)
      .get();

    const callerRole = callerDoc.data()?.role;
    if (callerRole !== 'owner') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Solo los owners pueden crear miembros del equipo'
      );
    }

    const { email, password, displayName } = data;

    if (!email || !password || !displayName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'email, password y displayName son requeridos'
      );
    }

    // Create Auth user (server-side, does NOT sign in the owner)
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Create Firestore document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      displayName,
      role: 'staff',
      ownerId: context.auth.uid,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Assign Custom Claims so Security Rules can use request.auth.token.role
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'staff',
      ownerId: context.auth.uid,
    });

    return { uid: userRecord.uid };
  }
);

/**
 * deleteStaffMember
 * Elimina un usuario de Firebase Auth + su documento en Firestore.
 * Solo puede ser invocada por el owner del staff.
 */
export const deleteStaffMember = functions.https.onCall(
  async (data: { uid: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Autenticación requerida');
    }

    const { uid } = data;
    if (!uid) {
      throw new functions.https.HttpsError('invalid-argument', 'uid es requerido');
    }

    // Verify the target user belongs to the calling owner
    const targetDoc = await admin.firestore().collection('users').doc(uid).get();
    const targetData = targetDoc.data();

    if (!targetData) {
      throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
    }

    if (targetData.ownerId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'No tienes permiso para eliminar este usuario'
      );
    }

    // Delete from Auth and Firestore
    await admin.auth().deleteUser(uid);
    await admin.firestore().collection('users').doc(uid).delete();

    return { success: true };
  }
);
