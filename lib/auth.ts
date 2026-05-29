export interface Session {
  userId: number;
  username: string;
}

export async function createSession(): Promise<void> {
  return;
}

export async function getSession(): Promise<Session | null> {
  return null;
}

export async function deleteSession(): Promise<void> {
  return;
}
