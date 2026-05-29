# Feature 11 Authentication - Execution Checklist

Use this checklist while implementing PRP 11 in the app repository.

## Tracking
- Status: Not Started
- Owner:
- Start date:
- Target finish date:

## A. Setup and Foundations
- [ ] Environment variables configured: JWT_SECRET, RP_ID, RP_NAME, RP_ORIGIN
- [ ] users table created or verified
- [ ] authenticators table created or verified
- [ ] authenticator fields include credential and counter data
- [ ] auth dependencies installed

## B. Session Utility
- [ ] lib/auth.ts createSession implemented
- [ ] lib/auth.ts getSession implemented
- [ ] lib/auth.ts deleteSession implemented
- [ ] HTTP-only cookie configured
- [ ] 7-day expiry configured
- [ ] secure and sameSite configured for production

## C. API Endpoints
- [ ] POST /api/auth/register-options
- [ ] POST /api/auth/register-verify
- [ ] POST /api/auth/login-options
- [ ] POST /api/auth/login-verify
- [ ] POST /api/auth/logout
- [ ] GET /api/auth/me

## D. WebAuthn Correctness
- [ ] Challenge is short-lived and user-bound
- [ ] Credential duplication is prevented
- [ ] Counter handling uses null-safe fallback
- [ ] Counter updates after successful login
- [ ] RP checks enforce configured origin and RP ID

## E. Route Protection and UI
- [ ] middleware protects private routes
- [ ] unauthenticated user redirects to /login
- [ ] authenticated user redirects away from /login
- [ ] /login page supports register flow
- [ ] /login page supports login flow
- [ ] logout button wired and works

## F. Tests (Evaluation-Aligned)
- [ ] E2E: Register new user
- [ ] E2E: Login existing user
- [ ] E2E: Logout clears session
- [ ] E2E: Protected route redirect unauthenticated
- [ ] E2E: Login page redirect authenticated
- [ ] Unit: JWT create and verify

## G. Final Verification
- [ ] Registration works with passkey
- [ ] Login works with passkey
- [ ] Session persists for 7 days
- [ ] Logout clears session immediately
- [ ] Protected routes secured

## Notes
- Keep implementation scoped to PRP 11 and EVALUATION Feature 11.
- Do not add password fallback or social login in this phase.
