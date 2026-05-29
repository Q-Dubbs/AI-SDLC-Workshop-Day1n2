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

const PRIORITIES = ['high', 'medium', 'low'] as const;
const RECURRENCE_PATTERNS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
const REMINDER_MINUTES = [15, 30, 60, 120, 1440, 2880, 10080] as const;

export function normalizeTodoTitle(input: unknown): string | null {
  const title = String(input ?? '').trim();
  if (!title) {
    return null;
  }
  if (title.length > 200) {
    return null;
  }
  return title;
}

export function normalizeOptionalText(input: unknown, maxLength = 1000): string | null {
  const value = String(input ?? '').trim();
  if (!value) {
    return null;
  }
  return value.slice(0, maxLength);
}

export function normalizePriority(input: unknown): 'high' | 'medium' | 'low' {
  const value = String(input ?? 'medium').trim().toLowerCase();
  if ((PRIORITIES as readonly string[]).includes(value)) {
    return value as 'high' | 'medium' | 'low';
  }
  return 'medium';
}

export function normalizeRecurrence(input: unknown): 'daily' | 'weekly' | 'monthly' | 'yearly' | null {
  if (!input) {
    return null;
  }

  const value = String(input).trim().toLowerCase();
  if ((RECURRENCE_PATTERNS as readonly string[]).includes(value)) {
    return value as 'daily' | 'weekly' | 'monthly' | 'yearly';
  }

  return null;
}

export function normalizeReminderMinutes(input: unknown): number | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  const value = Number(input);
  if ((REMINDER_MINUTES as readonly number[]).includes(value)) {
    return value;
  }

  return null;
}

export function normalizeBoolean(input: unknown): boolean {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'number') {
    return input === 1;
  }

  const value = String(input ?? '').trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

export function normalizeHexColor(input: unknown): string | null {
  const color = String(input ?? '').trim();
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
  if (!valid) {
    return null;
  }
  return color.toLowerCase();
}
