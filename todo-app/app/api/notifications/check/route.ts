import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const nowIso = getSingaporeNow().toISOString();
  const todos = todoDB.listNeedingNotifications(session.userId, nowIso);
  if (todos.length > 0) {
    todoDB.markNotificationSent(
      session.userId,
      todos.map((todo) => todo.id),
      nowIso
    );
  }

  return NextResponse.json({ notifications: todos });
}
