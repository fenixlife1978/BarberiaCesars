import { NextResponse, type NextRequest } from 'next/server';

// No se usa firebase-admin aquí para evitar errores de Edge Runtime.
// La verificación de la cookie se hace en los layouts o páginas.

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isProtectedRoute = !isAuthPage && pathname !== '/';

  // Si no hay cookie y se intenta acceder a una ruta protegida, redirigir a login.
  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si hay cookie y se intenta acceder a una página de autenticación, redirigir al panel.
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excluimos rutas que no necesitan protección: api, archivos estáticos, imágenes, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
