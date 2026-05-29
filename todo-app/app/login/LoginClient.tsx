'use client';

import { useMemo, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

export default function LoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const normalizedUsername = useMemo(() => username.trim(), [username]);

  async function handleRegister() {
    if (!normalizedUsername) {
      setMessage('Username is required.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const optionsResponse = await fetch('/api/auth/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername }),
      });

      const optionsPayload = (await optionsResponse.json()) as {
        options?: unknown;
        error?: string;
      };

      if (!optionsResponse.ok || !optionsPayload.options) {
        throw new Error(optionsPayload.error ?? 'Unable to start registration');
      }

      const credential = await startRegistration({ optionsJSON: optionsPayload.options as never });

      const verifyResponse = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername, response: credential }),
      });

      const verifyPayload = (await verifyResponse.json()) as { verified?: boolean; error?: string };
      if (!verifyResponse.ok || !verifyPayload.verified) {
        throw new Error(verifyPayload.error ?? 'Registration failed');
      }

      router.replace('/');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin() {
    if (!normalizedUsername) {
      setMessage('Username is required.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const optionsResponse = await fetch('/api/auth/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername }),
      });

      const optionsPayload = (await optionsResponse.json()) as {
        options?: unknown;
        error?: string;
      };

      if (!optionsResponse.ok || !optionsPayload.options) {
        throw new Error(optionsPayload.error ?? 'Unable to start login');
      }

      const assertion = await startAuthentication({ optionsJSON: optionsPayload.options as never });

      const verifyResponse = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername, response: assertion }),
      });

      const verifyPayload = (await verifyResponse.json()) as { verified?: boolean; error?: string };
      if (!verifyResponse.ok || !verifyPayload.verified) {
        throw new Error(verifyPayload.error ?? 'Login failed');
      }

      router.replace('/');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-3xl font-bold">Passkey Login</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Register once with a passkey, then login without passwords.
        </p>

        <label className="mt-8 text-sm font-medium" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          className="mt-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none ring-emerald-500 focus:ring"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="alice"
          autoComplete="username"
          disabled={isLoading}
        />

        {message ? <p className="mt-3 text-sm text-rose-400">{message}</p> : null}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-zinc-900 disabled:opacity-50"
            disabled={isLoading}
            onClick={handleRegister}
          >
            {isLoading ? 'Working...' : 'Register'}
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-600 px-4 py-2 font-medium disabled:opacity-50"
            disabled={isLoading}
            onClick={handleLogin}
          >
            {isLoading ? 'Working...' : 'Login'}
          </button>
        </div>
      </div>
    </main>
  );
}
