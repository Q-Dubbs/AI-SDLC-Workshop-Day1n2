# PRP-11: Authentication (WebAuthn)

## Objective
Implement passkey-based registration/login with protected session-based access.

## Scope
- DB: `users`, `authenticators`
- API: register options/verify, login options/verify, logout, me
- Auth utilities: session create/get/delete
- Middleware route protection
- Login page + register/login/logout UX
- HTTP-only session cookie (7-day expiry)

## Test Plan
- E2E with virtual authenticator for register/login/logout/protected routes
- Unit: token/session encode/decode verification

## Definition of Done
- Passkey auth works in supported browsers
- Protected routes redirect unauthenticated users
