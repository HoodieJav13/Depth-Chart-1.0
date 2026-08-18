# Field Redesign — Implementation Spec

Implementation prompt for the depth-chart field redesign. Scope is presentation, component
architecture, and one deliberate defensive formation change (3-4 → 4-2-5).

**No Firestore *schema* change is required or permitted.** The state shape stays
`Record<formationId, Record<positionId, playerId[]>>`. The formation change discards
assignment *data* attached to the eight retired defensive position ids — see "Defensive
formation: 4-2-5" for why that requires no migration code, what it costs, and why an in-app
snapshot does not roll it back.

---

## Hard constraints (violating any of these is a failed implementation)

1. **Position `id` values are the persistence key.** `assignments` is
   `Record<formationId, Record<positionId, playerId[]>>`. Renaming an id discards every saved
   assignment for that position. **Offensive ids are frozen.** Some already diverge from their
   labels (`off-t` is labeled `RB`) — intentional legacy, leave it; offensive label changes are
   presentation-only. Eight defensive ids are deliberately being replaced and three are
   preserved, once, under "Defensive formation: 4-2-5".
2. **No new fields on `Player`.** No ratings, no photo URLs. The type stays
   `{ id, name, number? }`.
3. **Print output is independent.** `PrintDepthChart` keeps its dense, white-background,
   information-maximal design. Do not share card components or styling between the field and
   the print view.
4. **Mobile list view is out of scope.** `MobileDepthList` keeps its current behavior.
5. Drag-and-drop assignment must keep working throughout. Existing tests must pass or be
   deliberately replaced (see P0.5).

---

## P0 — Structure

### P0.1 One card per position

Today each spot renders two objects: a hexagonal `.position-marker` (48×52) and, below it, a
108px `.player-card`. Twenty-two spots produce 44 competing objects. Merge them.

Each occupied position renders **one** card containing:

- a small position chip (`LT`, `Q`, `FS`) in a corner
- the jersey number as the dominant visual element, in the orange accent
- the player's **full name** — first and last — on one or two tight lines
- the existing `+N` depth badge when more than one player is assigned

An empty position renders the same card shape in an empty/outline state showing only the
position chip.

Delete `.position-marker` and its `::before`/`::after` hexagon clip-path.

**Interaction rule (this is the part that must not be improvised).** Merging removes a hit
target that currently carries distinct meaning, so *click* on a field card becomes
single-purpose while *drag* keeps working as direct manipulation.

| Card state | Click | Drag |
|---|---|---|
| Occupied | Opens that position's detail panel. Does **not** select the starter. | Draggable — drags the starter, to another position or out to the rail to unassign. |
| Occupied, with a player already selected | Places the selected player here (current `movePlayer` behavior). | As above. |
| Empty | Opens the detail panel; places the selected player if one is selected. | Drop target only — not a drag source. |

So: an occupied field card is a **draggable starter plus a clickable position surface**; an
empty one is a drop target. Clicking never selects a player. Selecting a *player* happens only
in the detail panel and the roster rail; dragging a starter directly off the field still works
and is the reason the rail auto-expands on drag (P0.3).

Field cards remain drop targets in all states. Player rows in the panel and rail remain drag
sources.

### P0.2 Offensive line as a grouped lane

The five interior line spots sit at `x = 42, 46, 50, 54, 58` — 4% apart. On a 1440px viewport
the field is roughly 1128px wide, giving ~45px per slot while `.position-node.dense` renders a
54px card. **The cards are wider than their allotted space at every viewport.** This is the
cause of the `dense` flag, the overlap workarounds, and the click-stealing bug fixed in
`624cce1`. It cannot be solved with smaller cards; the collision is arithmetic.

Render `off-lt`, `off-lg`, `off-c`, `off-rg`, `off-rt` as a **single positioned group**
containing a flex/grid row of five equal cards. The group is placed once at a field coordinate
(centered on the `off-c` x, at the shared y); the five cards are laid out *inside* it by flex,
not by independent percentage coordinates.

Consequences:

- The `dense` prop and every `.dense` style rule are deleted. Nothing computes proximity
  between positions at render time any more (`DesktopField.tsx` currently does this in a
  nested `.some()` loop — remove it).
- The group must have a max-width and shrink its cards together, so the lane stays intact
  rather than overflowing on narrow viewports.
- Skill positions (`off-q`, `off-t`, `off-h`, `off-y`, `off-z`, `off-x`) keep individual
  percentage coordinates. Only the line is grouped.

Apply the same grouping to the **defensive front four** (`LE`, `LDT`, `RDT`, `RE` — see
"Defensive formation: 4-2-5"). At x = 39/46/54/61 the gaps are 7–8%, roughly 79px on a 1128px
field, narrower than the cards. Identical arithmetic to the OL, four cards instead of five.

The two linebackers (x = 44 and 56, 12% apart) and the five defensive backs are far enough
apart to stay as individual positioned nodes.

### P0.3 Collapsible roster rail

`.workspace` is currently `grid-template-columns: minmax(0, 1fr) 288px` — the roster occupies
288px permanently, including while nobody is editing.

- Default state: collapsed to a narrow (~56px) vertical handle showing an icon and the
  unassigned count.
- Clicking the handle expands it to the current 288px roster with its existing tools (add,
  edit, archive, unassign).
- Collapsing returns the width to the field. This alone gives the field ~20% more room and
  directly relieves the crowding that P0.2 addresses.
- The rail auto-expands when a drag begins from an occupied field card, so the starter can be
  dragged out to unassign (see the drag column in P0.1).
- Desktop only. The mobile drawer behavior (`mobileOpen` / `onMobileOpenChange`) is unchanged.

### P0.4 Fixed position-detail panel

Replace `.depth-popover`. It currently anchors next to the position, which puts it on top of
neighboring positions and requires the `position.x > 72 → .open-left` hack.

**The detail panel and the roster rail share one right-side surface** — do not build two
competing panels on the same edge. The right surface has three states:

1. Collapsed handle (default)
2. Roster (opened from the handle)
3. Position detail (opened by clicking a field card)

Opening a position from the field switches the surface to state 3; closing it returns to the
previous state. The panel shows the position label, its full depth list in order, and all
editing affordances: reorder, move, unassign, edit, archive. Reordering by drag inside the
panel replaces the current `onDropBefore` depth-index behavior.

Delete `.depth-popover`, `.open-left`, and the `position.x > 72` conditional.

### P0.5 Test migration

`PositionStack.hitbox.test.tsx` asserts `width: 48px` on the dense node. That encodes the
*workaround*, not the requirement, and it will fail once the lane lands. **Replace it, do not
delete it** — but replace it with something that can actually be verified where it runs.

**Do not write a jsdom test that claims to prove pixel non-overlap.** jsdom has no layout
engine; `getBoundingClientRect` returns zeros, so a geometry assertion would pass while testing
nothing. That is worse than having no test.

Split the verification:

*Automated (Vitest/jsdom) — assert structure, which is what actually regressed:*

- The five OL positions render inside a single grouped lane container.
- None of the five carries its own absolute `left` coordinate (the lane is positioned once;
  the cards are laid out by flex/grid inside it).
- All five remain distinct, individually addressable hit targets — this is the
  click-stealing regression from `624cce1`, expressed against the new structure.
- Same four assertions for the defensive front four.

*Manual (real browser) — verify geometry:*

- No visual or hit-target overlap between adjacent OL or front-four cards at representative
  desktop and tablet-landscape widths, with the roster rail both collapsed and expanded.
- Record the widths checked in the PR description.

---

## P1 — Card visual system

- Jersey number is the dominant element and the primary recognition anchor.
- Full name below it, tightly leaded, wrapping to a second line rather than truncating.
  Names in the roster range from `"Malachi"` (single token) to `"Skyler Pasternak"`; the card
  must handle both without special-casing.
- Position chip small and quiet — it is a label, not a headline.
- Selection state: clear border and glow on the placement target. Keep the existing orange
  accent variables.
- Consistent card width across skill positions; line-group cards may be narrower.
- Establish hierarchy through size and weight, not through additional chrome or borders.

Explicitly **not** in scope: headshots or player images, overall/rating badges, offset "peek"
or ghost cards behind the starter, and any Madden/Coach view-mode toggle. The `+N` badge
already communicates that depth exists.

---

## P2 — Opposite-side indicator and tablet

### P2.1 Opposite-side assignment chip

Derived entirely from existing data — no schema change. A player assigned in both
`offense-base` and `defense-base` gets a **small secondary chip** on their card showing the
opposite-side position label (e.g. `FS` on a starting RB's card).

- Chip only. Do not render a text line such as `also: FS` under the name.
- Only when the player is actually assigned on the opposite side of the ball.
- The full offense/defense breakdown appears in the detail panel when the player is opened.

### P2.2 Tablet landscape

The current breakpoint sends tablets to either the desktop grid or the phone list. Roughly
768–1180px landscape is the real sideline viewport and must **keep the field view**, not fall
through to `MobileDepthList`.

- The field's `min-height: 620px` and fixed-pixel card sizing need to scale into that window.
- The roster rail defaults to collapsed here, which is what makes the field fit.

---

## P3 — Readability (do not start until P0–P2 are visible)

Sideline use in daylight against the current `#14212A`-on-dark-green palette is a legibility
risk. First attempt is simply **raising card-to-field contrast** in the existing palette. Do
not add a high-contrast toggle yet — evaluate whether the contrast increase alone is
sufficient once the new layout is on screen.

---

## Defensive formation: 4-2-5 (fold in during P0)

Replaces the current 3-4-ish `defense-base` (E-N-A front, B-S-M-W backers, four DBs) with the
4-2-5 the program actually runs. This supersedes the earlier plan to relabel `def-lc`/`def-rc`
and rename `A` → second end; those were label fixes to a formation that is being replaced.

### Personnel (11)

Four down linemen — two ends, two tackles. Two linebackers — Mike and Will. Five defensive
backs — two corners, Free Safety, Alpha (slot corner), and Bandit (slot defender aligned on
the same side as Mike).

### Alignment

Coordinates are set against the existing offense (`LT` 42 / `RT` 58, `Y` 30, `H` 70) so the
front lines up over the correct gaps and the slot defenders align over the slot receivers.

| id | label | role | x | y |
|---|---|---|---|---|
| `def-le`     | `LE`  | End, outside the left tackle    | 39 | 30 |
| `def-ldt`    | `LDT` | Tackle, over the left guard     | 46 | 30 |
| `def-rdt`    | `RDT` | Tackle, over the right guard    | 54 | 30 |
| `def-re`     | `RE`  | End, outside the right tackle   | 61 | 30 |
| `def-will`   | `W`   | Will linebacker                 | 44 | 41 |
| `def-mike`   | `M`   | Mike linebacker                 | 56 | 41 |
| `def-alpha`  | `A`   | Alpha — slot corner, left slot  | 28 | 40 |
| `def-bandit` | `B`   | Bandit — right slot, Mike's side| 70 | 40 |
| `def-lc`     | `LC`  | Corner                          | 11 | 38 |
| `def-rc`     | `RC`  | Corner                          | 89 | 38 |
| `def-fs`     | `FS`  | Free safety, single high        | 50 | 56 |

`listOrder` runs 1–11 top to bottom as listed (front four, backers, slots, corners, safety) —
this drives the mobile list and the print sheet ordering.

### Strong side

Mike and Bandit align to the strong side; they are not fixed to a physical side. The table
above draws **strong right**, matching the offense's `H` at x = 70.

Render this one canonical strength and stop there. A depth chart answers "who is the Bandit,"
not "where does he stand against this look" — the field diagram is for orientation, and the
coordinates are schematic regardless. Do **not** build a strength toggle, a second defensive
formation, or per-strength assignments.

If a flip is ever wanted, it is a presentation-only x-mirror of exactly four positions —
`def-mike` ↔ `def-will` swap x, and `def-bandit` ↔ `def-alpha` swap x — with no assignment data
involved and no migration. The front four and the corners do not move; they are physical
left/right. Because that stays free to add later, it is deliberately out of scope now.

### Why this needs no migration code

`normalizeState` rebuilds `assignments` by iterating `formationConfig` positions, not the
stored keys (`stateModel.ts:130`). Any position id absent from the config is dropped on load
and pruned from Firestore on the next save. **Retired defensive ids therefore clean themselves
up — silently, with no warning to the coach and no undo.** Do not write a migration. Do not
add ghost-position handling.

### Safety gate — required before implementing or merging the formation change

The same mechanism that makes migration unnecessary makes this **irreversible** the moment the
shared document saves. This spec was written when the defensive chart was empty; a coach may
have entered assignments since.

Before changing `formations.json`:

1. Check the **live shared** defensive assignments (not a local fixture, not test data). This
   is a read, not a code change.
2. If any defensive position holds a player: **stop and report it.** Do not proceed on the
   assumption that the chart is still empty, and do not proceed on the assumption that a
   snapshot will protect it — see below.
3. If empty: proceed. A named snapshot may still be created as a general offense/roster
   restore point.

**An in-app snapshot is not a rollback for retired defensive ids.** `listSnapshots` runs
`normalizeState` on every snapshot at *read* time
(`FirebaseSharedChartBackend.ts:75`, `LocalStorageDepthChartStore.ts:216`), and
`restoreSnapshot` reads through `listSnapshots`. So once the 4-2-5 config ships, restoring a
pre-change snapshot yields state that has already had `def-n`, `def-money`, and the rest
stripped. The snapshot document in Firestore still physically contains them — `writeSnapshot`
persists unnormalized — but the app can no longer surface them through any path.

If a true pre-change defensive backup is ever required, **preserve the raw Firestore document
outside the app** before editing the formation config. Recovery would then be a manual
console/export read, not an in-app restore.

This is release safety, not migration. It adds no code to the app.

### Id strategy: eight new, three preserved — decided

**Preserved (3):** `def-lc`, `def-rc`, `def-fs`. These ids already match their roles exactly
and their meaning is unchanged in the 4-2-5. There is no benefit to renaming an accurate
persistence key.

**New (8):** `def-le`, `def-ldt`, `def-rdt`, `def-re`, `def-will`, `def-mike`, `def-alpha`,
`def-bandit`.

**Retired (8):** `def-e`, `def-n`, `def-a`, `def-b`, `def-s`, `def-m`, `def-w`, `def-money`.

The defensive chart is currently empty, so no assignment is lost either way. Do not map
retired ids onto new roles to "save" anything — there is nothing to save, and reuse would
recreate the id/label drift that already exists in `off-t`/`RB`. Do not rename the three
preserved ids for the sake of uniformity.

Labels in the table are confirmed against the program's own terminology. Use them verbatim;
they appear on printed sheets handed to players.

---

## Sequence

**P0.1 → P0.3 → P0.2 → P0.4 → P0.5**, then P1, then P2, then P3.

The roster collapse (P0.3) comes before the lane rebuild (P0.2) deliberately: collapsing the
rail from 288px to ~56px returns ~232px to the field, and the OL and front-four lanes should be
tuned against the field width the app will actually ship with — not against a width that is
about to change underneath them.

P0.2 and P0.5 must land in the same pass. P0.2 deletes the `dense` flag that the existing
hitbox test asserts on, so the test replacement cannot be deferred to a later change without
leaving the suite red or, worse, tempting a silent deletion.

The defensive formation change may land at any point in P0, but only after its
**safety gate** has been satisfied.
