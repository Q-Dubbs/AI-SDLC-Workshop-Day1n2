import 'server-only';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'todo_session';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

type SessionPayload = {
  userId: number;
  username: string;
};

function getJwtSecret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('JWT_SECRET is not configured');
  }
  if (process.env.NODE_ENV === 'production' && value === 'change-me-to-a-long-random-value') {
    throw new Error('JWT_SECRET must be replaced with a strong secret in production');
  }
  return value;
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = jwt.sign(payload, getJwtSecret(), {
    expiresIn: SESSION_DURATION_SECONDS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as SessionPayload;
    return {
      userId: Number(decoded.userId),
      username: String(decoded.username),
    };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
