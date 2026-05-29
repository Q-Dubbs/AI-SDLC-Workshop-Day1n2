import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';
import { normalizeHexColor, normalizeOptionalText } from '@/lib/validators';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({ tags: tagDB.listByUser(session.userId) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json()) as { name?: unknown; color?: unknown };
  const name = normalizeOptionalText(body.name, 50);
  if (!name) {
    return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
  }

  const color = normalizeHexColor(body.color) ?? '#64748b';

  const existing = tagDB.getByName(session.userId, name.toLowerCase());
  if (existing) {
    return NextResponse.json({ error: 'Tag name already exists' }, { status: 409 });
  }

  const tag = tagDB.create(session.userId, name.toLowerCase(), color);
  return NextResponse.json({ tag }, { status: 201 });
}
