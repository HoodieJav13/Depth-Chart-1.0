# Firebase Phone Authentication Design

## Goal

Require an approved Eldorado coach to sign in with a phone number and SMS verification code before the existing local Phase 1 depth chart is shown.

## Scope

This phase adds Firebase initialization, phone authentication, reCAPTCHA, an approved-coach gate, persistent auth observation, and sign-out. It deliberately leaves the existing `LocalStorageDepthChartStore` unchanged. Firestore synchronization is the next phase.

## Architecture

- Load the official Firebase compat App and Auth bundles from Google's CDN so the project does not need a new npm dependency or lockfile change.
- Wrap Firebase's global API in `FirebaseAuthClient`, exposing a small app-owned interface.
- Keep phone formatting and approved-coach checks as pure utilities.
- Render `AuthGate` above the existing `App`. Authenticated approved coaches enter the app; unapproved numbers are signed out immediately.
- Pass the signed-in phone number and sign-out callback into `AppHeader`.

## Approved coach

The initial approved number is `+15057307634`. Additional coaches will be added intentionally in a later change.

## User flow

1. Coach enters a US phone number.
2. The app normalizes it to E.164 format.
3. Coach completes visible reCAPTCHA and requests a code.
4. Coach enters the six-digit Firebase verification code.
5. Firebase restores the session on later visits.
6. If the verified phone number is not approved, the app signs the account out and blocks access.

## Error handling

The login card shows actionable messages for invalid numbers, unsolved or expired reCAPTCHA, throttling, bad verification codes, configuration problems, and denied coach access. A failed SMS request clears the verifier so retrying creates a fresh challenge.

## Testing

- Pure tests cover US phone normalization and approved-number checks.
- Component tests cover signed-out, code-sent, authenticated, denied, and sign-out states through a fake `AuthClient`.
- The Vercel preview build provides the final TypeScript and production-bundle check.
