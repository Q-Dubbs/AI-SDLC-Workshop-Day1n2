import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/calendar'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get('session'));

  if (PROTECTED_ROUTES.includes(pathname) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/calendar', '/login'],
};
