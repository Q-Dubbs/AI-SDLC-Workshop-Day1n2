import 'server-only';

import path from 'node:path';
import Database from 'better-sqlite3';

export type Priority = 'high' | 'medium' | 'low';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Todo {
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
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  is_completed: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: string | null;
  title: string;
  todo_description: string | null;
  priority: Priority;
  is_recurring: number;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  due_date_offset_days: number | null;
  subtasks_json: string | null;
  tag_ids_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface AuthenticatorRecord {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: Buffer;
  counter: number | null;
  transports: string | null;
  device_type: string | null;
  backed_up: number | null;
  created_at: string;
}

const dbPath = path.join(process.cwd(), 'todos.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS authenticators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      credential_id TEXT NOT NULL UNIQUE,
      public_key BLOB NOT NULL,
      counter INTEGER DEFAULT 0,
      transports TEXT,
      device_type TEXT,
      backed_up INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS webauthn_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      challenge TEXT NOT NULL,
      kind TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_authenticators_user_id ON authenticators(user_id);
    CREATE INDEX IF NOT EXISTS idx_challenges_user_id_kind ON webauthn_challenges(user_id, kind);
    CREATE INDEX IF NOT EXISTS idx_challenges_expires_at ON webauthn_challenges(expires_at);

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
      due_date TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
      reminder_minutes INTEGER,
      last_notification_sent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      todo_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS todo_tags (
      todo_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (todo_id, tag_id),
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      title TEXT NOT NULL,
      todo_description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
      reminder_minutes INTEGER,
      due_date_offset_days INTEGER,
      subtasks_json TEXT,
      tag_ids_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
    CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
    CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
    CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(is_completed);
    CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
    CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
    CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
    CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
  `);

  try {
    db.exec('ALTER TABLE todos ADD COLUMN last_notification_sent TEXT');
  } catch {
    // No-op when column already exists.
  }
}

init();

const getUserByUsernameStmt = db.prepare(
  'SELECT id, username, created_at FROM users WHERE username = ?'
);
const createUserStmt = db.prepare('INSERT INTO users (username) VALUES (?)');

const countAuthenticatorsForUserStmt = db.prepare(
  'SELECT COUNT(*) as count FROM authenticators WHERE user_id = ?'
);
const getAuthenticatorsForUserStmt = db.prepare(
  'SELECT * FROM authenticators WHERE user_id = ? ORDER BY id ASC'
);
const getAuthenticatorByUserAndCredentialStmt = db.prepare(
  'SELECT * FROM authenticators WHERE user_id = ? AND credential_id = ?'
);
const insertAuthenticatorStmt = db.prepare(`
  INSERT INTO authenticators (
    user_id,
    credential_id,
    public_key,
    counter,
    transports,
    device_type,
    backed_up
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const updateAuthenticatorCounterStmt = db.prepare(
  'UPDATE authenticators SET counter = ? WHERE id = ?'
);

const insertChallengeStmt = db.prepare(
  'INSERT INTO webauthn_challenges (user_id, challenge, kind, expires_at) VALUES (?, ?, ?, ?)'
);
const getChallengeStmt = db.prepare(`
  SELECT id, challenge, expires_at
  FROM webauthn_challenges
  WHERE user_id = ? AND kind = ?
  ORDER BY id DESC
  LIMIT 1
`);
const deleteChallengeByIdStmt = db.prepare(
  'DELETE FROM webauthn_challenges WHERE id = ?'
);
const pruneExpiredChallengesStmt = db.prepare(
  'DELETE FROM webauthn_challenges WHERE expires_at < ?'
);

const createTodoStmt = db.prepare(`
  INSERT INTO todos (
    user_id,
    title,
    description,
    priority,
    due_date,
    is_completed,
    is_recurring,
    recurrence_pattern,
    reminder_minutes,
    last_notification_sent,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);
const listTodosByUserStmt = db.prepare(`
  SELECT * FROM todos
  WHERE user_id = ?
  ORDER BY
    CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
    due_date ASC,
    created_at DESC
`);
const getTodoByIdStmt = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?');
const updateTodoStmt = db.prepare(`
  UPDATE todos
  SET
    title = ?,
    description = ?,
    priority = ?,
    due_date = ?,
    is_completed = ?,
    is_recurring = ?,
    recurrence_pattern = ?,
    reminder_minutes = ?,
    updated_at = datetime('now')
  WHERE id = ? AND user_id = ?
`);
const deleteTodoStmt = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?');
const updateTodoNotificationStampStmt = db.prepare(
  'UPDATE todos SET last_notification_sent = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?'
);
const listTodosNeedingNotificationStmt = db.prepare(`
  SELECT *
  FROM todos
  WHERE user_id = ?
    AND is_completed = 0
    AND due_date IS NOT NULL
    AND reminder_minutes IS NOT NULL
`);

const createSubtaskStmt = db.prepare(
  'INSERT INTO subtasks (todo_id, title, position) VALUES (?, ?, ?)'
);
const listSubtasksByTodoStmt = db.prepare(
  'SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC, id ASC'
);
const getSubtaskByIdStmt = db.prepare(
  'SELECT s.*, t.user_id FROM subtasks s JOIN todos t ON t.id = s.todo_id WHERE s.id = ?'
);
const updateSubtaskStmt = db.prepare(
  'UPDATE subtasks SET title = ?, is_completed = ?, updated_at = datetime(\'now\') WHERE id = ?'
);
const deleteSubtaskStmt = db.prepare('DELETE FROM subtasks WHERE id = ?');

const listTagsByUserStmt = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC');
const createTagStmt = db.prepare(
  'INSERT INTO tags (user_id, name, color, updated_at) VALUES (?, ?, ?, datetime(\'now\'))'
);
const getTagByNameStmt = db.prepare('SELECT * FROM tags WHERE user_id = ? AND name = ?');
const getTagByIdStmt = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?');
const updateTagStmt = db.prepare(
  'UPDATE tags SET name = ?, color = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?'
);
const deleteTagStmt = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?');

const listTagsForTodoStmt = db.prepare(`
  SELECT tg.*
  FROM tags tg
  JOIN todo_tags tt ON tt.tag_id = tg.id
  WHERE tt.todo_id = ? AND tg.user_id = ?
  ORDER BY tg.name ASC
`);
const attachTagToTodoStmt = db.prepare(
  'INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)'
);
const detachTagFromTodoStmt = db.prepare('DELETE FROM todo_tags WHERE todo_id = ? AND tag_id = ?');

const listTemplatesByUserStmt = db.prepare(
  'SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC'
);
const getTemplateByIdStmt = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?');
const createTemplateStmt = db.prepare(`
  INSERT INTO templates (
    user_id,
    name,
    description,
    category,
    title,
    todo_description,
    priority,
    is_recurring,
    recurrence_pattern,
    reminder_minutes,
    due_date_offset_days,
    subtasks_json,
    tag_ids_json,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);
const updateTemplateStmt = db.prepare(`
  UPDATE templates
  SET
    name = ?,
    description = ?,
    category = ?,
    title = ?,
    todo_description = ?,
    priority = ?,
    is_recurring = ?,
    recurrence_pattern = ?,
    reminder_minutes = ?,
    due_date_offset_days = ?,
    subtasks_json = ?,
    tag_ids_json = ?,
    updated_at = datetime('now')
  WHERE id = ? AND user_id = ?
`);
const deleteTemplateStmt = db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?');

const upsertHolidayStmt = db.prepare(
  "INSERT INTO holidays (date, name) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET name = excluded.name"
);
const listHolidaysStmt = db.prepare('SELECT * FROM holidays ORDER BY date ASC');
const listHolidaysByMonthStmt = db.prepare(
  'SELECT * FROM holidays WHERE date >= ? AND date <= ? ORDER BY date ASC'
);

export const userDB = {
  getByUsername(username: string): User | undefined {
    return getUserByUsernameStmt.get(username) as User | undefined;
  },

  getOrCreate(username: string): User {
    const existing = this.getByUsername(username);
    if (existing) {
      return existing;
    }

    try {
      const result = createUserStmt.run(username);
      return {
        id: Number(result.lastInsertRowid),
        username,
        created_at: new Date().toISOString(),
      };
    } catch {
      const fallback = this.getByUsername(username);
      if (fallback) {
        return fallback;
      }
      throw new Error('Unable to create user');
    }
  },
};

export const authenticatorDB = {
  countForUser(userId: number): number {
    const row = countAuthenticatorsForUserStmt.get(userId) as { count: number };
    return row.count;
  },

  getForUser(userId: number): AuthenticatorRecord[] {
    return getAuthenticatorsForUserStmt.all(userId) as AuthenticatorRecord[];
  },

  getByUserAndCredential(userId: number, credentialId: string): AuthenticatorRecord | undefined {
    return getAuthenticatorByUserAndCredentialStmt.get(userId, credentialId) as
      | AuthenticatorRecord
      | undefined;
  },

  create(input: {
    userId: number;
    credentialId: string;
    publicKey: Buffer;
    counter: number;
    transports: string | null;
    deviceType: string | null;
    backedUp: boolean | null;
  }): void {
    insertAuthenticatorStmt.run(
      input.userId,
      input.credentialId,
      input.publicKey,
      input.counter,
      input.transports,
      input.deviceType,
      input.backedUp === null ? null : input.backedUp ? 1 : 0
    );
  },

  updateCounter(id: number, counter: number): void {
    updateAuthenticatorCounterStmt.run(counter, id);
  },
};

export const challengeDB = {
  put(userId: number, challenge: string, kind: 'register' | 'login', ttlMs = 5 * 60 * 1000): void {
    pruneExpiredChallengesStmt.run(Date.now());
    insertChallengeStmt.run(userId, challenge, kind, Date.now() + ttlMs);
  },

  consume(userId: number, kind: 'register' | 'login'): string | null {
    pruneExpiredChallengesStmt.run(Date.now());
    const row = getChallengeStmt.get(userId, kind) as
      | { id: number; challenge: string; expires_at: number }
      | undefined;

    if (!row) {
      return null;
    }

    deleteChallengeByIdStmt.run(row.id);

    if (row.expires_at < Date.now()) {
      return null;
    }

    return row.challenge;
  },
};

export const todoDB = {
  listByUser(userId: number): Todo[] {
    return listTodosByUserStmt.all(userId) as Todo[];
  },

  getById(userId: number, id: number): Todo | undefined {
    return getTodoByIdStmt.get(id, userId) as Todo | undefined;
  },

  create(input: {
    userId: number;
    title: string;
    description: string | null;
    priority: Priority;
    dueDate: string | null;
    isCompleted: boolean;
    isRecurring: boolean;
    recurrencePattern: RecurrencePattern | null;
    reminderMinutes: number | null;
    lastNotificationSent: string | null;
  }): Todo {
    const result = createTodoStmt.run(
      input.userId,
      input.title,
      input.description,
      input.priority,
      input.dueDate,
      input.isCompleted ? 1 : 0,
      input.isRecurring ? 1 : 0,
      input.recurrencePattern,
      input.reminderMinutes,
      input.lastNotificationSent
    );

    return this.getById(input.userId, Number(result.lastInsertRowid)) as Todo;
  },

  update(
    userId: number,
    id: number,
    input: {
      title: string;
      description: string | null;
      priority: Priority;
      dueDate: string | null;
      isCompleted: boolean;
      isRecurring: boolean;
      recurrencePattern: RecurrencePattern | null;
      reminderMinutes: number | null;
    }
  ): Todo | null {
    const result = updateTodoStmt.run(
      input.title,
      input.description,
      input.priority,
      input.dueDate,
      input.isCompleted ? 1 : 0,
      input.isRecurring ? 1 : 0,
      input.recurrencePattern,
      input.reminderMinutes,
      id,
      userId
    );

    if (result.changes < 1) {
      return null;
    }

    return this.getById(userId, id) as Todo;
  },

  delete(userId: number, id: number): boolean {
    const result = deleteTodoStmt.run(id, userId);
    return result.changes > 0;
  },

  listNeedingNotifications(userId: number, nowIsoString: string): Todo[] {
    const nowTime = Date.parse(nowIsoString);
    const rows = listTodosNeedingNotificationStmt.all(userId) as Todo[];

    return rows.filter((todo) => {
      if (!todo.due_date || todo.reminder_minutes === null) {
        return false;
      }

      const dueTime = Date.parse(todo.due_date);
      const reminderAt = dueTime - todo.reminder_minutes * 60 * 1000;
      if (Number.isNaN(dueTime) || Number.isNaN(reminderAt)) {
        return false;
      }

      if (reminderAt > nowTime) {
        return false;
      }

      if (!todo.last_notification_sent) {
        return true;
      }

      const sentAt = Date.parse(todo.last_notification_sent);
      return Number.isNaN(sentAt) || sentAt < reminderAt;
    });
  },

  markNotificationSent(userId: number, todoIds: number[], sentAtIso: string): void {
    for (const todoId of todoIds) {
      updateTodoNotificationStampStmt.run(sentAtIso, todoId, userId);
    }
  },
};

export const subtaskDB = {
  listByTodo(todoId: number): Subtask[] {
    return listSubtasksByTodoStmt.all(todoId) as Subtask[];
  },

  create(todoId: number, title: string): Subtask {
    const position = this.listByTodo(todoId).length;
    const result = createSubtaskStmt.run(todoId, title, position);
    return getSubtaskByIdStmt.get(Number(result.lastInsertRowid)) as Subtask;
  },

  getById(id: number): (Subtask & { user_id: number }) | undefined {
    return getSubtaskByIdStmt.get(id) as (Subtask & { user_id: number }) | undefined;
  },

  update(id: number, title: string, isCompleted: boolean): boolean {
    const result = updateSubtaskStmt.run(title, isCompleted ? 1 : 0, id);
    return result.changes > 0;
  },

  delete(id: number): boolean {
    const result = deleteSubtaskStmt.run(id);
    return result.changes > 0;
  },
};

export const tagDB = {
  listByUser(userId: number): Tag[] {
    return listTagsByUserStmt.all(userId) as Tag[];
  },

  getByName(userId: number, name: string): Tag | undefined {
    return getTagByNameStmt.get(userId, name) as Tag | undefined;
  },

  getById(userId: number, id: number): Tag | undefined {
    return getTagByIdStmt.get(id, userId) as Tag | undefined;
  },

  create(userId: number, name: string, color: string): Tag {
    const result = createTagStmt.run(userId, name, color);
    return this.getById(userId, Number(result.lastInsertRowid)) as Tag;
  },

  update(userId: number, id: number, name: string, color: string): Tag | null {
    const result = updateTagStmt.run(name, color, id, userId);
    if (result.changes < 1) {
      return null;
    }
    return this.getById(userId, id) as Tag;
  },

  delete(userId: number, id: number): boolean {
    const result = deleteTagStmt.run(id, userId);
    return result.changes > 0;
  },

  listForTodo(userId: number, todoId: number): Tag[] {
    return listTagsForTodoStmt.all(todoId, userId) as Tag[];
  },

  attachToTodo(todoId: number, tagId: number): void {
    attachTagToTodoStmt.run(todoId, tagId);
  },

  detachFromTodo(todoId: number, tagId: number): void {
    detachTagFromTodoStmt.run(todoId, tagId);
  },
};

export const templateDB = {
  listByUser(userId: number): Template[] {
    return listTemplatesByUserStmt.all(userId) as Template[];
  },

  getById(userId: number, id: number): Template | undefined {
    return getTemplateByIdStmt.get(id, userId) as Template | undefined;
  },

  create(
    userId: number,
    input: {
      name: string;
      description: string | null;
      category: string | null;
      title: string;
      todoDescription: string | null;
      priority: Priority;
      isRecurring: boolean;
      recurrencePattern: RecurrencePattern | null;
      reminderMinutes: number | null;
      dueDateOffsetDays: number | null;
      subtasksJson: string | null;
      tagIdsJson: string | null;
    }
  ): Template {
    const result = createTemplateStmt.run(
      userId,
      input.name,
      input.description,
      input.category,
      input.title,
      input.todoDescription,
      input.priority,
      input.isRecurring ? 1 : 0,
      input.recurrencePattern,
      input.reminderMinutes,
      input.dueDateOffsetDays,
      input.subtasksJson,
      input.tagIdsJson
    );

    return this.getById(userId, Number(result.lastInsertRowid)) as Template;
  },

  update(
    userId: number,
    id: number,
    input: {
      name: string;
      description: string | null;
      category: string | null;
      title: string;
      todoDescription: string | null;
      priority: Priority;
      isRecurring: boolean;
      recurrencePattern: RecurrencePattern | null;
      reminderMinutes: number | null;
      dueDateOffsetDays: number | null;
      subtasksJson: string | null;
      tagIdsJson: string | null;
    }
  ): Template | null {
    const result = updateTemplateStmt.run(
      input.name,
      input.description,
      input.category,
      input.title,
      input.todoDescription,
      input.priority,
      input.isRecurring ? 1 : 0,
      input.recurrencePattern,
      input.reminderMinutes,
      input.dueDateOffsetDays,
      input.subtasksJson,
      input.tagIdsJson,
      id,
      userId
    );

    if (result.changes < 1) {
      return null;
    }

    return this.getById(userId, id) as Template;
  },

  delete(userId: number, id: number): boolean {
    const result = deleteTemplateStmt.run(id, userId);
    return result.changes > 0;
  },
};

export const holidayDB = {
  upsert(date: string, name: string): void {
    upsertHolidayStmt.run(date, name);
  },

  listAll(): Holiday[] {
    return listHolidaysStmt.all() as Holiday[];
  },

  listByMonth(startDate: string, endDate: string): Holiday[] {
    return listHolidaysByMonthStmt.all(startDate, endDate) as Holiday[];
  },
};
