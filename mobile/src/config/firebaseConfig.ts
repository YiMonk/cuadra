import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your Firebase project configuration
// You can find these values in the Firebase Console: Project Settings > General > Your apps
const firebaseConfig = {
   apiKey: "AIzaSyD_jNJs7O6jevUsJiSg4cSD_WeaxS5NxVA",
  authDomain: "cuadra-bf832.firebaseapp.com",
  projectId: "cuadra-bf832",
  storageBucket: "cuadra-bf832.firebasestorage.app",
  messagingSenderId: "208847202044",
  appId: "1:208847202044:web:46803c98dccdb5307d9979",
  measurementId: "G-VKVPWXTJKZ"
};

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
