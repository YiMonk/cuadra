import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase - this is safe as it checks if already initialized
const initializeFirebaseIfNeeded = () => {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } else {
      app = getApp();
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (error) {
    // Silently fail during build if Firebase is not available
    console.debug('Firebase initialization skipped during build');
  }
};

// Initialize on first import if in browser or if apps are already loaded
if (typeof window !== 'undefined' || getApps().length > 0) {
  initializeFirebaseIfNeeded();
}

export { auth, db, initializeFirebaseIfNeeded };
export const storage = getApps().length > 0 ? getStorage(getApp()) : (null as any);
