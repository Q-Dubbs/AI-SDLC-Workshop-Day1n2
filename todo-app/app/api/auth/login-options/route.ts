import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
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

    const user = userDB.getByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Unable to start login' }, { status: 400 });
    }

    const authenticators = authenticatorDB.getForUser(user.id);
    if (authenticators.length === 0) {
      return NextResponse.json({ error: 'Unable to start login' }, { status: 400 });
    }

    const { rpID } = getWebAuthnConfig();

    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60_000,
      userVerification: 'preferred',
      allowCredentials: authenticators.map((item) => ({
        id: item.credential_id,
        transports: item.transports
          ? (JSON.parse(item.transports) as AuthenticatorTransportFuture[])
          : undefined,
      })),
    });

    challengeDB.put(user.id, options.challenge, 'login');

    return NextResponse.json({ options });
  } catch {
    return NextResponse.json({ error: 'Unable to create login options' }, { status: 500 });
  }
}
