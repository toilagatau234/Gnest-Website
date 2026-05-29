import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect `/admin` routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow login page without protection
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // Allow access-denied without protection
  if (pathname === '/admin/access-denied') {
    return NextResponse.next();
  }

  // Check if auth token exists in cookies (indicates active session)
  const hasAuthToken = request.cookies.has('sb-auth-token');

  if (!hasAuthToken) {
    // No session; redirect to login
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists; allow request (role check will be done on client/server-side in layout)
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
