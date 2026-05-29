import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB, tagDB, todoDB } from '@/lib/db';
import {
  normalizePriority,
  normalizeRecurrence,
  normalizeReminderMinutes,
  normalizeTodoTitle,
} from '@/lib/validators';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json()) as {
    version?: unknown;
    data?: {
      todos?: Array<Record<string, unknown>>;
      tags?: Array<Record<string, unknown>>;
    };
  };

  if (Number(body.version) !== 1 || !body.data) {
    return NextResponse.json({ error: 'Invalid import format' }, { status: 400 });
  }

  const tags = Array.isArray(body.data.tags) ? body.data.tags : [];
  const todos = Array.isArray(body.data.todos) ? body.data.todos : [];

  const importedTags = new Map<number, number>();
  for (const tag of tags) {
    const sourceId = Number(tag.id);
    const name = String(tag.name ?? '').trim().toLowerCase();
    const color = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(tag.color ?? ''))
      ? String(tag.color)
      : '#64748b';

    if (!Number.isInteger(sourceId) || !name) {
      continue;
    }

    const existing = tagDB.getByName(session.userId, name);
    const target = existing ?? tagDB.create(session.userId, name, color);
    importedTags.set(sourceId, target.id);
  }

  let createdTodos = 0;
  let createdSubtasks = 0;

  for (const rawTodo of todos) {
    const title = normalizeTodoTitle(rawTodo.title);
    if (!title) {
      continue;
    }

    const dueDate = typeof rawTodo.due_date === 'string' ? rawTodo.due_date : null;
    const todo = todoDB.create({
      userId: session.userId,
      title,
      description: typeof rawTodo.description === 'string' ? rawTodo.description : null,
      priority: normalizePriority(rawTodo.priority),
      dueDate,
      isCompleted: Boolean(rawTodo.is_completed),
      isRecurring: Boolean(rawTodo.is_recurring),
      recurrencePattern: normalizeRecurrence(rawTodo.recurrence_pattern),
      reminderMinutes: normalizeReminderMinutes(rawTodo.reminder_minutes),
      lastNotificationSent: null,
    });

    createdTodos += 1;

    const subtasks = Array.isArray(rawTodo.subtasks)
      ? (rawTodo.subtasks as Array<Record<string, unknown>>)
      : [];

    for (const subtask of subtasks) {
      const subtaskTitle = normalizeTodoTitle(subtask.title);
      if (subtaskTitle) {
        const created = subtaskDB.create(todo.id, subtaskTitle);
        if (Boolean(subtask.is_completed)) {
          subtaskDB.update(created.id, created.title, true);
        }
        createdSubtasks += 1;
      }
    }

    const tagIds = Array.isArray(rawTodo.tag_ids) ? rawTodo.tag_ids : [];
    for (const tagIdRaw of tagIds) {
      const sourceTagId = Number(tagIdRaw);
      if (!Number.isInteger(sourceTagId)) {
        continue;
      }
      const resolved = importedTags.get(sourceTagId);
      if (resolved) {
        tagDB.attachToTodo(todo.id, resolved);
      }
    }
  }

  return NextResponse.json({
    success: true,
    counts: {
      todos: createdTodos,
      subtasks: createdSubtasks,
      tags: importedTags.size,
    },
  });
}
