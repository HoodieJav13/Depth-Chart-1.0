import { describe, expect, it } from "vitest";
import {
  beginFieldDrag,
  completeFieldDrag,
  createRightSurfaceState,
  closePositionDetail,
  openPositionDetail,
  setRosterOpen,
} from "./rightSurfaceState";

describe("desktop right surface drag lifecycle", () => {
  it("temporarily opens a collapsed rail and restores it when drag ends elsewhere", () => {
    const initial = createRightSurfaceState();
    const dragging = beginFieldDrag(initial);

    expect(dragging.mode).toBe("roster");
    expect(completeFieldDrag(dragging, false).mode).toBe("collapsed");
  });

  it("keeps the roster open after a player is dropped there", () => {
    const dragging = beginFieldDrag(createRightSurfaceState());

    expect(completeFieldDrag(dragging, true).mode).toBe("roster");
  });

  it("restores an already-open roster to open after a cancelled drag", () => {
    const open = setRosterOpen(createRightSurfaceState(), true);

    expect(completeFieldDrag(beginFieldDrag(open), false).mode).toBe("roster");
  });

  it("returns from position detail to the surface that was open before it", () => {
    const collapsed = createRightSurfaceState();
    expect(closePositionDetail(openPositionDetail(collapsed)).mode).toBe("collapsed");

    const roster = setRosterOpen(collapsed, true);
    expect(closePositionDetail(openPositionDetail(roster)).mode).toBe("roster");
  });
});
