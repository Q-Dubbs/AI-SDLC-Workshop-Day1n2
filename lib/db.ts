export type Priority = "high" | "medium" | "low";
export type RecurrencePattern = "daily" | "weekly" | "monthly" | "yearly";

export type Todo = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
  is_completed: number;
  is_recurring: number;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
};

export type Subtask = {
  id: number;
  todo_id: number;
  title: string;
  is_completed: number;
  position: number;
};

export type Tag = {
  id: number;
  user_id: number;
  name: string;
  color: string;
};

export type Template = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: string | null;
  payload_json: string;
};

export type User = {
  id: number;
  username: string;
  created_at: string;
};

export const schemaPlan = {
  users: "Feature 11",
  authenticators: "Feature 11",
  todos: "Features 01-04, 08-10",
  subtasks: "Feature 05",
  tags: "Feature 06",
  todo_tags: "Feature 06",
  templates: "Feature 07",
  holidays: "Feature 10"
};

export const todoDB = {
  list: "TODO",
  get: "TODO",
  create: "TODO",
  update: "TODO",
  remove: "TODO"
};