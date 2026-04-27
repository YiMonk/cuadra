import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Admin operations (F1-03)
export { wipeDatabase } from './admin';

// Team management (F1-04)
export { createStaffMember, deleteStaffMember } from './team';

// Custom Claims sync (F4-02)
export { syncUserClaims } from './onUserWrite';
