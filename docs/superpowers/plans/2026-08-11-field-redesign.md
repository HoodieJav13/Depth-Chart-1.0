# Field Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cluttered desktop field with a single-card Madden-inspired presentation, grouped trench lanes, a collapsible shared right-side surface, opposite-side assignment cues, and tablet-landscape support without changing the Firestore schema or the mobile/print data model.

**Architecture:** Add a field-only `FieldPositionCard` that never replaces the existing reusable `PlayerCard`; `DesktopField` renders either individual positioned cards or grouped trench lanes. `App` owns a three-state desktop right surface (`collapsed | roster | position`), while `UnassignedDrawer` keeps the existing mobile drawer unchanged. Opposite-side information is derived from the existing assignment maps. The defensive 4-2-5 config change is a gated task and must not run until live shared defense assignments are verified empty.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4, Testing Library, existing Firebase/Firestore compat layer, CSS.

## Global Constraints

- No Firestore schema change. Keep `Record<formationId, Record<positionId, playerId[]>>`.
- Keep `Player` as `{ id, name, number? }`.
- Offensive position ids are frozen.
- Preserve `PrintDepthChart` as an independent white-background information-dense surface.
- Preserve `MobileDepthList` behavior.
- Preserve drag-and-drop assignment/unassignment.
- No headshots, ratings, ghost cards, or Madden/Coach view toggle.
- Field cards show full player names.
- Do not change `formations.json` defense until the live-defense safety gate is satisfied.

---

### Task 1: Field-only position card and click/drag semantics

**Files:**
- Create: `src/components/FieldPositionCard.tsx`
- Create: `src/components/FieldPositionCard.test.tsx`
- Modify: `src/components/PositionStack.tsx`
- Modify: `src/components/DesktopField.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `FieldPositionCard` with `position`, `players`, `selectedPlayerId`, `oppositePositionLabel`, `onOpenPosition`, `onMovePlayer`, and `onFieldDragStart` props.
- `PositionStack` becomes a thin absolute-position wrapper around one `FieldPositionCard`; it no longer renders a hex marker, starter `PlayerCard`, or popover.

- [ ] **Step 1: Write failing field-card tests**

```tsx
it("renders one occupied card with position, jersey, full name, and depth count", () => {
  render(
    <FieldPositionCard
      position={position}
      players={[starter, backup]}
      selectedPlayerId={null}
      oppositePositionLabel={null}
      onOpenPosition={vi.fn()}
      onMovePlayer={vi.fn()}
      onFieldDragStart={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: /LT depth chart/i })).toBeInTheDocument();
  expect(screen.getByText("LT")).toBeInTheDocument();
  expect(screen.getByText("72")).toBeInTheDocument();
  expect(screen.getByText("Skyler Pasternak")).toBeInTheDocument();
  expect(screen.getByText("+1")).toBeInTheDocument();
});

it("opens position on click when no player is selected", () => {
  const onOpenPosition = vi.fn();
  renderFieldCard({ onOpenPosition, selectedPlayerId: null });
  fireEvent.click(screen.getByRole("button", { name: /LT depth chart/i }));
  expect(onOpenPosition).toHaveBeenCalledWith("off-lt");
});

it("places the selected player instead of opening detail", () => {
  const onOpenPosition = vi.fn();
  const onMovePlayer = vi.fn();
  renderFieldCard({ onOpenPosition, onMovePlayer, selectedPlayerId: "p02" });
  fireEvent.click(screen.getByRole("button", { name: /LT depth chart/i }));
  expect(onMovePlayer).toHaveBeenCalledWith("p02", "off-lt");
  expect(onOpenPosition).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Commit tests and verify Vercel reports the focused tests failing for missing `FieldPositionCard`**
- [ ] **Step 3: Implement `FieldPositionCard` with one DOM card per position**

```tsx
const handleClick = () => {
  if (selectedPlayerId) onMovePlayer(selectedPlayerId, position.id);
  else onOpenPosition(position.id);
};
```

Occupied cards are `draggable`; `dragstart` writes the starter id to `text/player-id` and calls `onFieldDragStart`. Empty cards are not draggable but remain drop targets.

- [ ] **Step 4: Replace the old marker + starter + popover body in `PositionStack` with the field card**
- [ ] **Step 5: Remove `.position-marker`, `.starter-preview`, and field usage of `.player-card.compact`; add `.field-position-card`, `.field-position-chip`, `.field-jersey-number`, `.field-player-name`, `.field-depth-badge` styling**
- [ ] **Step 6: Run full Vercel lint/test/build and verify green**
- [ ] **Step 7: Commit the production implementation**

---

### Task 2: Collapsible roster rail and shared right-surface state

**Files:**
- Create: `src/components/RightSurfaceHandle.tsx`
- Create: `src/components/RightSurfaceHandle.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/UnassignedDrawer.tsx`
- Modify: `src/styles.css`
- Modify: `src/workflow.css`

**Interfaces:**
- Produces in `App`: `type RightSurfaceMode = "collapsed" | "roster" | "position"`.
- `UnassignedDrawer` gains `desktopVisible: boolean` and otherwise keeps mobile behavior unchanged.
- `RightSurfaceHandle` consumes `count` and `onOpenRoster`.

- [ ] **Step 1: Write failing tests for the collapsed handle**

```tsx
it("shows the unassigned count and opens the roster", () => {
  const onOpenRoster = vi.fn();
  render(<RightSurfaceHandle count={17} onOpenRoster={onOpenRoster} />);
  expect(screen.getByText("17")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /open unassigned roster/i }));
  expect(onOpenRoster).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Verify the new test fails before implementation**
- [ ] **Step 3: Implement `RightSurfaceHandle` and `desktopVisible` without changing mobile markup or callbacks**
- [ ] **Step 4: Add `rightSurfaceMode` and `previousRightSurfaceMode` state to `App`; default to `collapsed`; switching formation closes position detail**
- [ ] **Step 5: Make `.workspace` use a `right-collapsed` class for ~56px and 288px otherwise; render the handle in collapsed state and existing desktop roster in roster state**
- [ ] **Step 6: Wire field drag-start to switch `rightSurfaceMode` to `roster` before a player is dropped out to unassign**
- [ ] **Step 7: Run full Vercel lint/test/build and verify green**
- [ ] **Step 8: Commit**

---

### Task 3: Grouped offensive-line lane and structural regression migration

**Files:**
- Create: `src/components/PositionLane.tsx`
- Create: `src/components/PositionLane.test.tsx`
- Modify: `src/components/DesktopField.tsx`
- Modify: `src/components/PositionStack.tsx`
- Replace: `src/components/PositionStack.hitbox.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- `PositionLane` consumes `positions: PositionConfig[]`, assignments, players map, selected player id, and the same open/move/drag callbacks as individual positions.
- Offense lane ids are exactly `off-lt`, `off-lg`, `off-c`, `off-rg`, `off-rt`.

- [ ] **Step 1: Replace the workaround hitbox test with a failing structure regression**

```tsx
it("renders all five offensive line targets inside one grouped lane", () => {
  const { container } = renderDesktopOffense();
  const lane = container.querySelector('[data-position-lane="offensive-line"]');
  expect(lane).not.toBeNull();
  for (const id of ["off-lt", "off-lg", "off-c", "off-rg", "off-rt"]) {
    const target = lane?.querySelector(`[data-position-id="${id}"]`);
    expect(target).not.toBeNull();
    expect(target).not.toHaveStyle({ left: expect.any(String) });
  }
});
```

- [ ] **Step 2: Verify the regression test fails against independent absolute nodes**
- [ ] **Step 3: Implement `PositionLane` and change `DesktopField` to partition OL ids from skill positions**
- [ ] **Step 4: Delete `dense` calculation/prop/style rules completely**
- [ ] **Step 5: Style the lane once at center x=50/y=30 with a bounded responsive width and five equal grid columns**
- [ ] **Step 6: Verify all five line cards remain individually clickable in component tests**
- [ ] **Step 7: Run full Vercel lint/test/build and verify green**
- [ ] **Step 8: Commit**

---

### Task 4: Fixed position-detail panel in the shared right surface

**Files:**
- Create: `src/components/PositionDetailPanel.tsx`
- Create: `src/components/PositionDetailPanel.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/UnassignedDrawer.tsx`
- Modify: `src/styles.css`
- Modify: `src/workflow.css`

**Interfaces:**
- `PositionDetailPanel` consumes the active `PositionConfig`, ordered `Player[]`, `selectedPlayerId`, `onSelectPlayer`, `onMovePlayer`, `onUnassignPlayer`, `onEditPlayer`, `onArchivePlayer`, and `onClose`.
- `App` stores `activePositionId` instead of `expandedPositionId`; field click opens `rightSurfaceMode="position"`.

- [ ] **Step 1: Write failing detail-panel tests for ordered depth, selection, unassign, and drag reorder**

```tsx
it("renders ordered depth and selects a player for placement", () => {
  const onSelectPlayer = vi.fn();
  renderPanel({ players: [starter, backup], onSelectPlayer });
  expect(screen.getAllByTestId("position-depth-player").map((row) => row.textContent)).toEqual([
    expect.stringContaining(starter.name),
    expect.stringContaining(backup.name),
  ]);
  fireEvent.click(screen.getByRole("button", { name: new RegExp(starter.name, "i") }));
  expect(onSelectPlayer).toHaveBeenCalledWith(starter.id);
});
```

- [ ] **Step 2: Verify failure before component exists**
- [ ] **Step 3: Implement the panel using existing `PlayerCard`/`PlayerActionsMenu` patterns; use drop-before to call `onMovePlayer(playerId, position.id, toDepthIndex)`**
- [ ] **Step 4: Add explicit unassign controls for each depth player and edit/archive controls**
- [ ] **Step 5: Wire `App` right-surface state so close returns to the previous collapsed/roster state**
- [ ] **Step 6: Remove `.depth-popover`, `.open-left`, and all expanded-position rendering from field components**
- [ ] **Step 7: Run full Vercel lint/test/build and verify green**
- [ ] **Step 8: Commit**

---

### Task 5: Opposite-side assignment derivation and card/detail cues

**Files:**
- Create: `src/domain/playerAssignments.ts`
- Create: `src/domain/playerAssignments.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/DesktopField.tsx`
- Modify: `src/components/PositionLane.tsx`
- Modify: `src/components/PositionStack.tsx`
- Modify: `src/components/FieldPositionCard.tsx`
- Modify: `src/components/PositionDetailPanel.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `positionsForPlayer(playerId, assignments, formations): { formationId: string; unit: "offense" | "defense"; positionId: string; label: string }[]`.
- Produces: `oppositePositionLabelFor(playerId, activeFormation, state.assignments, formationConfig)` returning a compact joined label or `null`.

- [ ] **Step 1: Write failing pure tests**

```ts
it("returns the opposite-side position label from existing assignments", () => {
  const result = oppositePositionLabelFor("p01", offense, assignments, formationConfig);
  expect(result).toBe("FS");
});

it("returns null when the player is only assigned on the active side", () => {
  expect(oppositePositionLabelFor("p02", offense, assignments, formationConfig)).toBeNull();
});
```

- [ ] **Step 2: Verify tests fail before utility exists**
- [ ] **Step 3: Implement derivation with no state/schema changes**
- [ ] **Step 4: Pass the opposite-side chip only to the starter field card and render it as a quiet secondary chip**
- [ ] **Step 5: When a depth player is selected in `PositionDetailPanel`, show their complete offense/defense assignment labels in a compact detail block**
- [ ] **Step 6: Run full Vercel lint/test/build and verify green**
- [ ] **Step 7: Commit**

---

### Task 6: Tablet-landscape and readability pass

**Files:**
- Modify: `src/styles.css`
- Modify: `src/mobile-polish.css`
- Modify: `src/workflow.css`

**Interfaces:**
- No data/model changes.

- [ ] **Step 1: Add CSS so landscape viewports in the 768–1180px class keep `.field-shell` visible and suppress `.mobile-depth-list`; phone/portrait behavior remains unchanged**
- [ ] **Step 2: Replace desktop-only `min-height: 620px` behavior in that range with viewport-aware sizing**
- [ ] **Step 3: Keep the right rail collapsed by default and ensure lane/card sizing uses `clamp()`/grid minmax values that fit tablet landscape**
- [ ] **Step 4: Raise field-card-to-field contrast inside the existing Eldorado palette; do not add a new view toggle**
- [ ] **Step 5: Run full Vercel lint/test/build and verify green**
- [ ] **Step 6: Commit**

---

### Task 7: Defensive 4-2-5 and defensive front-four lane — gated

**Files:**
- Modify only after gate: `src/config/formations.json`
- Modify after gate: `src/components/DesktopField.tsx`
- Modify after gate: `src/components/PositionLane.test.tsx`

**Interfaces:**
- Preserve ids `def-lc`, `def-rc`, `def-fs`.
- Add ids `def-le`, `def-ldt`, `def-rdt`, `def-re`, `def-will`, `def-mike`, `def-alpha`, `def-bandit`.
- Retire ids `def-e`, `def-n`, `def-a`, `def-b`, `def-s`, `def-m`, `def-w`, `def-money`.

- [ ] **Step 1: Verify live shared `defense-base` assignments, not fixture/local data**
- [ ] **Step 2: If any retired defensive position is occupied, STOP. Do not change config and do not treat an app snapshot as backup.**
- [ ] **Step 3: If empty, optionally create a general named snapshot; if a true raw backup is needed, preserve the Firestore document outside the app**
- [ ] **Step 4: Write failing config/lane tests for the exact 4-2-5 ids, labels, listOrder, and grouped front-four structure**
- [ ] **Step 5: Replace defense config exactly as approved and partition `def-le/def-ldt/def-rdt/def-re` into `PositionLane`**
- [ ] **Step 6: Run full Vercel lint/test/build and verify green**
- [ ] **Step 7: Commit**

---

### Task 8: Release-candidate verification

**Files:**
- Modify: PR description only after verification.

- [ ] **Step 1: Run the complete Vercel gate: `npm run lint && npm test && npm run build`**
- [ ] **Step 2: Confirm the preview deployment is READY**
- [ ] **Step 3: Real-browser manual checks at representative desktop and tablet-landscape widths with right rail collapsed and expanded: OL/front-four no visual overlap, every card clickable, starter drag between positions, drag to roster unassign, position panel reorder, full names wrap, opposite-side chip, mobile list unchanged**
- [ ] **Step 4: Record exact widths checked in the PR description**
- [ ] **Step 5: Do not merge to `main` without explicit owner approval**
