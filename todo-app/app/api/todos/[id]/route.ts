import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB, tagDB, todoDB } from '@/lib/db';
import { addByRecurrence, isFutureAtLeastOneMinute } from '@/lib/timezone';
import {
  normalizeBoolean,
  normalizeOptionalText,
  normalizePriority,
  normalizeRecurrence,
  normalizeReminderMinutes,
  normalizeTodoTitle,
} from '@/lib/validators';

function parseId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }
  return id;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
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

  return NextResponse.json({
    todo: {
      ...todo,
      subtasks: subtaskDB.listByTodo(todo.id),
      tags: tagDB.listForTodo(session.userId, todo.id),
    },
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todoId = parseId(id);
  if (!todoId) {
    return NextResponse.json({ error: 'Invalid todo id' }, { status: 400 });
  }

  const existing = todoDB.getById(session.userId, todoId);
  if (!existing) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  const body = (await request.json()) as {
    title?: unknown;
    description?: unknown;
    priority?: unknown;
    due_date?: unknown;
    is_completed?: unknown;
    is_recurring?: unknown;
    recurrence_pattern?: unknown;
    reminder_minutes?: unknown;
  };

  const title = normalizeTodoTitle(body.title ?? existing.title);
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const dueDate = normalizeOptionalText(body.due_date ?? existing.due_date, 64);
  const dueDateWasUpdated = body.due_date !== undefined;
  const dueDateChanged = dueDate !== existing.due_date;
  if (
    dueDateWasUpdated &&
    dueDateChanged &&
    dueDate &&
    !isFutureAtLeastOneMinute(dueDate) &&
    !normalizeBoolean(body.is_completed ?? existing.is_completed)
  ) {
    return NextResponse.json(
      { error: 'Due date must be at least 1 minute in the future' },
      { status: 400 }
    );
  }

  const isRecurring = normalizeBoolean(body.is_recurring ?? Boolean(existing.is_recurring));
  const recurrencePattern = normalizeRecurrence(body.recurrence_pattern ?? existing.recurrence_pattern);
  if (isRecurring && (!dueDate || !recurrencePattern)) {
    return NextResponse.json(
      { error: 'Recurring todos require a due date and recurrence pattern' },
      { status: 400 }
    );
  }

  const reminderMinutes = normalizeReminderMinutes(body.reminder_minutes ?? existing.reminder_minutes);
  if (reminderMinutes !== null && !dueDate) {
    return NextResponse.json({ error: 'Reminder requires due date' }, { status: 400 });
  }

  const isCompleted = normalizeBoolean(body.is_completed ?? Boolean(existing.is_completed));

  const updated = todoDB.update(session.userId, todoId, {
    title,
    description: normalizeOptionalText(body.description ?? existing.description),
    priority: normalizePriority(body.priority ?? existing.priority),
    dueDate,
    isCompleted,
    isRecurring,
    recurrencePattern,
    reminderMinutes,
  });

  if (!updated) {
    return NextResponse.json({ error: 'Unable to update todo' }, { status: 500 });
  }

  const movedToComplete = existing.is_completed === 0 && updated.is_completed === 1;
  if (movedToComplete && updated.is_recurring === 1 && updated.recurrence_pattern && updated.due_date) {
    const nextDueDate = addByRecurrence(updated.due_date, updated.recurrence_pattern).toISOString();
    const nextTodo = todoDB.create({
      userId: session.userId,
      title: updated.title,
      description: updated.description,
      priority: updated.priority,
      dueDate: nextDueDate,
      isCompleted: false,
      isRecurring: true,
      recurrencePattern: updated.recurrence_pattern,
      reminderMinutes: updated.reminder_minutes,
      lastNotificationSent: null,
    });

    const existingSubtasks = subtaskDB.listByTodo(updated.id);
    for (const subtask of existingSubtasks) {
      subtaskDB.create(nextTodo.id, subtask.title);
    }

    const existingTags = tagDB.listForTodo(session.userId, updated.id);
    for (const tag of existingTags) {
      tagDB.attachToTodo(nextTodo.id, tag.id);
    }
  }

  return NextResponse.json({
    todo: {
      ...updated,
      subtasks: subtaskDB.listByTodo(updated.id),
      tags: tagDB.listForTodo(session.userId, updated.id),
    },
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todoId = parseId(id);
  if (!todoId) {
    return NextResponse.json({ error: 'Invalid todo id' }, { status: 400 });
  }

  const deleted = todoDB.delete(session.userId, todoId);
  if (!deleted) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
