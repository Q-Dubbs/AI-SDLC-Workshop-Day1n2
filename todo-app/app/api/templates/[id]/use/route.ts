import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { subtaskDB, tagDB, templateDB, todoDB } from '@/lib/db';
import { addDaysSingapore } from '@/lib/timezone';

function parseId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }
  return id;
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const templateId = parseId(id);
  if (!templateId) {
    return NextResponse.json({ error: 'Invalid template id' }, { status: 400 });
  }

  const template = templateDB.getById(session.userId, templateId);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const dueDate =
    template.due_date_offset_days === null
      ? null
      : addDaysSingapore(new Date(), template.due_date_offset_days).toISOString();

  if (template.is_recurring === 1 && (!template.recurrence_pattern || !dueDate)) {
    return NextResponse.json(
      { error: 'Template is missing recurring schedule configuration' },
      { status: 400 }
    );
  }

  const todo = todoDB.create({
    userId: session.userId,
    title: template.title,
    description: template.todo_description,
    priority: template.priority,
    dueDate,
    isCompleted: false,
    isRecurring: template.is_recurring === 1,
    recurrencePattern: template.recurrence_pattern,
    reminderMinutes: template.reminder_minutes,
    lastNotificationSent: null,
  });

  if (template.subtasks_json) {
    try {
      const subtasks = JSON.parse(template.subtasks_json) as Array<{ title?: string }>;
      for (const subtask of subtasks) {
        if (typeof subtask.title === 'string' && subtask.title.trim()) {
          subtaskDB.create(todo.id, subtask.title.trim());
        }
      }
    } catch {
      // Ignore malformed subtasks JSON in existing records.
    }
  }

  if (template.tag_ids_json) {
    try {
      const tagIds = JSON.parse(template.tag_ids_json) as number[];
      for (const tagId of tagIds) {
        const tag = tagDB.getById(session.userId, Number(tagId));
        if (tag) {
          tagDB.attachToTodo(todo.id, tag.id);
        }
      }
    } catch {
      // Ignore malformed tag IDs JSON in existing records.
    }
  }

  return NextResponse.json({
    todo: {
      ...todo,
      subtasks: subtaskDB.listByTodo(todo.id),
      tags: tagDB.listForTodo(session.userId, todo.id),
    },
  });
}
