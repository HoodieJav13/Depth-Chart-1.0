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

## Phase 1 depth chart

- `src/config/roster.json` and `src/config/formations.json` are the supplied seed data.
- All player placement uses stable player IDs.
- Components communicate through `DepthChartStore`.
- `LocalStorageDepthChartStore` is the only module that knows about browser storage.
- Coaches can add name-only players or include an optional jersey number; added players persist locally and start unassigned.
- Offense and defense assignments are independent even though they share one roster.

## Phase 2 coach authentication

The app requires Firebase phone authentication before showing the depth chart. Firebase uses invisible reCAPTCHA for abuse prevention, and verified users must also have an active Cloud Firestore record at `approvedCoaches/{E.164 phone number}`.

The app never trusts a browser-side phone-number list. `firestore.rules` prevents clients from creating or editing coach approvals and reserves future `depthCharts` cloud data for active approved coaches.

Follow [`docs/firebase-access-setup.md`](docs/firebase-access-setup.md) for the required Firebase console document and rules deployment.

This phase intentionally continues using browser local storage for lineup data. Shared Firestore depth-chart syncing is the next phase.
