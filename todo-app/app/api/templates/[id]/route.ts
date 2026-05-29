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
  const templateId = parseId(id);
  if (!templateId) {
    return NextResponse.json({ error: 'Invalid template id' }, { status: 400 });
  }

  const current = templateDB.getById(session.userId, templateId);
  if (!current) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
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

  const name = normalizeTodoTitle(body.name ?? current.name);
  const title = normalizeTodoTitle(body.title ?? current.title);
  if (!name || !title) {
    return NextResponse.json({ error: 'Template name and title are required' }, { status: 400 });
  }

  const isRecurring = normalizeBoolean(body.is_recurring ?? current.is_recurring);
  const recurrencePattern = normalizeRecurrence(body.recurrence_pattern ?? current.recurrence_pattern);
  const dueDateOffsetDays = Number.isInteger(Number(body.due_date_offset_days))
    ? Number(body.due_date_offset_days)
    : current.due_date_offset_days;

  if (isRecurring && (!recurrencePattern || dueDateOffsetDays === null || dueDateOffsetDays < 0)) {
    return NextResponse.json(
      {
        error:
          'Recurring templates require recurrence pattern and non-negative due date offset days',
      },
      { status: 400 }
    );
  }

  const template = templateDB.update(session.userId, templateId, {
    name,
    description: normalizeOptionalText(body.description ?? current.description),
    category: normalizeOptionalText(body.category ?? current.category, 100),
    title,
    todoDescription: normalizeOptionalText(body.todo_description ?? current.todo_description),
    priority: normalizePriority(body.priority ?? current.priority),
    isRecurring,
    recurrencePattern,
    reminderMinutes: normalizeReminderMinutes(body.reminder_minutes ?? current.reminder_minutes),
    dueDateOffsetDays,
    subtasksJson: normalizeOptionalText(body.subtasks_json ?? current.subtasks_json, 5000),
    tagIdsJson: normalizeOptionalText(body.tag_ids_json ?? current.tag_ids_json, 5000),
  });

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const templateId = parseId(id);
  if (!templateId) {
    return NextResponse.json({ error: 'Invalid template id' }, { status: 400 });
  }

  const deleted = templateDB.delete(session.userId, templateId);
  if (!deleted) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
