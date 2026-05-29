import 'server-only';

import path from 'node:path';
import Database from 'better-sqlite3';

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
