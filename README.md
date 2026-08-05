# Eldorado Depth Chart — Phase 1

A focused, local-first prototype for visualizing and rearranging the freshman football offense and defense depth charts.

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
