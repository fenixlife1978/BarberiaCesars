
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const PROTECTED_ROUTES = ['/impuestos', '/licencias-economicas', '/ajustes', '/reportes'];
const PUBLIC_ROUTES = ['/login', '/signup'];

// Initialize Firebase Admin SDK
try {
    if (!getApps().length) {
        const serviceAccount = JSON.parse(
            Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64!, 'base64').toString('ascii')
        );
        initializeApp({
            credential: cert(serviceAccount),
        });
    }
} catch (e) {
    console.error('Firebase Admin initialization error in middleware:', e);
}


async function checkAuth(request: NextRequest) {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        // Verify the session cookie. In this case an additional check is added to detect
        // if the user's Firebase session was revoked, user deleted/disabled, etc.
        const decodedIdToken = await getAuth().verifySessionCookie(sessionCookie, true /** checkRevoked */);
        return decodedIdToken;
    } catch (error) {
        console.log('Error verifying session cookie:', error);
        // Session cookie is invalid.
        return null;
    }
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const user = await checkAuth(request);

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  // If trying to access a protected route without being authenticated
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If authenticated and trying to access a public route (like login/signup)
  if (user && PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }

  // If authenticated and accessing the root, redirect to the main panel page
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }

  // If not authenticated and accessing the root, redirect to login
  if (!user && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
