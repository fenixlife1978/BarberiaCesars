
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/impuestos', '/licencias-economicas', '/ajustes', '/reportes'];
const PUBLIC_ROUTES = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  // If trying to access a protected route without a session, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If authenticated and trying to access a public route, redirect to dashboard
  if (sessionCookie && PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }

  // If authenticated and at root, redirect to dashboard
  if (sessionCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }
  
  // If not authenticated and at root, redirect to login
  if(!sessionCookie && pathname === '/'){
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png (logo file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
};
