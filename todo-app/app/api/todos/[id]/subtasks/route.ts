import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB } from '@/lib/db';
import { parseIntegerId, parseSubtaskTitle } from '@/lib/validators';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const todoId = parseIntegerId(id);
    const todo = todoDB.getByIdForUser(todoId, session.userId);

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const body = await request.json();
    const title = parseSubtaskTitle(body?.title);
    const subtask = subtaskDB.create(todoId, title);

    const updatedTodo = todoDB.getByIdForUser(todoId, session.userId);

    return NextResponse.json({
      subtask,
      progress: {
        completed: updatedTodo?.completed_subtasks ?? 0,
        total: updatedTodo?.total_subtasks ?? 0,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
