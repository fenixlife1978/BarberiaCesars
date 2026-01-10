import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { firebaseAdminConfig } from '@/firebase/admin-config';
import type { UserRecord } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({
    credential: {
      projectId: firebaseAdminConfig.projectId,
      clientEmail: firebaseAdminConfig.clientEmail,
      privateKey: firebaseAdminConfig.privateKey,
    },
  });
} else {
  adminApp = getApps()[0];
}

export async function getAuthenticatedUser(): Promise<UserRecord | null> {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedIdToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    const user = await getAuth(adminApp).getUser(decodedIdToken.uid);
    return user;
  } catch (error) {
    return null;
  }
}
