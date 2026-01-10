import { getAuth, type UserRecord } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { firebaseAdminConfig } from '@/firebase/admin-config';
import { getFirestore } from 'firebase-admin/firestore';

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

const db = getFirestore(adminApp);

export type AuthenticatedUser = UserRecord & {
  role?: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedIdToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    const authUser = await getAuth(adminApp).getUser(decodedIdToken.uid);

    // Get user profile from Firestore to check for role
    const userDoc = await db.collection('users').doc(authUser.uid).get();
    const userData = userDoc.data();

    return {
      ...authUser,
      role: userData?.role,
    };
  } catch (error) {
    return null;
  }
}
