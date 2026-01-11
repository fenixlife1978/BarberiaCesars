import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este middleware es más simple y no intenta verificar la sesión en el servidor.
// Su principal trabajo es redirigir al usuario si intenta acceder a páginas
// de autenticación cuando ya tiene una sesión, o a la inversa.
// La protección real de las rutas la hace el `(panel)/layout.tsx` en el cliente.
export function middleware(request: NextRequest) {
  const session = request.cookies.has('__session'); // This is a client-side hint, not for server auth
  const { pathname } = request.nextUrl;

  const isPublicPath = pathname === '/login' || pathname === '/signup';

  // Si el usuario parece tener una sesión (basado en una cookie que Firebase client SDK podría establecer)
  // y está en una página pública, redirigir al panel.
  // Nota: Firebase SDK del cliente gestiona sus propias cookies/storage, `__session` es solo un posible indicador.
  // La cookie `firebase-auth-id-token` es otro indicador común.
  const hasAuthCookie = request.cookies.has('firebase-auth-id-token') || request.cookies.has('__session');

  if (hasAuthCookie && isPublicPath) {
    return NextResponse.redirect(new URL('/impuestos', request.url));
  }

  // Si el usuario no tiene sesión y está intentando acceder a una ruta protegida
  // lo dejamos pasar. El layout del panel se encargará de redirigirlo al login.
  // Esto previene bucles de redirección si la verificación de la cookie del servidor
  // y el estado de auth del cliente se desincronizan.

  if (pathname === '/') {
     return NextResponse.redirect(new URL(hasAuthCookie ? '/impuestos' : '/login', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (e.g. .png, .svg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
