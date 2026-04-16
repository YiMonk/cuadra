import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const ConfigService = {
  /**
   * Subscribes to the application configuration in Firestore.
   * Path: app_config/version
   * Expects a document with a 'latest' field (string).
   */
  subscribeToVersion: (callback: (latestVersion: string) => void) => {
    const versionDocRef = doc(db, 'app_config', 'version');
    
    return onSnapshot(versionDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.latest) {
          callback(data.latest);
        }
      }
    }, (error) => {
      console.error("Error monitoring app version:", error);
    });
  }
};
