import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { firebaseAdminConfig } from '@/firebase/admin-config';

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


export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  
  if (!sessionCookie) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the session cookie
    await getAuth(adminApp).verifySessionCookie(sessionCookie, true);

    // If the user is authenticated and tries to access an auth page, redirect to the panel
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/impuestos', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    // Session cookie is invalid or expired
    if (isAuthPage) {
      return NextResponse.next();
    }
    // Clear the invalid cookie by redirecting
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('__session', '', { maxAge: -1 });
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};