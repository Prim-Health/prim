import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/(dashboard)');
  const hasSessionId = request.nextUrl.searchParams.has('session_id');

  // If on dashboard route without session, redirect to login
  if (isDashboardRoute && !hasSessionId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If on login page with session, redirect to overview
  if (isLoginPage && hasSessionId) {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 