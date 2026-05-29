export const SINGAPORE_OFFSET_MINUTES = 8 * 60;

export function getSingaporeNow(): Date {
  return new Date();
}

export function toIsoString(date: Date): string {
  return date.toISOString();
}

function parsePlainSingaporeDateTime(input: string): Date | null {
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (monthIndex < 0 || monthIndex > 11) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const maxDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  if (day < 1 || day > maxDay) {
    return null;
  }

  const utcMs = Date.UTC(year, monthIndex, day, hour - 8, minute, 0, 0);
  const parsed = new Date(utcMs);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const roundTrip = new Date(parsed.getTime() + SINGAPORE_OFFSET_MINUTES * 60_000);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== monthIndex ||
    roundTrip.getUTCDate() !== day ||
    roundTrip.getUTCHours() !== hour ||
    roundTrip.getUTCMinutes() !== minute
  ) {
    return null;
  }

  return parsed;
}

export function parseSingaporeDateInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const plain = parsePlainSingaporeDateTime(trimmed);
  if (plain) {
    return plain;
  }

  const isoWithZone =
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(trimmed);
  if (!isoWithZone) {
    return null;
  }

  const fallback = new Date(trimmed);
  if (Number.isNaN(fallback.getTime())) {
    return null;
  }

  return fallback;
}

export function formatDateTimeForInput(iso: string | null): string {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const singaporeOffsetMs = SINGAPORE_OFFSET_MINUTES * 60_000;
  const singaporeDate = new Date(date.getTime() + singaporeOffsetMs);

  const year = singaporeDate.getUTCFullYear();
  const month = String(singaporeDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(singaporeDate.getUTCDate()).padStart(2, '0');
  const hour = String(singaporeDate.getUTCHours()).padStart(2, '0');
  const minute = String(singaporeDate.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function endOfMonthSafeDate(year: number, monthIndex: number, day: number, hours: number, minutes: number): Date {
  const maxDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const safeDay = Math.min(day, maxDay);
  return new Date(Date.UTC(year, monthIndex, safeDay, hours, minutes, 0, 0));
}

export function calculateNextRecurringDueDate(
  dueDateIso: string,
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Date | null {
  const dueDate = parseSingaporeDateInput(dueDateIso);
  if (!dueDate) {
    return null;
  }

  const singaporeOffsetMs = SINGAPORE_OFFSET_MINUTES * 60_000;
  const singaporeDate = new Date(dueDate.getTime() + singaporeOffsetMs);

  const y = singaporeDate.getUTCFullYear();
  const m = singaporeDate.getUTCMonth();
  const d = singaporeDate.getUTCDate();
  const h = singaporeDate.getUTCHours();
  const min = singaporeDate.getUTCMinutes();

  let nextSingapore: Date;
  if (pattern === 'daily') {
    nextSingapore = new Date(Date.UTC(y, m, d + 1, h, min, 0, 0));
  } else if (pattern === 'weekly') {
    nextSingapore = new Date(Date.UTC(y, m, d + 7, h, min, 0, 0));
  } else if (pattern === 'monthly') {
    const targetMonth = m + 1;
    const targetYear = y + Math.floor(targetMonth / 12);
    const monthIndex = targetMonth % 12;
    nextSingapore = endOfMonthSafeDate(targetYear, monthIndex, d, h, min);
  } else {
    nextSingapore = endOfMonthSafeDate(y + 1, m, d, h, min);
  }

  return new Date(nextSingapore.getTime() - singaporeOffsetMs);
}
