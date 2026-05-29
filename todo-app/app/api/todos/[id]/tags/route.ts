import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { tagDB, todoDB } from '@/lib/db';

function parseId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }
  return id;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todoId = parseId(id);
  if (!todoId) {
    return NextResponse.json({ error: 'Invalid todo id' }, { status: 400 });
  }

  const todo = todoDB.getById(session.userId, todoId);
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  const body = (await request.json()) as { tag_id?: unknown };
  const tagId = Number(body.tag_id);
  if (!Number.isInteger(tagId) || tagId < 1) {
    return NextResponse.json({ error: 'Invalid tag id' }, { status: 400 });
  }

  const tag = tagDB.getById(session.userId, tagId);
  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  tagDB.attachToTodo(todoId, tagId);
  return NextResponse.json({ tags: tagDB.listForTodo(session.userId, todoId) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todoId = parseId(id);
  if (!todoId) {
    return NextResponse.json({ error: 'Invalid todo id' }, { status: 400 });
  }

  const todo = todoDB.getById(session.userId, todoId);
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  const body = (await request.json()) as { tag_id?: unknown };
  const tagId = Number(body.tag_id);
  if (!Number.isInteger(tagId) || tagId < 1) {
    return NextResponse.json({ error: 'Invalid tag id' }, { status: 400 });
  }

  tagDB.detachFromTodo(todoId, tagId);
  return NextResponse.json({ tags: tagDB.listForTodo(session.userId, todoId) });
}
