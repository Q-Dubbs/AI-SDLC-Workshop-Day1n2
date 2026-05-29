import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB } from '@/lib/db';
import { parseIntegerId, parseTodoUpdateInput, type TodoInput } from '@/lib/validators';

export async function GET(
  _request: Request,
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

    return NextResponse.json({ todo: { ...todo, subtasks: subtaskDB.listForTodo(todo.id) } });
  } catch {
    return NextResponse.json({ error: 'Invalid todo id' }, { status: 400 });
  }
}

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
    const todoId = parseIntegerId(id);
    const existing = todoDB.getByIdForUser(todoId, session.userId);

    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const existingInput: TodoInput = {
      title: existing.title,
      completed: existing.completed === 1,
      dueDate: existing.due_date,
      priority: existing.priority,
      isRecurring: existing.is_recurring === 1,
      recurrencePattern: existing.recurrence_pattern,
      reminderMinutes: existing.reminder_minutes,
    };

    const body = await request.json();
    const input = parseTodoUpdateInput(body, existingInput);

    const hasOtherFieldChanges =
      input.title !== existingInput.title ||
      input.dueDate !== existingInput.dueDate ||
      input.priority !== existingInput.priority ||
      input.isRecurring !== existingInput.isRecurring ||
      input.recurrencePattern !== existingInput.recurrencePattern ||
      input.reminderMinutes !== existingInput.reminderMinutes;

    if (input.completed && existing.completed === 0 && existing.is_recurring === 1) {
      if (hasOtherFieldChanges) {
        return NextResponse.json(
          {
            error:
              'Completing a recurring todo cannot be combined with other updates in the same request',
          },
          { status: 400 }
        );
      }

      const result = todoDB.completeRecurring(todoId, session.userId);
      if (!result) {
        return NextResponse.json(
          { error: 'Unable to complete recurring todo due to missing recurrence data' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        todo: { ...result.current, subtasks: subtaskDB.listForTodo(result.current.id) },
        nextTodo: { ...result.next, subtasks: subtaskDB.listForTodo(result.next.id) },
      });
    }

    const updated = todoDB.update(todoId, session.userId, {
      title: input.title,
      completed: input.completed,
      dueDate: input.dueDate,
      priority: input.priority,
      isRecurring: input.isRecurring,
      recurrencePattern: input.recurrencePattern,
      reminderMinutes: input.reminderMinutes,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ todo: { ...updated, subtasks: subtaskDB.listForTodo(updated.id) } });
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
    const todoId = parseIntegerId(id);
    const deleted = todoDB.delete(todoId, session.userId);

    if (!deleted) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid todo id' }, { status: 400 });
  }
}
