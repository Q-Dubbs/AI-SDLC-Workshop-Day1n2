"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={reset} type="button">
        Try again
      </button>
    </main>
  );
}