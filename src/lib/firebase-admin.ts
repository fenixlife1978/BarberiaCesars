import { initializeApp, getApps, App, type Credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdminConfig } from '@/firebase/admin-config';

let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: {
      projectId: firebaseAdminConfig.projectId,
      clientEmail: firebaseAdminConfig.clientEmail,
      privateKey: firebaseAdminConfig.privateKey,
    } as Credential,
  });
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

export { adminApp, db };
