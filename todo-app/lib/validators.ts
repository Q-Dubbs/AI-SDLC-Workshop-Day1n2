import type { Priority, RecurrencePattern } from '@/lib/db';
import { getSingaporeNow, parseSingaporeDateInput, toIsoString } from '@/lib/timezone';

export function normalizeUsername(input: unknown): string | null {
  const raw = String(input ?? '').trim().toLowerCase();
  if (!raw) {
    return null;
  }

  const valid = /^[a-z0-9_.-]{3,32}$/.test(raw);
  if (!valid) {
    return null;
  }

  return raw;
}

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const RECURRENCE_PATTERNS: RecurrencePattern[] = ['daily', 'weekly', 'monthly', 'yearly'];
const REMINDER_OPTIONS = [15, 30, 60, 120, 1440, 2880, 10080] as const;
const MAX_TODO_TITLE_LENGTH = 200;
const MAX_SUBTASK_TITLE_LENGTH = 120;

export type TodoInput = {
  title: string;
  completed: boolean;
  dueDate: string | null;
  priority: Priority;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  reminderMinutes: number | null;
};

function normalizeTitle(input: unknown, maxLength: number): string | null {
  const title = String(input ?? '').trim();
  if (title.length > maxLength) {
    throw new Error(`Title must be ${maxLength} characters or fewer`);
  }
  return title.length > 0 ? title : null;
}

function normalizeBoolean(input: unknown, fieldName: string): boolean {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'string') {
    const value = input.trim().toLowerCase();
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
  }

  throw new Error(`Invalid ${fieldName} value`);
}

function normalizePriority(input: unknown): Priority {
  const value = String(input ?? 'medium').trim().toLowerCase() as Priority;
  if (PRIORITIES.includes(value)) {
    return value;
  }
  throw new Error('Invalid priority value');
}

function normalizeRecurrencePattern(input: unknown): RecurrencePattern | null {
  if (input === null || input === undefined || String(input).trim() === '') {
    return null;
  }

  const value = String(input).trim().toLowerCase() as RecurrencePattern;
  if (RECURRENCE_PATTERNS.includes(value)) {
    return value;
  }

  throw new Error('Invalid recurrence pattern');
}

function normalizeReminder(input: unknown): number | null {
  if (input === null || input === undefined || String(input).trim() === '') {
    return null;
  }

  const value = Number(input);
  if (Number.isNaN(value) || !REMINDER_OPTIONS.includes(value as (typeof REMINDER_OPTIONS)[number])) {
    throw new Error('Invalid reminder value');
  }

  return value;
}

function normalizeDueDate(input: unknown): string | null {
  if (input === null || input === undefined || String(input).trim() === '') {
    return null;
  }

  const parsed = parseSingaporeDateInput(String(input));
  if (!parsed) {
    throw new Error('Invalid due date');
  }

  if (parsed.getTime() < getSingaporeNow().getTime() + 60_000) {
    throw new Error('Due date must be at least 1 minute in the future');
  }

  return toIsoString(parsed);
}

export function parseTodoCreateInput(input: unknown): TodoInput {
  const body = (input ?? {}) as Record<string, unknown>;
  const title = normalizeTitle(body.title, MAX_TODO_TITLE_LENGTH);
  if (!title) {
    throw new Error('Title is required');
  }

  const dueDate = normalizeDueDate(body.dueDate);
  const priority = normalizePriority(body.priority);
  const isRecurring =
    body.isRecurring === undefined ? false : normalizeBoolean(body.isRecurring, 'isRecurring');
  const recurrencePattern = normalizeRecurrencePattern(body.recurrencePattern);
  const reminderMinutes = normalizeReminder(body.reminderMinutes);

  if (isRecurring && !dueDate) {
    throw new Error('Recurring todos require a due date');
  }
  if (isRecurring && !recurrencePattern) {
    throw new Error('Recurring todos require a recurrence pattern');
  }
  if (!isRecurring && recurrencePattern) {
    throw new Error('Recurrence pattern requires recurring mode');
  }
  if (reminderMinutes !== null && !dueDate) {
    throw new Error('Reminder requires a due date');
  }

  return {
    title,
    completed: false,
    dueDate,
    priority,
    isRecurring,
    recurrencePattern,
    reminderMinutes,
  };
}

export function parseTodoUpdateInput(input: unknown, existing: TodoInput): TodoInput {
  const body = (input ?? {}) as Record<string, unknown>;

  const title =
    body.title === undefined ? existing.title : normalizeTitle(body.title, MAX_TODO_TITLE_LENGTH);
  if (!title) {
    throw new Error('Title is required');
  }

  const completed =
    body.completed === undefined ? existing.completed : normalizeBoolean(body.completed, 'completed');
  const dueDate = body.dueDate === undefined ? existing.dueDate : normalizeDueDate(body.dueDate);
  const priority = body.priority === undefined ? existing.priority : normalizePriority(body.priority);
  const isRecurring =
    body.isRecurring === undefined
      ? existing.isRecurring
      : normalizeBoolean(body.isRecurring, 'isRecurring');
  const recurrencePattern =
    body.recurrencePattern === undefined
      ? existing.recurrencePattern
      : normalizeRecurrencePattern(body.recurrencePattern);
  const reminderMinutes =
    body.reminderMinutes === undefined
      ? existing.reminderMinutes
      : normalizeReminder(body.reminderMinutes);

  if (isRecurring && !dueDate) {
    throw new Error('Recurring todos require a due date');
  }
  if (isRecurring && !recurrencePattern) {
    throw new Error('Recurring todos require a recurrence pattern');
  }
  if (!isRecurring && recurrencePattern) {
    throw new Error('Recurrence pattern requires recurring mode');
  }
  if (reminderMinutes !== null && !dueDate) {
    throw new Error('Reminder requires a due date');
  }

  return {
    title,
    completed,
    dueDate,
    priority,
    isRecurring,
    recurrencePattern,
    reminderMinutes,
  };
}

export function parseSubtaskTitle(input: unknown): string {
  const title = normalizeTitle(input, MAX_SUBTASK_TITLE_LENGTH);
  if (!title) {
    throw new Error('Subtask title is required');
  }
  return title;
}

export function parseIntegerId(id: string): number {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('Invalid id');
  }
  return value;
}

export function parseSubtaskPatch(input: unknown): {
  title?: string;
  completed?: boolean;
  position?: number;
} {
  const body = (input ?? {}) as Record<string, unknown>;
  const patch: { title?: string; completed?: boolean; position?: number } = {};

  if (body.title !== undefined) {
    patch.title = parseSubtaskTitle(body.title);
  }
  if (body.completed !== undefined) {
    patch.completed = normalizeBoolean(body.completed, 'completed');
  }
  if (body.position !== undefined) {
    const position = Number(body.position);
    if (!Number.isInteger(position) || position < 0) {
      throw new Error('Invalid subtask position');
    }
    patch.position = position;
  }

  return patch;
}

export function reminderLabel(minutes: number | null): string | null {
  if (minutes === null) {
    return null;
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  if (minutes < 1440) {
    return `${minutes / 60}h`;
  }

  if (minutes < 10080) {
    return `${minutes / 1440}d`;
  }

  return '1w';
}
