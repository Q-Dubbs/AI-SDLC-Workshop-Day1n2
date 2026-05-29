import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/typescript-types';

import { createSession } from '@/lib/auth';
import { authenticatorDB, challengeDB, userDB } from '@/lib/db';
import { normalizeUsername } from '@/lib/validators';
import { getWebAuthnConfig } from '@/lib/webauthn';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: unknown;
      response?: AuthenticationResponseJSON;
    };

    const username = normalizeUsername(body.username);
    if (!username || !body.response) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const user = userDB.getByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Login verification failed' }, { status: 400 });
    }

    const expectedChallenge = challengeDB.consume(user.id, 'login');
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Login challenge expired' }, { status: 400 });
    }

    const authenticator = authenticatorDB.getByUserAndCredential(user.id, body.response.id);
    if (!authenticator) {
      return NextResponse.json({ error: 'Authenticator not found' }, { status: 404 });
    }

    const { rpID, expectedOrigin } = getWebAuthnConfig(request);

    const verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge,
      expectedRPID: rpID,
      expectedOrigin,
      credential: {
        id: authenticator.credential_id,
        publicKey: new Uint8Array(authenticator.public_key),
        counter: authenticator.counter ?? 0,
        transports: authenticator.transports
          ? (JSON.parse(authenticator.transports) as AuthenticatorTransportFuture[])
          : undefined,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: 'Login verification failed' }, { status: 400 });
    }

    authenticatorDB.updateCounter(authenticator.id, verification.authenticationInfo.newCounter);

    await createSession({ userId: user.id, username: user.username });

    return NextResponse.json({ verified: true });
  } catch (error) {
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Unable to verify login'
        : error instanceof Error
          ? `Unable to verify login: ${error.message}`
          : 'Unable to verify login';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
