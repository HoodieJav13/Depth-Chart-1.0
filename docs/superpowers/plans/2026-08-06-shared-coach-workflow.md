# Shared Coach Depth Chart Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the authenticated local prototype into a shared, safe, coach-ready depth chart with real-time syncing, undo/save feedback, roster maintenance, print output, snapshots, and clearer mobile movement.

**Architecture:** Preserve the existing `DepthChartStore` boundary and expand it with roster, snapshot, migration, undo, and status operations. Implement a Firebase-backed store that owns Firestore listeners and writes while retaining the local store as migration source and offline fallback. Keep user-facing controls in focused components rather than growing `App.tsx` into a single large screen.

**Tech Stack:** React 19, TypeScript, Vite, Firebase Authentication compat, Cloud Firestore compat, Vitest, Testing Library, CSS print media.

## Global Constraints

- Preserve offense and defense as independent assignments sharing one roster.
- Preserve all existing player IDs and current browser data during first migration.
- A failed Firestore connection must never erase local data.
- Mobile movement uses selection and explicit targets, not drag-and-drop.
- Print output uses a white background with minimal orange ink.
- Vercel must run ESLint, all tests, TypeScript, and the production build.
- No special teams, player accounts, messaging, attendance, statistics, playbook drawing, or full admin dashboard.

---

### Task 1: Versioned shared state and store contract

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/store/DepthChartStore.ts`
- Create: `src/store/stateModel.ts`
- Create: `src/store/stateModel.test.ts`

**Interfaces:**
- Produces `DepthChartState` version 2 with roster overrides, archived IDs, revision metadata, and migration marker.
- Produces `StoreStatus`, `DepthChartSnapshot`, `UpdatePlayerInput`, `ArchivePlayerInput`, and `RestoreSnapshotInput`.
- Expands `DepthChartStore` with status subscription, update/archive, undo, migration, and snapshot operations.

- [ ] Write failing tests that upgrade version 1 local state into a version 2 state without changing assignments or player IDs.
- [ ] Implement deterministic state normalization and cloning helpers.
- [ ] Add the expanded store contract and compile-time types.
- [ ] Run targeted tests and verify the old local store tests identify every required compatibility update.

### Task 2: Local store parity and undo

**Files:**
- Modify: `src/store/LocalStorageDepthChartStore.ts`
- Modify: `src/store/LocalStorageDepthChartStore.test.ts`

**Interfaces:**
- Implements every expanded `DepthChartStore` operation locally.
- Produces one-level `undoLastChange()` semantics.
- Emits `StoreStatus` updates.

- [ ] Add failing tests for player editing, duplicate prevention, archive behavior, undo, and local snapshots.
- [ ] Implement the minimal local behavior while preserving the existing storage key through version migration.
- [ ] Verify all local store tests pass.

### Task 3: Firestore shared store and one-time migration

**Files:**
- Create: `src/store/FirestoreDepthChartStore.ts`
- Create: `src/store/FirestoreDepthChartStore.test.ts`
- Modify: `src/auth/firebaseCompat.ts`
- Modify: `index.html`
- Modify: `firestore.rules`

**Interfaces:**
- `FirestoreDepthChartStore` consumes the Firebase compat namespace and authenticated coach profile.
- Uses `teams/eldorado-freshman/depthChart/current` as the canonical document.
- Uses `teams/eldorado-freshman/snapshots/{snapshotId}` for named snapshots.
- Provides `migrateFromLocal(localState)` only when the shared document is absent.

- [ ] Write failing adapter tests using a small fake Firestore implementation for listener updates, transactions, migration, and rejected writes.
- [ ] Load the Firestore compat bundle and expose a typed Firestore factory.
- [ ] Implement canonical state listeners and writes with server timestamps and coach metadata.
- [ ] Implement safe migration that creates the shared state once and never overwrites an existing shared chart.
- [ ] Tighten Firestore rules so only active approved coaches can read/write the team chart and snapshots.

### Task 4: Save status, undo, and migration UI

**Files:**
- Modify: `src/hooks/useDepthChart.ts`
- Create: `src/components/SaveStatus.tsx`
- Create: `src/components/UndoBar.tsx`
- Create: `src/components/MigrationNotice.tsx`
- Modify: `src/App.tsx`
- Modify: `src/auth.css`
- Modify: `src/styles.css`

**Interfaces:**
- `useDepthChart` returns `status`, `lastError`, and `canUndo`.
- UI surfaces `Saving…`, `Saved`, `Offline`, and `Retry` states.

- [ ] Write component tests for save state, failed write retry, migration choice, and undo.
- [ ] Add status subscription and error-safe loading to the hook.
- [ ] Add compact header save status and one-level undo notification.
- [ ] Add first-login migration notice when meaningful local data exists and the shared document was newly created.

### Task 5: Roster maintenance

**Files:**
- Create: `src/components/PlayerEditorDialog.tsx`
- Create: `src/components/PlayerActionsMenu.tsx`
- Modify: `src/components/UnassignedDrawer.tsx`
- Modify: `src/components/MobileDepthList.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes `updatePlayer` and `archivePlayer` store operations.
- Search filters roster by player name or jersey number.

- [ ] Write tests for search, edit, duplicate blocking, archive confirmation, and assignment cleanup.
- [ ] Add roster search to the unassigned drawer.
- [ ] Add compact player actions for edit and archive.
- [ ] Keep seed roster players editable through overrides rather than mutating JSON seed files.

### Task 6: Print and PDF-ready browser output

**Files:**
- Create: `src/components/PrintControls.tsx`
- Create: `src/components/PrintDepthChart.tsx`
- Create: `src/print.css`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- `PrintDepthChart` renders the active formation from the same state used by the interactive app.
- `PrintControls` calls `window.print()` and provides optional title/date fields stored only in component state.

- [ ] Write rendering tests for offense, defense, backups, title, and date.
- [ ] Add print controls without introducing a second data model.
- [ ] Add `@media print` rules for letter landscape, white background, black text, and restrained orange accents.
- [ ] Hide interactive controls, dialogs, and account UI when printing.

### Task 7: Named snapshots

**Files:**
- Create: `src/components/SnapshotDialog.tsx`
- Create: `src/components/SnapshotManager.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes `listSnapshots`, `createSnapshot`, `restoreSnapshot`, and `deleteSnapshot`.
- Snapshot names are required, trimmed, and limited to 60 characters.

- [ ] Write tests for creating, listing, restoring, and deleting snapshots.
- [ ] Implement a compact current/snapshots panel.
- [ ] Require confirmation before restoring because it replaces the current shared chart.
- [ ] Preserve the pre-restore state in the undo buffer.

### Task 8: Mobile movement clarity and final verification

**Files:**
- Modify: `src/components/MobileDepthList.tsx`
- Modify: `src/components/UnassignedDrawer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `README.md`

**Interfaces:**
- Shows a sticky selected-player movement bar with explicit cancel.
- Shows a brief move confirmation.

- [ ] Write tests for selected-player guidance, cancel, move completion, and accessible depth controls.
- [ ] Add the sticky movement bar and larger target controls.
- [ ] Add a short confirmation message after successful movement.
- [ ] Run ESLint, all tests, TypeScript, and the Vite production build in Vercel.
- [ ] Update the dependent pull request with setup, migration, and validation notes.
