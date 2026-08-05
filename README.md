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

## Phase 1 architecture

- `src/config/roster.json` and `src/config/formations.json` are the supplied seed data.
- All player placement uses stable player IDs.
- Components communicate through `DepthChartStore`.
- `LocalStorageDepthChartStore` is the only module that knows about browser storage.
- Coaches can add name-only players or include an optional jersey number; added players persist locally and start unassigned.
- Offense and defense assignments are independent even though they share one roster.

Phase 1 intentionally excludes cloud sync, authentication, special teams, full roster/formation editors, saved snapshots, printing, and player detail pages.


## Phase 2 authentication

The app now requires Firebase phone authentication before showing the depth chart. The initial approved coach number is configured in `src/auth/approvedCoaches.ts`.

Firebase console prerequisites:

1. Enable **Phone** under Authentication > Sign-in method.
2. Allow SMS messages to the United States under Authentication > Settings > SMS region policy.
3. Add `eldorado-depth-chart.vercel.app` under Authentication > Settings > Authorized domains.
4. Use a fictional `555` number and fixed six-digit code for development testing rather than registering a real phone number as fictional.
5. Optionally set `VITE_FIREBASE_APP_ID` in Vercel from the Firebase web config object.

This phase protects the app but intentionally continues using browser local storage. Shared Firestore syncing is the next phase.
