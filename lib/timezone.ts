const SG_TIMEZONE = "Asia/Singapore";

export function getSingaporeNow(): Date {
  const now = new Date();
  const localized = now.toLocaleString("en-US", { timeZone: SG_TIMEZONE });
  return new Date(localized);
}

export function formatSingaporeDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("en-SG", {
    timeZone: SG_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function getSingaporeISODate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SG_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}