import { NextResponse } from 'next/server';

export function notImplemented(scope: string) {
  return NextResponse.json(
    { message: `Scaffolded endpoint: ${scope}` },
    { status: 501 },
  );
}
