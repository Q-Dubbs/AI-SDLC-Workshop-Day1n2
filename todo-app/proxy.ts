import { NextResponse, type NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const SESSION_COOKIE = 'todo_session';
const DEV_JWT_SECRET = 'todo-app-dev-jwt-secret';

function getJwtSecret(): string | null {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEV_JWT_SECRET;
  }

  return null;
}

function hasValidSession(token: string | undefined): boolean {
  const secret = getJwtSecret();
  if (!token || !secret) {
    return false;
  }

  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = hasValidSession(token);

  const isProtectedRoute = pathname === '/' || pathname.startsWith('/calendar');
  const isLoginRoute = pathname.startsWith('/login');

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/calendar/:path*', '/login'],
};
