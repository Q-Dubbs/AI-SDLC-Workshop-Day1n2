import 'server-only';

import path from 'node:path';
import Database from 'better-sqlite3';
import {
  calculateNextRecurringDueDate,
  getSingaporeNow,
  toIsoString,
} from '@/lib/timezone';

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

export type Priority = 'high' | 'medium' | 'low';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: number;
  due_date: string | null;
  priority: Priority;
  is_recurring: number;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoWithProgress extends Todo {
  total_subtasks: number;
  completed_subtasks: number;
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: number;
  position: number;
  created_at: string;
}

export interface ReminderCandidate {
  id: number;
  title: string;
  due_date: string;
  priority: Priority;
  reminder_minutes: number;
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

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurrence_pattern TEXT,
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
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
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

    CREATE INDEX IF NOT EXISTS idx_authenticators_user_id ON authenticators(user_id);
    CREATE INDEX IF NOT EXISTS idx_challenges_user_id_kind ON webauthn_challenges(user_id, kind);
    CREATE INDEX IF NOT EXISTS idx_challenges_expires_at ON webauthn_challenges(expires_at);
    CREATE INDEX IF NOT EXISTS idx_todos_user_id_completed ON todos(user_id, completed);
    CREATE INDEX IF NOT EXISTS idx_todos_user_id_due_date ON todos(user_id, due_date);
    CREATE INDEX IF NOT EXISTS idx_todos_user_id_priority ON todos(user_id, priority);
    CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id_position ON subtasks(todo_id, position);
  `);

  try {
    db.exec(`ALTER TABLE todos ADD COLUMN last_notification_sent TEXT`);
  } catch {
    // Column already exists in upgraded databases.
  }

  db.exec(`
    UPDATE todos
    SET priority = 'medium'
    WHERE priority IS NULL OR lower(priority) NOT IN ('high', 'medium', 'low');

    UPDATE todos
    SET priority = lower(priority)
    WHERE priority IS NOT NULL;
  `);
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

const listTodosStmt = db.prepare(`
  SELECT
    t.*,
    COUNT(s.id) as total_subtasks,
    SUM(CASE WHEN s.completed = 1 THEN 1 ELSE 0 END) as completed_subtasks
  FROM todos t
  LEFT JOIN subtasks s ON s.todo_id = t.id
  WHERE t.user_id = ?
  GROUP BY t.id
  ORDER BY
    CASE t.priority
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      ELSE 3
    END ASC,
    CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END ASC,
    t.due_date ASC,
    t.created_at ASC
`);

const getTodoByIdForUserStmt = db.prepare(`
  SELECT
    t.*,
    COUNT(s.id) as total_subtasks,
    SUM(CASE WHEN s.completed = 1 THEN 1 ELSE 0 END) as completed_subtasks
  FROM todos t
  LEFT JOIN subtasks s ON s.todo_id = t.id
  WHERE t.id = ? AND t.user_id = ?
  GROUP BY t.id
`);

const createTodoStmt = db.prepare(`
  INSERT INTO todos (
    user_id,
    title,
    completed,
    due_date,
    priority,
    is_recurring,
    recurrence_pattern,
    reminder_minutes,
    last_notification_sent,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateTodoStmt = db.prepare(`
  UPDATE todos
  SET
    title = ?,
    completed = ?,
    due_date = ?,
    priority = ?,
    is_recurring = ?,
    recurrence_pattern = ?,
    reminder_minutes = ?,
    updated_at = ?
  WHERE id = ? AND user_id = ?
`);

const deleteTodoStmt = db.prepare(
  'DELETE FROM todos WHERE id = ? AND user_id = ?'
);

const getSubtasksForTodoStmt = db.prepare(
  'SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC, id ASC'
);

const getSubtaskByIdForUserStmt = db.prepare(`
  SELECT s.*, t.user_id
  FROM subtasks s
  INNER JOIN todos t ON t.id = s.todo_id
  WHERE s.id = ?
`);

const getSubtaskCountForTodoStmt = db.prepare(
  'SELECT COUNT(*) as count FROM subtasks WHERE todo_id = ?'
);

const createSubtaskStmt = db.prepare(`
  INSERT INTO subtasks (todo_id, title, completed, position, created_at)
  VALUES (?, ?, 0, ?, ?)
`);

const updateSubtaskStmt = db.prepare(`
  UPDATE subtasks
  SET title = ?, completed = ?, position = ?
  WHERE id = ?
`);

const deleteSubtaskStmt = db.prepare('DELETE FROM subtasks WHERE id = ?');

const findDueReminderCandidatesStmt = db.prepare(`
  SELECT id, title, due_date, priority, reminder_minutes, last_notification_sent
  FROM todos
  WHERE user_id = ?
    AND completed = 0
    AND due_date IS NOT NULL
    AND reminder_minutes IS NOT NULL
`);

const markNotificationSentStmt = db.prepare(
  'UPDATE todos SET last_notification_sent = ?, updated_at = ? WHERE id = ? AND user_id = ?'
);

const getTodoTagsStmt = db.prepare(
  'SELECT tag_id FROM todo_tags WHERE todo_id = ? ORDER BY tag_id ASC'
);

const insertTodoTagStmt = db.prepare(
  'INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)'
);

const completeRecurringTodoTx = db.transaction(
  (
    userId: number,
    todoId: number,
    completedAtIso: string,
    nextDueDateIso: string
  ): { current: TodoWithProgress; next: TodoWithProgress } | null => {
    const existing = getTodoByIdForUserStmt.get(todoId, userId) as TodoWithProgress | undefined;
    if (!existing || existing.completed === 1) {
      return null;
    }

    updateTodoStmt.run(
      existing.title,
      1,
      existing.due_date,
      existing.priority,
      existing.is_recurring,
      existing.recurrence_pattern,
      existing.reminder_minutes,
      completedAtIso,
      todoId,
      userId
    );

    const createResult = createTodoStmt.run(
      userId,
      existing.title,
      0,
      nextDueDateIso,
      existing.priority,
      existing.is_recurring,
      existing.recurrence_pattern,
      existing.reminder_minutes,
      null,
      completedAtIso,
      completedAtIso
    );
    const nextId = Number(createResult.lastInsertRowid);

    const tagRows = getTodoTagsStmt.all(todoId) as Array<{ tag_id: number }>;
    for (const row of tagRows) {
      insertTodoTagStmt.run(nextId, row.tag_id);
    }

    const current = getTodoByIdForUserStmt.get(todoId, userId) as TodoWithProgress;
    const next = getTodoByIdForUserStmt.get(nextId, userId) as TodoWithProgress;

    return { current, next };
  }
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
  listForUser(userId: number): TodoWithProgress[] {
    return listTodosStmt.all(userId).map((todo) => ({
      ...(todo as TodoWithProgress),
      total_subtasks: Number((todo as TodoWithProgress).total_subtasks ?? 0),
      completed_subtasks: Number((todo as TodoWithProgress).completed_subtasks ?? 0),
    }));
  },

  getByIdForUser(todoId: number, userId: number): TodoWithProgress | undefined {
    const todo = getTodoByIdForUserStmt.get(todoId, userId) as TodoWithProgress | undefined;
    if (!todo) {
      return undefined;
    }

    return {
      ...todo,
      total_subtasks: Number(todo.total_subtasks ?? 0),
      completed_subtasks: Number(todo.completed_subtasks ?? 0),
    };
  },

  create(input: {
    userId: number;
    title: string;
    dueDate: string | null;
    priority: Priority;
    isRecurring: boolean;
    recurrencePattern: RecurrencePattern | null;
    reminderMinutes: number | null;
  }): TodoWithProgress {
    const nowIso = toIsoString(getSingaporeNow());
    const result = createTodoStmt.run(
      input.userId,
      input.title,
      0,
      input.dueDate,
      input.priority,
      input.isRecurring ? 1 : 0,
      input.recurrencePattern,
      input.reminderMinutes,
      null,
      nowIso,
      nowIso
    );

    return this.getByIdForUser(Number(result.lastInsertRowid), input.userId) as TodoWithProgress;
  },

  update(
    todoId: number,
    userId: number,
    input: {
      title: string;
      completed: boolean;
      dueDate: string | null;
      priority: Priority;
      isRecurring: boolean;
      recurrencePattern: RecurrencePattern | null;
      reminderMinutes: number | null;
    }
  ): TodoWithProgress | undefined {
    const nowIso = toIsoString(getSingaporeNow());
    const result = updateTodoStmt.run(
      input.title,
      input.completed ? 1 : 0,
      input.dueDate,
      input.priority,
      input.isRecurring ? 1 : 0,
      input.recurrencePattern,
      input.reminderMinutes,
      nowIso,
      todoId,
      userId
    );

    if (result.changes === 0) {
      return undefined;
    }

    return this.getByIdForUser(todoId, userId);
  },

  delete(todoId: number, userId: number): boolean {
    const result = deleteTodoStmt.run(todoId, userId);
    return result.changes > 0;
  },

  completeRecurring(todoId: number, userId: number): { current: TodoWithProgress; next: TodoWithProgress } | null {
    const existing = this.getByIdForUser(todoId, userId);
    if (!existing || existing.completed === 1 || existing.is_recurring !== 1) {
      return null;
    }
    if (!existing.due_date || !existing.recurrence_pattern) {
      return null;
    }

    const nextDueDate = calculateNextRecurringDueDate(existing.due_date, existing.recurrence_pattern);
    if (!nextDueDate) {
      return null;
    }

    const nowIso = toIsoString(getSingaporeNow());
    return completeRecurringTodoTx(userId, todoId, nowIso, toIsoString(nextDueDate));
  },
};

export const subtaskDB = {
  listForTodo(todoId: number): Subtask[] {
    return getSubtasksForTodoStmt.all(todoId) as Subtask[];
  },

  create(todoId: number, title: string): Subtask {
    const row = getSubtaskCountForTodoStmt.get(todoId) as { count: number };
    const nowIso = toIsoString(getSingaporeNow());
    const result = createSubtaskStmt.run(todoId, title, row.count, nowIso);

    const created = db
      .prepare('SELECT * FROM subtasks WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as Subtask;
    return created;
  },

  update(
    subtaskId: number,
    input: { title: string; completed: boolean; position: number }
  ): Subtask | undefined {
    const result = updateSubtaskStmt.run(
      input.title,
      input.completed ? 1 : 0,
      input.position,
      subtaskId
    );
    if (result.changes === 0) {
      return undefined;
    }

    return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId) as Subtask;
  },

  delete(subtaskId: number): boolean {
    const result = deleteSubtaskStmt.run(subtaskId);
    return result.changes > 0;
  },

  getByIdForUser(subtaskId: number, userId: number): (Subtask & { user_id: number }) | undefined {
    const row = getSubtaskByIdForUserStmt.get(subtaskId) as
      | (Subtask & { user_id: number })
      | undefined;
    if (!row || row.user_id !== userId) {
      return undefined;
    }

    return row;
  },
};

export const notificationDB = {
  getDueReminderCandidates(userId: number): ReminderCandidate[] {
    const nowMs = getSingaporeNow().getTime();
    const rows = findDueReminderCandidatesStmt.all(userId) as Array<ReminderCandidate & {
      last_notification_sent?: string | null;
    }>;

    return rows.filter((row) => {
      const dueDateMs = new Date(row.due_date).getTime();
      if (Number.isNaN(dueDateMs)) {
        return false;
      }

      const triggerMs = dueDateMs - row.reminder_minutes * 60_000;
      if (nowMs < triggerMs) {
        return false;
      }

      if (!row.last_notification_sent) {
        return true;
      }

      const sentMs = new Date(row.last_notification_sent).getTime();
      if (Number.isNaN(sentMs)) {
        return true;
      }

      return sentMs < triggerMs;
    });
  },

  markNotificationSent(todoId: number, userId: number): void {
    const nowIso = toIsoString(getSingaporeNow());
    markNotificationSentStmt.run(nowIso, nowIso, todoId, userId);
  },
};
