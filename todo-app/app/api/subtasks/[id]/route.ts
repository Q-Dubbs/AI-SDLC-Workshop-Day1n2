import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB } from '@/lib/db';
import { normalizeBoolean, normalizeTodoTitle } from '@/lib/validators';

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
  const subtaskId = parseId(id);
  if (!subtaskId) {
    return NextResponse.json({ error: 'Invalid subtask id' }, { status: 400 });
  }

  const existing = subtaskDB.getById(subtaskId);
  if (!existing || existing.user_id !== session.userId) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }

  const body = (await request.json()) as { title?: unknown; is_completed?: unknown };
  const title = normalizeTodoTitle(body.title ?? existing.title);
  if (!title) {
    return NextResponse.json({ error: 'Subtask title is required' }, { status: 400 });
  }

  subtaskDB.update(subtaskId, title, normalizeBoolean(body.is_completed ?? existing.is_completed));
  const updated = subtaskDB.getById(subtaskId);

  return NextResponse.json({ subtask: updated });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const subtaskId = parseId(id);
  if (!subtaskId) {
    return NextResponse.json({ error: 'Invalid subtask id' }, { status: 400 });
  }

  const existing = subtaskDB.getById(subtaskId);
  if (!existing || existing.user_id !== session.userId) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }

  subtaskDB.delete(subtaskId);
  return NextResponse.json({ success: true });
}
