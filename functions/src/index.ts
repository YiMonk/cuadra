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

// ─── Email digest diario (Fase 4.3) ─────────────────────────────────────────
// Desactivado hasta upgrade del proyecto a plan Blaze. Para activar:
//   1. Upgrade: https://console.firebase.google.com/project/cuadra-bf832/usage/details
//   2. Subir secret:
//        printf "TU_APP_PASSWORD" | firebase functions:secrets:set GMAIL_APP_PASSWORD --data-file -
//   3. Descomentar la siguiente línea
//   4. Deploy: firebase deploy --only functions:dailyDigest
// export { dailyDigest } from './dailyDigest';
