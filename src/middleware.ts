
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/impuestos', '/licencias-economicas', '/ajustes', '/reportes'];
const PUBLIC_ROUTES = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  // If trying to access a protected route without a session cookie
  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If authenticated (has session cookie) and trying to access a public route
  if (sessionCookie && PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }

  // If authenticated and accessing the root, redirect to the main panel page
  if (sessionCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }

  // If not authenticated and accessing the root, redirect to login
  if (!sessionCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Match all routes except for static files and API routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
