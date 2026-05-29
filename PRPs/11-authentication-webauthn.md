# PRP 11: Authentication with WebAuthn and Passkeys

## Feature Overview
Implement passwordless authentication using WebAuthn and secure session management for protected routes.

## Requirement Sources
- PRP index reference: PRPs/README.md
- Evaluation baseline: EVALUATION.md (Feature 11)
- User behavior reference: USER_GUIDE.md (Section 1)
- Engineering pattern reference: .github/copilot-instructions.md

## User Stories
- As a user, I can register using passkey/biometrics instead of a password.
- As a user, I can sign in securely with my registered passkey.
- As a user, I can stay signed in with a secure session and log out when needed.

## User Flow
1. User enters identifier and requests registration options.
2. Client invokes WebAuthn create ceremony.
3. Client sends attestation response for server verification.
4. Server stores authenticator and creates session.
5. Login follows options + assertion + verification flow.
6. Middleware protects app routes and redirects unauthenticated users.

## Technical Requirements
### Data Model
Required tables:
- users
- authenticators

Authenticator fields should include:
- credential id
- public key
- counter
- transports
- device type/backed up flags if supported

### API Contract
- POST /api/auth/register-options
- POST /api/auth/register-verify
- POST /api/auth/login-options
- POST /api/auth/login-verify
- POST /api/auth/logout
- GET /api/auth/me

### Session Management
- Auth helper in lib/auth.ts:
  - createSession
  - getSession
  - deleteSession
- Use JWT-backed HTTP-only cookie.
- Session expiry target: 7 days.
- Cookie should use secure and sameSite settings appropriate for production HTTPS.

### Route Protection
- middleware.ts protects private routes (for example / and /calendar).
- Unauthenticated users redirected to login.
- Authenticated users can be redirected away from login if already signed in.

### Security and WebAuthn Details
- Relying party settings required: RP_ID, RP_NAME, RP_ORIGIN.
- Challenges must be short-lived and user-bound.
- Signature counter handling should use safe defaulting for null/undefined counters.

## Edge Cases
- Device without platform authenticator.
- Credential already registered.
- Counter mismatch or replay attempt.
- RP origin mismatch in misconfigured environments.

## Acceptance Criteria (Evaluation-Aligned)
- [ ] Registration works with passkey.
- [ ] Login works with passkey.
- [ ] Session persists for 7 days.
- [ ] Logout clears session immediately.
- [ ] Protected routes enforce authentication.

## Testing Requirements
### E2E
- [ ] Register new user using virtual authenticator.
- [ ] Login existing user.
- [ ] Logout and verify session removal.
- [ ] Access protected route without session and verify redirect.
- [ ] Access login while authenticated and verify redirect behavior.

### Unit
- [ ] JWT create/verify tests.
- [ ] Session cookie options tests.
- [ ] Authenticator counter handling tests.

## Out of Scope
- Password-based fallback authentication.
- Social login providers.

## Success Metrics
- Auth flow success above 99 percent in supported browsers.
- Zero critical authentication bypass vulnerabilities.
