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
