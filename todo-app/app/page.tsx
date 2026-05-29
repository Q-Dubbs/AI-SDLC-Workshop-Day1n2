import { redirect } from 'next/navigation';

import TodoAppClient from '@/app/components/TodoAppClient';
import { getSession } from '@/lib/auth';

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return <TodoAppClient username={session.username} />;
}
