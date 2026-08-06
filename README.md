# Eldorado Depth Chart

A focused coach tool for visualizing and rearranging the freshman football offense and defense depth charts.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Depth-chart architecture

- `src/config/roster.json` and `src/config/formations.json` provide the seed roster and formation layout.
- All assignments use stable player IDs.
- `DepthChartStore` isolates React from persistence details.
- `LocalStorageDepthChartStore` upgrades the original browser state and remains the migration/fallback source.
- `FirestoreDepthChartStore` provides the authenticated shared chart, realtime listeners, revision-checked writes, save status, retry, one-level undo, and named snapshots.
- Offense and defense assignments remain independent while sharing one roster.
- Seed-player edits are stored as overrides; added and archived players remain in versioned shared state.

## Coach authentication and authorization

The app uses Firebase phone authentication with invisible reCAPTCHA. A verified user must also have an active Cloud Firestore record at:

```text
approvedCoaches/{E.164 phone number}
```

The browser does not contain an approval allowlist. `firestore.rules` prevents clients from creating or editing coach approval documents and limits team data to active approved coaches.

Follow [`docs/firebase-access-setup.md`](docs/firebase-access-setup.md) for Firebase console setup and rules deployment.

## Shared data

The canonical shared chart is stored at:

```text
teams/eldorado-freshman/depthChart/current
```

Named snapshots are stored at:

```text
teams/eldorado-freshman/snapshots/{snapshotId}
```

On the first approved login, the app creates the shared chart only when it does not already exist. Meaningful data from the original local browser chart is imported once. An existing shared chart is never overwritten automatically.

## Coach workflow

- Realtime shared offense and defense depth charts
- Saving, saved, offline, failed, and retry feedback
- One-level Undo that refuses to overwrite a newer change from another coach
- Search, add, edit, and archive roster players
- Browser print/PDF output with a white, ink-conscious layout
- Named snapshots with restore and delete
- Explicit mobile player-selection guidance, cancel, larger targets, and move confirmation

The project intentionally excludes special teams, player accounts, messaging, attendance, statistics, playbook drawing, and a full administration dashboard.