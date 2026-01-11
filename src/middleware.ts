import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/signup', '/manifest.json', '/sw.js']
  const isPublicPath = publicPaths.includes(pathname)

  // Permitir acceso a archivos estáticos y assets públicos
  if (
    pathname.startsWith('/_next') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next()
  }

  // Si el usuario tiene sesión
  if (sessionCookie) {
    // Evitar que acceda a /login o /signup estando logueado
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/impuestos', request.url))
    }
  } else {
    // Si no tiene sesión y quiere acceder a una ruta protegida
    if (!isPublicPath) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirección en la raíz según estado de sesión
  if (pathname === '/') {
    const targetUrl = sessionCookie ? '/impuestos' : '/login'
    return NextResponse.redirect(new URL(targetUrl, request.url))
  }

  return NextResponse.next()
}

// Configuración de paths que serán interceptados por el middleware
export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto las que empiezan con:
     * - api (API routes)
     * - _next/static (archivos estáticos)
     * - _next/image (optimizador de imágenes)
     * - favicon.ico (favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
