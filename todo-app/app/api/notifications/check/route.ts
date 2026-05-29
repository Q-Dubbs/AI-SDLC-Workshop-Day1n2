import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { notificationDB } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const reminders = notificationDB.getDueReminderCandidates(session.userId);
  reminders.forEach((reminder) => {
    notificationDB.markNotificationSent(reminder.id, session.userId);
  });

  return NextResponse.json({ reminders });
}
