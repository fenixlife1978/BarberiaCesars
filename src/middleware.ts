import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/signup']
  const isPublicPath = publicPaths.includes(pathname)
  
  // Allow static files and specific public assets to pass through
  if (pathname.startsWith('/_next') || pathname.endsWith('.png') || pathname.endsWith('.ico') || pathname.endsWith('.svg')) {
    return NextResponse.next()
  }

  // If the user has a session cookie
  if (sessionCookie) {
    // If they are trying to access a public page like /login, redirect them to the main app page
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/impuestos', request.url))
    }
  } else {
    // If the user does not have a session and is trying to access a protected page
    if (!isPublicPath) {
       // Redirect to login, but preserve the original path as a query param
       const loginUrl = new URL('/login', request.url)
       loginUrl.searchParams.set('redirect', pathname)
       return NextResponse.redirect(loginUrl)
    }
  }

  // If it's the root path, redirect based on auth status
  if (pathname === '/') {
      const targetUrl = sessionCookie ? '/impuestos' : '/login'
      return NextResponse.redirect(new URL(targetUrl, request.url))
  }

  return NextResponse.next()
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
