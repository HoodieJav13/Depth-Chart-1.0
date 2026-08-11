# Shared Coach Workflow Design

## Goal

Turn the authenticated Eldorado depth chart into a shared coach tool with real-time Firestore state, safe migration from the current browser chart, one-level undo and save feedback, roster maintenance, printable output, named snapshots, and clearer mobile movement.

## Data model

The canonical document is `teams/eldorado-freshman/depthChart/current`. It stores versioned assignments, added players, seed-player overrides, archived player IDs, revision metadata, and the coach who last updated it. Named snapshots live in `teams/eldorado-freshman/snapshots/{snapshotId}` and contain a frozen copy of the chart state plus name, creator, and timestamps.

## Store boundary

`DepthChartStore` remains the only interface used by React. Both local and Firestore stores implement the same expanded operations. The local store remains useful for migration and emergency fallback; the Firestore store owns listeners, writes, statuses, and snapshot documents.

## Migration

After approved authentication, the app loads shared state. When the shared chart does not yet exist, it can initialize from the meaningful local version 1 chart. Creation is transactional and only succeeds if another coach has not already initialized the shared chart. Existing shared state is never overwritten automatically.

## Safety

Every user mutation stores the previous state in a one-level undo buffer. The UI shows saving, saved, offline, or error state. A failed remote write leaves the currently displayed state intact and exposes retry. Player archive removes the player from all assignments but keeps an undo path.

## Roster management

Seed players remain in checked-in JSON. Edits are represented as state overrides keyed by stable player ID. Added players remain state records. Archived IDs hide either kind. Duplicate checks compare normalized name and jersey number combinations.

## Printing

The interactive and printed views consume the same active formation and state. Print uses letter landscape, white background, black text, minimal orange accents, and no account, editing, drawer, or dialog controls.

## Snapshots

Coaches can name and save the current chart, list snapshots newest-first, restore one after confirmation, or delete one. Restoring first captures the current state in the undo buffer.

## Mobile movement

Mobile continues using tap selection rather than drag-and-drop. A sticky movement bar identifies the selected player, provides cancel, and instructs the coach to choose a position. Successful movement shows a brief confirmation.

## Scope exclusions

No special teams, player accounts, messaging, attendance, statistics, playbook drawing, or full administration dashboard are included.