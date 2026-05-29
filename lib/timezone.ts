const SINGAPORE_TZ = 'Asia/Singapore';

export function getSingaporeNow(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: SINGAPORE_TZ }),
  );
}

export function formatSingaporeDate(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: SINGAPORE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function toSingaporeISOString(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return date.toISOString();
}
