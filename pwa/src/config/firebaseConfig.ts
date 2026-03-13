import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
  auth = getAuth(app);
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
