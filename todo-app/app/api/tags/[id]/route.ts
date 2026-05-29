import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';
import { normalizeHexColor, normalizeOptionalText } from '@/lib/validators';

function parseId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }
  return id;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const tagId = parseId(id);
  if (!tagId) {
    return NextResponse.json({ error: 'Invalid tag id' }, { status: 400 });
  }

  const body = (await request.json()) as { name?: unknown; color?: unknown };
  const name = normalizeOptionalText(body.name, 50);
  if (!name) {
    return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
  }

  const color = normalizeHexColor(body.color) ?? '#64748b';
  const duplicate = tagDB.getByName(session.userId, name.toLowerCase());
  if (duplicate && duplicate.id !== tagId) {
    return NextResponse.json({ error: 'Tag name already exists' }, { status: 409 });
  }

  const tag = tagDB.update(session.userId, tagId, name.toLowerCase(), color);
  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  return NextResponse.json({ tag });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const tagId = parseId(id);
  if (!tagId) {
    return NextResponse.json({ error: 'Invalid tag id' }, { status: 400 });
  }

  const deleted = tagDB.delete(session.userId, tagId);
  if (!deleted) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
