import Link from 'next/link';
import { redirect } from 'next/navigation';

import LogoutButton from '@/app/components/LogoutButton';
import { getSession } from '@/lib/auth';

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-sm text-zinc-400">Signed in as</p>
          <p className="text-lg font-semibold">{session.username}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="mx-auto w-full max-w-4xl px-6 pb-10">
        <h1 className="text-3xl font-bold">Todo App</h1>
        <p className="mt-2 text-zinc-400">
          Feature 11 authentication is configured with WebAuthn passkeys and JWT sessions.
        </p>

        <div className="mt-6">
          <Link className="underline underline-offset-4" href="/calendar">
            Open protected calendar route
          </Link>
        </div>
      </section>
    </main>
  );
}
