import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { templateDB } from '@/lib/db';
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

  return NextResponse.json({ templates: templateDB.listByUser(session.userId) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: unknown;
    description?: unknown;
    category?: unknown;
    title?: unknown;
    todo_description?: unknown;
    priority?: unknown;
    is_recurring?: unknown;
    recurrence_pattern?: unknown;
    reminder_minutes?: unknown;
    due_date_offset_days?: unknown;
    subtasks_json?: unknown;
    tag_ids_json?: unknown;
  };

  const name = normalizeTodoTitle(body.name);
  const title = normalizeTodoTitle(body.title);
  if (!name || !title) {
    return NextResponse.json({ error: 'Template name and title are required' }, { status: 400 });
  }

  const isRecurring = normalizeBoolean(body.is_recurring);
  const recurrencePattern = normalizeRecurrence(body.recurrence_pattern);
  const dueDateOffsetDays = Number.isInteger(Number(body.due_date_offset_days))
    ? Number(body.due_date_offset_days)
    : null;

  if (isRecurring && (!recurrencePattern || dueDateOffsetDays === null || dueDateOffsetDays < 0)) {
    return NextResponse.json(
      {
        error:
          'Recurring templates require recurrence pattern and non-negative due date offset days',
      },
      { status: 400 }
    );
  }

  const template = templateDB.create(session.userId, {
    name,
    description: normalizeOptionalText(body.description),
    category: normalizeOptionalText(body.category, 100),
    title,
    todoDescription: normalizeOptionalText(body.todo_description),
    priority: normalizePriority(body.priority),
    isRecurring,
    recurrencePattern,
    reminderMinutes: normalizeReminderMinutes(body.reminder_minutes),
    dueDateOffsetDays,
    subtasksJson: normalizeOptionalText(body.subtasks_json, 5000),
    tagIdsJson: normalizeOptionalText(body.tag_ids_json, 5000),
  });

  return NextResponse.json({ template }, { status: 201 });
}
