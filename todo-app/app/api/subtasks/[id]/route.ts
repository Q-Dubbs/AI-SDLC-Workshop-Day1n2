import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB } from '@/lib/db';
import { parseIntegerId, parseSubtaskPatch } from '@/lib/validators';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const subtaskId = parseIntegerId(id);
    const existing = subtaskDB.getByIdForUser(subtaskId, session.userId);

    if (!existing) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    const patch = parseSubtaskPatch(await request.json());
    const updated = subtaskDB.update(subtaskId, {
      title: patch.title ?? existing.title,
      completed: patch.completed ?? existing.completed === 1,
      position: patch.position ?? existing.position,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    const updatedTodo = todoDB.getByIdForUser(updated.todo_id, session.userId);

    return NextResponse.json({
      subtask: updated,
      progress: {
        completed: updatedTodo?.completed_subtasks ?? 0,
        total: updatedTodo?.total_subtasks ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const subtaskId = parseIntegerId(id);
    const existing = subtaskDB.getByIdForUser(subtaskId, session.userId);

    if (!existing) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    const deleted = subtaskDB.delete(subtaskId);
    if (!deleted) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    const updatedTodo = todoDB.getByIdForUser(existing.todo_id, session.userId);

    return NextResponse.json({
      success: true,
      progress: {
        completed: updatedTodo?.completed_subtasks ?? 0,
        total: updatedTodo?.total_subtasks ?? 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid subtask id' }, { status: 400 });
  }
}
