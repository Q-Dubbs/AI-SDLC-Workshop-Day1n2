import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { holidayDB } from '@/lib/db';
import { getMonthRange } from '@/lib/timezone';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const url = new URL(request.url);
  const month = url.searchParams.get('month');

  if (!month) {
    return NextResponse.json({ holidays: holidayDB.listAll() });
  }

  const validMonth = /^\d{4}-\d{2}$/.test(month);
  if (!validMonth) {
    return NextResponse.json({ error: 'Invalid month format, expected YYYY-MM' }, { status: 400 });
  }

  const range = getMonthRange(month);
  return NextResponse.json({ holidays: holidayDB.listByMonth(range.start, range.end) });
}
