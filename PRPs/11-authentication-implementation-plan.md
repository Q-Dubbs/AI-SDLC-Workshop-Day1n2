# Feature 11 Authentication - Implementation Plan

Goal: implement WebAuthn passkey authentication with JWT sessions, route protection, and tests.

Source references:
- PRP requirements: PRPs/11-authentication-webauthn.md
- Evaluation checklist: EVALUATION.md (Feature 11)

## Scope Boundaries
In scope:
- Passkey register and login
- Session cookie lifecycle
- Protected route middleware
- Login page and logout action
- E2E and unit tests listed in evaluation

Out of scope:
- Password authentication
- Social login

## Preconditions
1. Use the application repository containing Next.js source code.
2. Ensure these folders exist: app, lib, tests.
3. Set required environment variables:
   - JWT_SECRET
   - RP_ID
   - RP_NAME
   - RP_ORIGIN

## Phase 1 - Data and Dependency Foundations
1. Install or confirm auth dependencies:
   - @simplewebauthn/server
   - @simplewebauthn/browser
   - jsonwebtoken (or equivalent JWT utility)
2. Add or verify database tables:
   - users
   - authenticators
3. Ensure authenticator fields include:
   - credential_id
   - public_key
   - counter
   - transports
   - device_type
   - backed_up
4. Add indexes and uniqueness rules for credential ownership and lookup.

Definition of done:
- users and authenticators schema exists and migrations run cleanly.

## Phase 2 - Session Layer
1. Implement session helper in lib/auth.ts:
   - createSession
   - getSession
   - deleteSession
2. Use HTTP-only cookie.
3. Set expiry to 7 days.
4. Set secure and sameSite for production-safe behavior.

Definition of done:
- Session can be created, read, and cleared.
- Expired or invalid tokens are rejected.

## Phase 3 - Registration API
1. Create POST /api/auth/register-options.
2. Create POST /api/auth/register-verify.
3. Ensure challenge is user-bound and short-lived.
4. Persist authenticator after successful attestation verification.
5. Create session on successful registration.

Definition of done:
- New user registers with passkey and lands authenticated.

## Phase 4 - Login API
1. Create POST /api/auth/login-options.
2. Create POST /api/auth/login-verify.
3. Verify assertion against stored authenticator.
4. Handle counter safely with null-safe fallback:
   - counter: authenticator.counter ?? 0
5. Update stored counter after successful login.
6. Create session cookie on success.

Definition of done:
- Existing user can sign in with passkey.

## Phase 5 - Auth Utility Endpoints and Middleware
1. Create POST /api/auth/logout.
2. Create GET /api/auth/me.
3. Update middleware.ts to protect private routes:
   - redirect unauthenticated users to /login
   - redirect authenticated users away from /login
4. Ensure protected routes include at minimum / and /calendar.

Definition of done:
- Protected route behavior and logout behavior match PRP acceptance criteria.

## Phase 6 - UI Integration
1. Create or update login page at /login.
2. Implement register flow using browser WebAuthn create ceremony.
3. Implement login flow using browser WebAuthn get ceremony.
4. Add logout button in authenticated shell.
5. Add loading and error states for each auth action.

Definition of done:
- End user can complete register, login, logout without manual API calls.

## Phase 7 - Tests Required by Evaluation
1. E2E tests:
   - Register new user with virtual authenticator
   - Login existing user
   - Logout clears session
   - Protected route redirects unauthenticated user
   - Login page redirects authenticated user
2. Unit tests:
   - JWT create and verify
   - Session cookie options
   - Authenticator counter handling

Definition of done:
- All Feature 11 tests pass consistently.

## Phase 8 - Security and Release Gate
1. Validate RP settings against deployed domain and origin.
2. Verify challenge lifecycle and replay resistance.
3. Verify no sensitive logs.
4. Run lint, type-check, build, and auth tests.
5. Complete and record Feature 11 checklist in EVALUATION.md.

Definition of done:
- Feature 11 marked complete and verified.

## Copilot Prompt Sequence
Use these prompts one phase at a time to reduce noisy output.

Prompt 1:
"Implement Feature 11 Phase 1 and Phase 2 from PRPs/11-authentication-implementation-plan.md in this Next.js app. Keep changes minimal and production-safe."

Prompt 2:
"Implement Feature 11 Phase 3 and Phase 4 WebAuthn API routes using @simplewebauthn and safe counter handling."

Prompt 3:
"Implement Feature 11 Phase 5 and Phase 6 middleware, /login page, /api/auth/me, and logout integration."

Prompt 4:
"Implement Feature 11 Phase 7 and Phase 8 tests and hardening so EVALUATION.md Feature 11 can be marked complete."
