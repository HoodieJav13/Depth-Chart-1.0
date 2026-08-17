import { render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  FormationConfig,
  Player,
  PositionAssignments,
} from "../domain/types";
import { DesktopField } from "./DesktopField";

const offense: FormationConfig = {
  id: "offense-base",
  name: "Offense",
  unit: "offense",
  positions: [
    { id: "off-lt", label: "LT", x: 42, y: 30, listOrder: 1, roleName: "Left Tackle" },
    { id: "off-lg", label: "LG", x: 46, y: 30, listOrder: 2, roleName: "Left Guard" },
    { id: "off-c", label: "C", x: 50, y: 30, listOrder: 3, roleName: "Center" },
    { id: "off-rg", label: "RG", x: 54, y: 30, listOrder: 4, roleName: "Right Guard" },
    { id: "off-rt", label: "RT", x: 58, y: 30, listOrder: 5, roleName: "Right Tackle" },
    { id: "off-q", label: "Q", x: 50, y: 42, listOrder: 6, roleName: "Quarterback" },
    { id: "off-t", label: "RB", x: 50, y: 54, listOrder: 7, roleName: "Running Back" },
    { id: "off-h", label: "H", x: 70, y: 33, listOrder: 8 },
    { id: "off-y", label: "Y", x: 30, y: 33, listOrder: 9 },
    { id: "off-z", label: "Z", x: 14, y: 32, listOrder: 10 },
    { id: "off-x", label: "X", x: 86, y: 32, listOrder: 11 },
  ],
};

const defense: FormationConfig = {
  id: "defense-base",
  name: "Defense",
  unit: "defense",
  positions: [
    { id: "def-le", label: "LE", x: 39, y: 30, listOrder: 1, roleName: "Left End" },
    { id: "def-ldt", label: "LDT", x: 46, y: 30, listOrder: 2, roleName: "Left Tackle" },
    { id: "def-rdt", label: "RDT", x: 54, y: 30, listOrder: 3, roleName: "Right Tackle" },
    { id: "def-re", label: "RE", x: 61, y: 30, listOrder: 4, roleName: "Right End" },
    { id: "def-will", label: "W", x: 44, y: 41, listOrder: 5, roleName: "Will" },
    { id: "def-mike", label: "M", x: 56, y: 41, listOrder: 6, roleName: "Mike" },
    { id: "def-alpha", label: "A", x: 28, y: 40, listOrder: 7, roleName: "Alpha" },
    { id: "def-bandit", label: "B", x: 70, y: 40, listOrder: 8, roleName: "Bandit" },
    { id: "def-lc", label: "LC", x: 11, y: 38, listOrder: 9, roleName: "Left Corner" },
    { id: "def-rc", label: "RC", x: 89, y: 38, listOrder: 10, roleName: "Right Corner" },
    { id: "def-fs", label: "FS", x: 50, y: 56, listOrder: 11, roleName: "Free Safety" },
  ],
};

const renderField = (
  formation: FormationConfig,
  assignments: PositionAssignments = {},
  playersById = new Map<string, Player>(),
) =>
  render(
    <DesktopField
      formation={formation}
      assignments={assignments}
      playersById={playersById}
      selectedPlayerId={null}
      expandedPositionId={null}
      onTogglePosition={vi.fn()}
      onMovePlayer={vi.fn()}
    />,
  );

const bandOrder = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".formation-band")).map(
    (band) => band.dataset.band,
  );

const columnOrder = (band: HTMLElement) =>
  Array.from(band.querySelectorAll<HTMLElement>(".position-column")).map(
    (column) => column.dataset.positionId,
  );

const bandNamed = (container: HTMLElement, name: string) => {
  const band = container.querySelector<HTMLElement>(`[data-band="${name}"]`);
  expect(band).not.toBeNull();
  return band as HTMLElement;
};

describe("semantic formation bands", () => {
  it("renders offense as line-of-scrimmage, backfield, deep backfield", () => {
    const { container } = renderField(offense);
    expect(bandOrder(container)).toEqual([
      "line-of-scrimmage",
      "backfield",
      "deep-backfield",
    ]);
    expect(columnOrder(bandNamed(container, "backfield"))).toEqual(["off-q"]);
    expect(columnOrder(bandNamed(container, "deep-backfield"))).toEqual(["off-t"]);
  });

  it("renders defense secondary-first so deep coverage sits at the top of the screen", () => {
    const { container } = renderField(defense);
    expect(bandOrder(container)).toEqual(["secondary", "linebackers", "front"]);
  });

  it("orders columns inside a band by ascending x", () => {
    const { container } = renderField(defense);
    expect(columnOrder(bandNamed(container, "secondary"))).toEqual([
      "def-lc",
      "def-alpha",
      "def-fs",
      "def-bandit",
      "def-rc",
    ]);
    expect(columnOrder(bandNamed(container, "linebackers"))).toEqual([
      "def-will",
      "def-mike",
    ]);
    expect(columnOrder(bandNamed(container, "front"))).toEqual([
      "def-le",
      "def-ldt",
      "def-rdt",
      "def-re",
    ]);
  });

  it("keeps the offensive line as one compact group positioned between Y and H", () => {
    const { container } = renderField(offense);
    const band = bandNamed(container, "line-of-scrimmage");
    const group = band.querySelector<HTMLElement>('[data-position-group="offensive-line"]');
    expect(group).not.toBeNull();

    expect(columnOrder(group as HTMLElement)).toEqual([
      "off-lt",
      "off-lg",
      "off-c",
      "off-rg",
      "off-rt",
    ]);
    for (const column of (group as HTMLElement).querySelectorAll(".position-column")) {
      expect(column).toHaveClass("compact");
    }

    // Direct children of the band: Z, Y, the OL group, H, X — in that order.
    const slots = Array.from(band.children).map((child) =>
      child.classList.contains("position-group")
        ? "group"
        : (child as HTMLElement).dataset.positionId,
    );
    expect(slots).toEqual(["off-z", "off-y", "group", "off-h", "off-x"]);
  });

  it("renders every position as a distinct hit target with no leftover coordinate layer", () => {
    const { container } = renderField(defense);
    const ids = Array.from(
      container.querySelectorAll<HTMLElement>(".position-column"),
      (column) => column.dataset.positionId,
    );
    expect(ids).toHaveLength(defense.positions.length);
    expect(new Set(ids).size).toBe(defense.positions.length);

    for (const position of defense.positions) {
      const column = within(container).getByTestId(`position-${position.id}`);
      // Bands place the columns; nothing carries its own absolute coordinate.
      expect(column.style.left).toBe("");
      expect(column.style.top).toBe("");
      expect(
        within(column).getByRole("button", {
          name: new RegExp(`^${position.label} depth chart`),
        }),
      ).toBeInTheDocument();
    }

    expect(container.querySelector(".formation-coordinate-layer")).toBeNull();
    expect(container.querySelector(".position-lane")).toBeNull();
  });

  it("still renders a position that no declared band claims", () => {
    const withExtra: FormationConfig = {
      ...defense,
      positions: [
        ...defense.positions,
        { id: "def-spur", label: "SP", x: 75, y: 44, listOrder: 12 },
      ],
    };
    const { container } = renderField(withExtra);
    const band = bandNamed(container, "unassigned-band");
    expect(columnOrder(band)).toEqual(["def-spur"]);
  });
});
