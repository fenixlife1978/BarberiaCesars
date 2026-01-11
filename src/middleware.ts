import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/signup']
  const isPublicPath = publicPaths.includes(pathname)

  // Permitir acceso a archivos estáticos y assets públicos sin verificación de cookie
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') || // Excluir rutas de API
    pathname.startsWith('/static') ||
    /\.(.*)$/.test(pathname) // Excluir archivos con extensión (ej. .png, .svg)
  ) {
    return NextResponse.next()
  }

  // Si el usuario tiene sesión...
  if (sessionCookie) {
    // ...y está intentando acceder a una ruta pública (login/signup), redirigir al panel.
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/impuestos', request.url))
    }
  } else {
    // Si no tiene sesión...
    // ...y no está en una ruta pública, redirigir al login.
    if (!isPublicPath) {
      // Si la ruta raíz es solicitada, redirigir a login
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      // Para cualquier otra ruta protegida, redirigir a login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Si el usuario está en la página raíz ('/'), decidir a dónde redirigir.
  if (pathname === '/') {
    return NextResponse.redirect(new URL(sessionCookie ? '/impuestos' : '/login', request.url));
  }

  return NextResponse.next()
}

// Configuración de paths que serán interceptados por el middleware
export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto las que empiezan con:
     * - api (API routes) -> Ya está cubierto en la lógica del middleware
     * - _next/static (archivos estáticos)
     * - _next/image (optimizador de imágenes)
     * - favicon.ico (favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
