# Field Presentation Addendum — Ultimate-Team Card System

Supplements `field-redesign-spec.md`. That spec's architecture shipped and is **approved and
frozen**: data model, position ids, persistence, cross-listing derivation, detail panel,
roster rail states, drag/drop semantics, print view, mobile list. This addendum rescopes the
**desktop/tablet field presentation only** — the current build reads as a clean coaching
utility, and the target is a Madden Ultimate Team–style lineup screen.

## Visual contract

The four Madden Ultimate Team lineup screenshots supplied with this addendum are the
contract. Where this document and the screenshots disagree, the screenshots win; where an
implementer is tempted to interpolate "Madden-like" from memory, they must look at the
screenshots instead — every drift so far has come from working from memory.

**Acceptance test:** the finished screen, side by side with the references, reads as the same
*category* of interface — a card-based lineup screen with football context — not merely
"cleaner than before." Concretely, all of the following hold:

- Cards carry the composition; the background is atmosphere.
- Position labels are strong anchors **above** each card column.
- Named backups are visible under starters without opening anything.
- The screen could be screenshotted next to the references without embarrassment.

## What the references actually show (encode these, not memory)

Observed directly in the four screenshots:

1. A grid/band composition of position columns — **not** players plotted on a field diagram.
2. Each column: a label block **on top** (role name small, slot code large — `HALFBACK` over
   `HB 1`), then one tall portrait starter card, then compact backup strips beneath
   (name + rating per strip).
3. Cards are roughly 3:4 portrait, art-dominant, with a nameplate zone at the bottom.
4. The background is near-black/dark stadium texture; any field imagery is barely legible.
5. Defense screens run **secondary band on top, defensive line on the bottom**.
6. Card frames vary per player (pink/gold/bronze) because they encode **rarity and OVR
   tier**. We have no ratings: this specific feature is **not** reproduced — see Card frame.

---

## Composition: semantic bands

Positions stop being individually plotted at x/y screen coordinates. Each formation renders
as horizontal **bands** of position columns, centered, with left/right order inside a band
taken from the positions' existing `x` values (sort ascending). `x`/`y` remain in
`formations.json` untouched — they become ordering data for the desktop view and stay literal
for any future use; **do not edit them**.

Band membership is declared in the presentation layer (extend the existing `laneDefinition`
pattern in `DesktopField`), not in `formations.json`.

**Offense** (top → bottom):

| Band | Columns |
|---|---|
| Line of scrimmage | `Z` · `Y` · **OL group** (`LT` `LG` `C` `RG` `RT`, compact) · `H` · `X` |
| Backfield | `Q` |
| Deep backfield | `RB` |

**Defense** (top → bottom, matching the references' orientation — secondary deep at top):

| Band | Columns |
|---|---|
| Secondary | `LC` · `A` · `FS` · `B` · `RC` |
| Linebackers | `W` · `M` |
| Front | `LE` · `LDT` · `RDT` · `RE` |

Notes:

- This **flips the defense vertically** relative to the current build (front is at y=30/top
  today). Deliberate: it matches the references and reads as the defense facing an offense
  beyond the bottom edge. The offense tab keeps line-first-at-top.
- The defensive front four are only four columns — they get **full-width cards**, not the
  compact trench treatment. Only the five-man OL group is compact.
- Delete the `formation-coordinate-layer` zoom wrapper (`top: -43%; height: 210%`) — bands
  make it obsolete. The `line-of-scrimmage` element may stay as a subtle divider adjacent to
  the LOS band or be removed; it must not fight the cards for attention.

## Column architecture

Top to bottom, per position column:

1. **Label block** — above the card, centered: role name in small caps (`QUARTERBACK`,
   `MIKE LINEBACKER`), position code large beneath it (`Q`, `M`). This is the strong anchor
   the references use; it is not a chip and not metadata. Role names come from a new
   **optional** `roleName` field on `PositionConfig` (presentation-only config addition — ids
   and x/y untouched; label renders alone where `roleName` is absent).
2. **Starter card** — see Card anatomy.
3. **Backup strips** — up to two, each: jersey number + **full name**, one line, 11px
   minimum. Depth beyond the strips renders as a final `+N` row. Strips are display + click
   surfaces (same click semantics as the card, below); they are **not** drag sources in this
   pass.

**Strips appear only under full-width cards.** Compact OL-group cards keep the `+N` badge
only — an ~75px card cannot carry an 11px name strip without recreating the unreadable-text
bug this project already fixed once. Trench depth lives in the detail panel.

## Card anatomy (starter, full-width)

Roughly 3:4 portrait. Vertical zones:

1. **Top strip** — position code chip (small, quiet) and the opposite-side assignment badge
   (unchanged logic; visually subordinate to everything below).
2. **Hero zone** — the dominant area. Big jersey number in the orange accent over a subtle
   Eldorado treatment: gradient, faint eagle/wing geometry, muted texture. If the player has
   **no jersey number**, fall back to the player's initials in the same treatment — never an
   empty hole, never a placeholder silhouette. This zone is architected so a real photo could
   drop in later without changing the card; do not add photos now.
3. **Nameplate** — dedicated high-contrast bar at the bottom: full first + last name, up to
   two tight lines, never truncated to fit a decoration.

**Card frame:** one uniform Eldorado frame for all players — near-black/navy body, burnt
orange/gold accents, restrained metallic edge. **No per-player frame variance.** Madden's
frames encode rarity/OVR tiers; we have no ratings, and simulating tier variance is the fake
data this project has refused twice already. Starter vs. backup is distinguished by card vs.
strip, not by frame color.

**Empty position:** same silhouette at reduced weight — dashed/outline frame, position code
in the hero zone, no nameplate.

## Field treatment

The current green field dominates the screen; in the references the cards dominate. Darken
and desaturate the field to near-black with barely-legible yard structure — background
atmosphere, not a diagram surface. The `EAGLES` / `ELDORADO` watermarks may stay at very low
contrast. Target proportion: cards ≈ 70% of perceived visual weight. Removing the literal
grass entirely in favor of a dark stadium gradient is acceptable if it reads better; keeping
faint football context is preferred.

## Contrast and sizing floors (carried forward, now load-bearing)

Textures and gradients are couch aesthetics; this app is used outdoors.

- Nameplate text, hero number, and label blocks: legible over their actual backgrounds —
  ≥ 4.5:1 effective contrast. No text sits on a busy region of the texture.
- Nothing on a field card or strip below **11px**. If something doesn't fit, the container
  grows or the element is dropped — type does not shrink below the floor. (This rule has
  already caught two real bugs; treat violations as failures, not tradeoffs.)
- P3 (daylight pass) still happens after this ships and must not require undoing the theme —
  which is why the floors are part of this spec rather than deferred.

## Interaction: unchanged, restated against the new anatomy

The P0.1 semantics survive verbatim; only geometry changed.

- Click on card **or** backup strip: opens the position's detail panel; with a player
  selected, places that player at the position instead. Clicking never selects a player.
- Starter card remains the drag source; strips are not. Field columns remain drop targets.
- Three-tier placement states persist (selected source / hovered target / quiet valid
  target) — restyle to fit the frame, same hierarchy, `data-placement-state` and
  `aria-current` retained.
- Detail panel, roster rail states, auto-expand-on-drag: untouched.

## Responsive / tablet

- Bands solve the tall-card collision by construction — no per-card overlap math returns.
- Card and strip sizes clamp down toward 1024×768; if vertical space runs out, backup strips
  degrade first (two strips → one strip + `+N` → `+N` only), the card second, the floors
  never.
- The ≤1180px overlay behavior for the right surface is unchanged.
- Manual verification at 1440×900, 1180×820, 1024×768 — rail collapsed and expanded, both
  tabs — recorded in the PR description, per the base spec's P0.5 rule.

## Tests (same-pass rule applies)

The existing field-card and lane structural tests assert the current markup and will fail.
Replace them in the same pass with structural assertions that match the new architecture:

- Each formation renders its declared bands, in order.
- Columns within a band are ordered by ascending `x`.
- The OL group renders compact cards without strips; full-width occupied positions render
  at most two strips plus overflow indicator.
- Label block, hero fallback (initials when no number), and nameplate render for the
  respective states.
- Placement-state and drag semantics assertions carry over unchanged.

No jsdom geometry claims (base spec P0.5 rationale stands). Geometry is the manual pass.

## Out of scope

- Photos/headshots (architected-for, not added), ratings or tier frames, ghost/peek cards,
  view-mode toggles.
- Any change to `formations.json` x/y values, position ids, `Player` fields, stores,
  Firestore, print view, or mobile list.
- Strength-flip rendering (still deliberately out, per base spec).
