
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const PROTECTED_ROUTES = ['/impuestos', '/licencias-economicas', '/ajustes'];
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieStore = cookies();
  const session = cookieStore.get('session');

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  // if (isProtectedRoute && !session) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }
  
  // if (pathname === '/' && !session) {
  //    return NextResponse.redirect(new URL('/login', request.url));
  // }

  // if (session && PUBLIC_ROUTES.includes(pathname)) {
  //   return NextResponse.redirect(new URL('/impuestos', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
