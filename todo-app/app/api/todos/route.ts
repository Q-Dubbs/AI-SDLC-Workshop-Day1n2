import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB, tagDB, todoDB } from '@/lib/db';
import { isFutureAtLeastOneMinute } from '@/lib/timezone';
import {
  normalizeBoolean,
  normalizeOptionalText,
  normalizePriority,
  normalizeRecurrence,
  normalizeReminderMinutes,
  normalizeTodoTitle,
} from '@/lib/validators';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const todos = todoDB.listByUser(session.userId);
  const enriched = todos.map((todo) => ({
    ...todo,
    subtasks: subtaskDB.listByTodo(todo.id),
    tags: tagDB.listForTodo(session.userId, todo.id),
  }));

  return NextResponse.json({ todos: enriched });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: unknown;
    description?: unknown;
    priority?: unknown;
    due_date?: unknown;
    is_recurring?: unknown;
    recurrence_pattern?: unknown;
    reminder_minutes?: unknown;
    tag_ids?: unknown;
    subtasks?: unknown;
  };

  const title = normalizeTodoTitle(body.title);
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const dueDate = normalizeOptionalText(body.due_date, 64);
  if (dueDate && !isFutureAtLeastOneMinute(dueDate)) {
    return NextResponse.json(
      { error: 'Due date must be at least 1 minute in the future' },
      { status: 400 }
    );
  }

  const recurrencePattern = normalizeRecurrence(body.recurrence_pattern);
  const isRecurring = normalizeBoolean(body.is_recurring);
  if (isRecurring && (!dueDate || !recurrencePattern)) {
    return NextResponse.json(
      { error: 'Recurring todos require a due date and recurrence pattern' },
      { status: 400 }
    );
  }

  const reminderMinutes = normalizeReminderMinutes(body.reminder_minutes);
  if (reminderMinutes !== null && !dueDate) {
    return NextResponse.json({ error: 'Reminder requires due date' }, { status: 400 });
  }

  const created = todoDB.create({
    userId: session.userId,
    title,
    description: normalizeOptionalText(body.description),
    priority: normalizePriority(body.priority),
    dueDate,
    isCompleted: false,
    isRecurring,
    recurrencePattern,
    reminderMinutes,
    lastNotificationSent: null,
  });

  const subtasks = Array.isArray(body.subtasks) ? body.subtasks : [];
  for (const rawSubtask of subtasks) {
    const subtaskTitle = normalizeTodoTitle(rawSubtask);
    if (subtaskTitle) {
      subtaskDB.create(created.id, subtaskTitle);
    }
  }

  const tagIds = Array.isArray(body.tag_ids)
    ? body.tag_ids
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    : [];

  for (const tagId of tagIds) {
    const existingTag = tagDB.getById(session.userId, tagId);
    if (existingTag) {
      tagDB.attachToTodo(created.id, tagId);
    }
  }

  return NextResponse.json(
    {
      todo: {
        ...created,
        subtasks: subtaskDB.listByTodo(created.id),
        tags: tagDB.listForTodo(session.userId, created.id),
      },
    },
    { status: 201 }
  );
}
