export type Session = {
  userId: number;
  username: string;
};

export async function createSession(_: Session): Promise<void> {
  // TODO: create JWT and set HTTP-only cookie.
}

export async function getSession(): Promise<Session | null> {
  // TODO: read cookie and verify JWT.
  return null;
}

export async function deleteSession(): Promise<void> {
  // TODO: clear session cookie.
}