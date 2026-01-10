import { getAuth, type UserRecord } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { adminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

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
    const auth = getAuth(adminApp);
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    const authUser = await auth.getUser(decodedIdToken.uid);

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
