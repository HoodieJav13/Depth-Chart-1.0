# Firebase Phone Authentication Design

## Goal

Require an approved Eldorado coach to sign in with a phone number and SMS verification code before the existing local Phase 1 depth chart is shown.

## Scope

This phase adds Firebase initialization, phone authentication, invisible reCAPTCHA, server-backed coach approval, persistent auth observation, and a compact account menu. It deliberately leaves the existing `LocalStorageDepthChartStore` unchanged. Firestore depth-chart synchronization is the next phase.

## Architecture

- Load the official Firebase compat App, Auth, and Firestore bundles from Google's CDN so the project does not need a new npm dependency or lockfile change.
- Wrap Firebase's global API in `FirebaseAuthClient`, exposing a small app-owned interface.
- Keep phone normalization and display formatting as pure utilities.
- Render `AuthGate` above the existing `App`.
- After Firebase verifies the number, read `approvedCoaches/{E.164 phone number}` from the Firestore server. Only active records enter the app.
- Enforce the same approval model in `firestore.rules`; browser JavaScript is not the security boundary.
- Pass the approved coach display name, masked phone context, and sign-out callback into a compact account menu.

## User flow

1. Coach enters a US phone number, formatted as `(505) 730-7634` while typing.
2. Firebase runs invisible reCAPTCHA when the coach selects Continue.
3. Coach enters the six-digit verification code.
4. Firebase restores the session on later visits.
5. Firestore verifies an active approval record before the depth chart opens.
6. The header shows a compact coach account button; the full phone number is never displayed.

## Error handling

The login card shows actionable messages for invalid numbers, expired or bad codes, throttling, Firebase configuration problems, Firestore permission problems, connectivity failures, and denied coach access. A failed SMS request clears the verifier so retrying creates a fresh challenge.

## Responsive design

- The login card remains vertically centered on desktop and mobile.
- The large visible reCAPTCHA box is removed.
- The placeholder shield is replaced with a simpler Eldorado wordmark treatment.
- Mobile keeps the original 116px two-row app header; the account control sits in the upper-right instead of adding another row.

## Testing

- Pure tests cover normalization, live input formatting, and readable E.164 formatting.
- Component tests cover code requests, code confirmation, restored sessions, server approval denial, masked account context, and sign-out.
- Vercel runs lint, the complete Vitest suite, TypeScript compilation, and the production Vite build before accepting a preview or production deployment.
