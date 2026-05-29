const SINGAPORE_TIMEZONE = 'Asia/Singapore';

function toDate(value?: string | Date): Date {
  if (!value) {
    return new Date();
  }
  return value instanceof Date ? value : new Date(value);
}

export function getSingaporeNow(): Date {
  return toSingaporeDate(new Date());
}

export function toSingaporeDate(value: string | Date): Date {
  const date = toDate(value);
  const localeString = date.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE });
  return new Date(localeString);
}

export function formatSingaporeDate(value: string | Date): string {
  return toDate(value).toLocaleString('en-SG', {
    timeZone: SINGAPORE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatSingaporeDateKey(value: string | Date): string {
  const date = toDate(value);
  return date.toLocaleDateString('en-CA', {
    timeZone: SINGAPORE_TIMEZONE,
  });
}

export function addDaysSingapore(value: string | Date, days: number): Date {
  const base = toSingaporeDate(value);
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function addByRecurrence(value: string | Date, pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
  const base = toSingaporeDate(value);
  const next = new Date(base);

  if (pattern === 'daily') {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (pattern === 'weekly') {
    next.setDate(next.getDate() + 7);
    return next;
  }

  if (pattern === 'monthly') {
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function isFutureAtLeastOneMinute(value: string): boolean {
  const now = getSingaporeNow().getTime();
  const target = toSingaporeDate(value).getTime();
  return target - now >= 60 * 1000;
}

export function getMonthRange(month: string): { start: string; end: string } {
  const [yearRaw, monthRaw] = month.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const startDate = new Date(Date.UTC(year, monthIndex, 1));
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 0));

  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
  };
}
