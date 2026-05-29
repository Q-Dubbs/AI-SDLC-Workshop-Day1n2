'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 px-3 py-1 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
