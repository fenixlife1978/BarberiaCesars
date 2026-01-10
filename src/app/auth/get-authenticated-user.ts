import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';

/**
 * Gets the authenticated user from the session cookie.
 * To be used in Server Components.
 * @returns The user object or null if not authenticated.
 */
export async function getAuthenticatedUser() {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedIdToken = await getAuth().verifySessionCookie(sessionCookie, true);
        return decodedIdToken;
    } catch (error) {
        console.log('Could not verify session cookie: ', error);
        return null;
    }
}
