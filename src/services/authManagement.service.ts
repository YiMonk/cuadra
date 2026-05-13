import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/config/firebaseConfig';
import { UserService, UserMetadata } from './user.service';

export const AuthManagementService = {
  /**
   * Creates a new Firebase Auth user without signing out the current admin session.
   * Uses a secondary Firebase app instance that gets cleaned up immediately after.
   */
  async createUser(params: {
    email: string;
    password: string;
    displayName: string;
    subscriptionDays: number;
    subscriptionPrice: number;
  }): Promise<string> {
    const secondaryAppName = `admin-reg-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    try {
      const secondaryAuth = getAuth(secondaryApp);
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        params.email.trim(),
        params.password
      );
      const uid = credential.user.uid;
      const subscriptionEndsAt = Date.now() + params.subscriptionDays * 24 * 60 * 60 * 1000;

      await UserService.syncUserMetadata(uid, {
        id: uid,
        displayName: params.displayName,
        email: params.email.trim(),
        role: 'owner',
        active: true,
        ownerId: uid,
        subscriptionEndsAt,
        subscriptionPrice: params.subscriptionPrice,
        createdAt: Date.now(),
      } as UserMetadata);

      return uid;
    } finally {
      await deleteApp(secondaryApp);
    }
  },

  async deleteUser(uid: string): Promise<void> {
    await UserService.deleteUserMetadata(uid);
    // Firebase Auth profile deletion requires Admin SDK (server-side).
    // The Auth record is orphaned but blocked by active: false / missing metadata.
  },
};
