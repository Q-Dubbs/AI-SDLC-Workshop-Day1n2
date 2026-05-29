import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <h1 className="text-2xl font-bold">Calendar</h1>
      <p className="mt-2 text-zinc-400">Protected route is active for {session.username}.</p>
    </main>
  );
}
