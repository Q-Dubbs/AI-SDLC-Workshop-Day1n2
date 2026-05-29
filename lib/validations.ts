import type { Priority, RecurrencePattern } from "@/lib/db";

const PRIORITY_LEVELS: Priority[] = ["high", "medium", "low"];
const RECURRENCE_PATTERNS: RecurrencePattern[] = ["daily", "weekly", "monthly", "yearly"];

export function validateTodoTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Title is required");
  }
  return trimmed;
}

export function validatePriority(priority: string): Priority {
  if (!PRIORITY_LEVELS.includes(priority as Priority)) {
    throw new Error("Invalid priority");
  }
  return priority as Priority;
}

export function validateRecurrencePattern(pattern: string): RecurrencePattern {
  if (!RECURRENCE_PATTERNS.includes(pattern as RecurrencePattern)) {
    throw new Error("Invalid recurrence pattern");
  }
  return pattern as RecurrencePattern;
}