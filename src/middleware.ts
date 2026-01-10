
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const PROTECTED_ROUTES = ['/impuestos', '/licencias-economicas', '/ajustes', '/reportes'];
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieStore = cookies();
  const session = cookieStore.get('session');

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/';

  if (isProtectedRoute && !session) {
    // Si la ruta es la raíz y no hay sesión, llévalo al login.
    // Si es otra ruta protegida, también al login.
    if (pathname === '/') {
       return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
  }
  
  if (session && PUBLIC_ROUTES.includes(pathname)) {
    // Si hay sesión y trata de ir a /login, redirige a /impuestos
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }

  // Si hay sesión y va a la raíz, llévalo a /impuestos.
  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
