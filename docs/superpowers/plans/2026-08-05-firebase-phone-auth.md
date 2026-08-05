# Firebase Phone Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect the existing Eldorado depth chart behind Firebase phone authentication for approved coaches.

**Architecture:** Add a small app-owned auth interface and Firebase compat adapter, then place an `AuthGate` above the unchanged local depth-chart store. Keep Firebase-specific code isolated so Firestore can be introduced independently in Phase 3.

**Tech Stack:** React 19, TypeScript, Vite, Firebase JavaScript SDK compat CDN, Firebase Authentication, Vitest, Testing Library.

## Global Constraints

- Preserve `LocalStorageDepthChartStore` and all current Phase 1 data behavior.
- Initial approved coach phone number: `+15057307634`.
- Production auth must keep reCAPTCHA enabled.
- No Firestore writes or migrations in this phase.

---

### Task 1: Pure phone and approval rules

**Files:**
- Create: `src/auth/phoneNumber.ts`
- Create: `src/auth/phoneNumber.test.ts`
- Create: `src/auth/approvedCoaches.ts`
- Create: `src/auth/approvedCoaches.test.ts`

**Interfaces:**
- Produces: `normalizeUsPhoneNumber(input: string): string | null`
- Produces: `isApprovedCoach(phoneNumber: string | null): boolean`

- [ ] Write failing tests for 10-digit, 11-digit, formatted, and invalid phone inputs.
- [ ] Implement minimal E.164 normalization.
- [ ] Write failing tests for approved and denied numbers.
- [ ] Implement the exact approved-number set.

### Task 2: Auth abstraction and Firebase adapter

**Files:**
- Create: `src/auth/AuthClient.ts`
- Create: `src/auth/firebaseCompat.ts`
- Create: `src/auth/firebaseConfig.ts`
- Modify: `index.html`

**Interfaces:**
- Produces: `AuthClient`, `AuthUser`, and `PhoneCodeSession`.
- Produces: `createFirebaseAuthClient(): AuthClient`.

- [ ] Define an auth interface independent of Firebase.
- [ ] Add typed global declarations for the Firebase compat APIs used.
- [ ] Load Firebase App/Auth compat scripts before the Vite entry module.
- [ ] Initialize the existing `depth-chart-1d8be` project and adapt auth state, SMS request, code confirmation, and sign-out.

### Task 3: Login and access gate

**Files:**
- Create: `src/auth/AuthGate.tsx`
- Create: `src/auth/AuthGate.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `AuthClient`, `normalizeUsPhoneNumber`, `isApprovedCoach`.
- Produces: approved authenticated children plus `phoneNumber` and `signOut` render values.

- [ ] Write component tests for phone entry, code confirmation, restored sessions, denied accounts, and sign-out.
- [ ] Implement the two-step sign-in card and auth observer.
- [ ] Add responsive Eldorado-branded login styles and accessible status/error messaging.

### Task 4: Protect the existing application

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/styles.css`
- Modify: `README.md`

**Interfaces:**
- `AuthGate` render callback supplies the approved user's phone number and sign-out function.

- [ ] Create Firebase auth and the local depth-chart store at startup.
- [ ] Render the existing `App` only after approved authentication.
- [ ] Add signed-in coach context and sign-out to the header.
- [ ] Document Firebase console prerequisites and Phase 2 limitations.

### Task 5: Verify and deliver

- [ ] Run targeted tests and full checks when dependencies are available.
- [ ] Push the feature branch and use Vercel's preview build as the production compilation check.
- [ ] Inspect build logs and the preview page.
- [ ] Merge only after the preview is ready and error-free.
