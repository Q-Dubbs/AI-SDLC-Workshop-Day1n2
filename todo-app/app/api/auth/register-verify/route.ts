import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/typescript-types';

import { createSession } from '@/lib/auth';
import { authenticatorDB, challengeDB, userDB } from '@/lib/db';
import { normalizeUsername } from '@/lib/validators';
import { getWebAuthnConfig } from '@/lib/webauthn';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: unknown;
      response?: RegistrationResponseJSON;
    };

    const username = normalizeUsername(body.username);
    if (!username || !body.response) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const user = userDB.getByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
    }

    const expectedChallenge = challengeDB.consume(user.id, 'register');
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Registration challenge expired' }, { status: 400 });
    }

    const { rpID, expectedOrigin } = getWebAuthnConfig(request);
    const verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge,
      expectedRPID: rpID,
      expectedOrigin,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
    }

    const credential = verification.registrationInfo.credential;
    const credentialId = credential.id;

    if (authenticatorDB.getByUserAndCredential(user.id, credentialId)) {
      return NextResponse.json({ error: 'Credential already exists' }, { status: 409 });
    }

    authenticatorDB.create({
      userId: user.id,
      credentialId,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ? JSON.stringify(credential.transports) : null,
      deviceType: verification.registrationInfo.credentialDeviceType,
      backedUp: verification.registrationInfo.credentialBackedUp,
    });

    await createSession({ userId: user.id, username: user.username });

    return NextResponse.json({ verified: true });
  } catch (error) {
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Unable to verify registration'
        : error instanceof Error
          ? `Unable to verify registration: ${error.message}`
          : 'Unable to verify registration';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
