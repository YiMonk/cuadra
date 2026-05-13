import { initializeApp, deleteApp } from 'firebase/app';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { auth, firebaseConfig, db } from '@/config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { UserService, UserMetadata } from './user.service';

/**
 * AuthService — única capa que envuelve `firebase/auth` para uso desde UI.
 * Componentes/pages deben usar este servicio en lugar de importar `firebase/auth`
 * directamente para mantener separación entre UI y SDK.
 */
export const AuthService = {
  /**
   * Login con email y password. Lanza el error de Firebase para que la UI mapee
   * códigos (auth/wrong-password, auth/invalid-credential, etc.).
   */
  async signIn(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth, email.trim(), password);
  },

  async signOut(): Promise<void> {
    return signOut(auth);
  },

  async sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(auth, email.trim());
  },

  async verifyPasswordResetCode(oobCode: string): Promise<string> {
    return verifyPasswordResetCode(auth, oobCode);
  },

  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
    return confirmPasswordReset(auth, oobCode, newPassword);
  },

  /**
   * Registro de owner nuevo: crea el usuario en Auth, le pone displayName y
   * sincroniza el documento de metadata como `admin` self-owned.
   */
  async registerOwner(params: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<string> {
    const credential = await createUserWithEmailAndPassword(
      auth,
      params.email.trim(),
      params.password
    );
    await updateProfile(credential.user, { displayName: params.displayName.trim() });
    await UserService.syncUserMetadata(credential.user.uid, {
      id: credential.user.uid,
      displayName: params.displayName.trim(),
      email: params.email.trim(),
      role: 'admin',
      ownerId: credential.user.uid,
      active: true,
      createdAt: Date.now(),
      termsAccepted: false,
    } as UserMetadata);
    return credential.user.uid;
  },

  /**
   * Crea un miembro `staff` para un owner sin desconectar la sesión actual.
   * Usa una app Firebase secundaria que se destruye inmediatamente después.
   */
  async createStaffMember(params: {
    email: string;
    password: string;
    displayName: string;
    ownerId: string;
    role?: import('@/types/auth').Role;
  }): Promise<string> {
    const secondaryAppName = `staff-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = (await import('firebase/auth')).getAuth(secondaryApp);
    try {
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        params.email.trim(),
        params.password
      );
      await updateProfile(credential.user, { displayName: params.displayName });
      await setDoc(doc(db, 'users', credential.user.uid), {
        id: credential.user.uid,
        email: params.email.trim(),
        displayName: params.displayName,
        role: params.role ?? 'cashier',
        ownerId: params.ownerId,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return credential.user.uid;
    } finally {
      await signOut(secondaryAuth).catch(() => {});
      await deleteApp(secondaryApp).catch(() => {});
    }
  },

  /** Actualiza displayName del usuario actual. */
  async updateCurrentUserProfile(currentUser: FirebaseUser, displayName: string): Promise<void> {
    return updateProfile(currentUser, { displayName });
  },

  /** Envía email de verificación antes de cambiar el correo del usuario actual. */
  async verifyBeforeUpdateEmail(currentUser: FirebaseUser, newEmail: string): Promise<void> {
    return verifyBeforeUpdateEmail(currentUser, newEmail);
  },

  /** Cambia el password del usuario actual (requiere reauth reciente). */
  async updateCurrentUserPassword(currentUser: FirebaseUser, newPassword: string): Promise<void> {
    return updatePassword(currentUser, newPassword);
  },

  /** Re-autentica al usuario con su password actual. */
  async reauthenticateWithPassword(currentUser: FirebaseUser, password: string): Promise<void> {
    if (!currentUser.email) throw new Error('Usuario sin email asociado');
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  },
};
