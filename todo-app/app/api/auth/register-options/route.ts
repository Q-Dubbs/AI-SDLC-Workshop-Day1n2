import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/typescript-types';

import { authenticatorDB, challengeDB, userDB } from '@/lib/db';
import { normalizeUsername } from '@/lib/validators';
import { getWebAuthnConfig } from '@/lib/webauthn';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: unknown };
    const username = normalizeUsername(body.username);

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const user = userDB.getOrCreate(username);
    const existingCount = authenticatorDB.countForUser(user.id);

    if (existingCount > 0) {
      return NextResponse.json({ error: 'Unable to start registration' }, { status: 400 });
    }

    const { rpID, rpName } = getWebAuthnConfig(request);

    const options = await generateRegistrationOptions({
      rpID,
      rpName,
      userName: user.username,
      userID: new TextEncoder().encode(String(user.id)),
      timeout: 60_000,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: authenticatorDB.getForUser(user.id).map((item) => ({
        id: item.credential_id,
        transports: item.transports
          ? (JSON.parse(item.transports) as AuthenticatorTransportFuture[])
          : undefined,
      })),
    });

    challengeDB.put(user.id, options.challenge, 'register');

    return NextResponse.json({ options });
  } catch (error) {
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Unable to create registration options'
        : error instanceof Error
          ? `Unable to create registration options: ${error.message}`
          : 'Unable to create registration options';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
