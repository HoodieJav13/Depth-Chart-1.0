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
    { id: "off-lt", label: "LT", x: 42, y: 30, listOrder: 1 },
    { id: "off-lg", label: "LG", x: 46, y: 30, listOrder: 2 },
    { id: "off-c", label: "C", x: 50, y: 30, listOrder: 3 },
    { id: "off-rg", label: "RG", x: 54, y: 30, listOrder: 4 },
    { id: "off-rt", label: "RT", x: 58, y: 30, listOrder: 5 },
    { id: "off-q", label: "Q", x: 50, y: 42, listOrder: 6 },
  ],
};

const defense: FormationConfig = {
  id: "defense-base",
  name: "Defense",
  unit: "defense",
  positions: [
    { id: "def-le", label: "LE", x: 39, y: 30, listOrder: 1 },
    { id: "def-ldt", label: "LDT", x: 46, y: 30, listOrder: 2 },
    { id: "def-rdt", label: "RDT", x: 54, y: 30, listOrder: 3 },
    { id: "def-re", label: "RE", x: 61, y: 30, listOrder: 4 },
    { id: "def-mike", label: "M", x: 56, y: 41, listOrder: 6 },
  ],
};

const renderField = (formation: FormationConfig) =>
  render(
    <DesktopField
      formation={formation}
      assignments={{} as PositionAssignments}
      playersById={new Map<string, Player>()}
      selectedPlayerId={null}
      expandedPositionId={null}
      onTogglePosition={vi.fn()}
      onMovePlayer={vi.fn()}
    />,
  );

const expectGroupedLane = (
  formation: FormationConfig,
  laneName: string,
  positionIds: string[],
) => {
  const { container } = renderField(formation);
  const coordinateLayer = container.querySelector<HTMLElement>(".formation-coordinate-layer");
  const lane = container.querySelector<HTMLElement>(`[data-position-lane="${laneName}"]`);
  const lineOfScrimmage = container.querySelector<HTMLElement>(".line-of-scrimmage");
  expect(coordinateLayer).not.toBeNull();
  expect(lane).not.toBeNull();
  expect(coordinateLayer).toContainElement(lane);
  expect(coordinateLayer).toContainElement(lineOfScrimmage);
  expect(lane).toHaveStyle({ left: "50%", top: "30%" });
  expect(lineOfScrimmage).toHaveStyle({ top: "30%" });

  const nodes = positionIds.map((positionId) => {
    const node = within(lane as HTMLElement).getByTestId(`position-${positionId}`);
    expect(node.style.left).toBe("");
    return node;
  });

  expect(new Set(nodes).size).toBe(positionIds.length);
  for (const positionId of positionIds) {
    expect(
      within(lane as HTMLElement).getByRole("button", {
        name: new RegExp(`^${formation.positions.find((item) => item.id === positionId)?.label} depth chart`),
      }),
    ).toBeInTheDocument();
  }
};

describe("grouped trench lanes", () => {
  it("renders all five OL targets inside one positioned lane without individual left coordinates", () => {
    expectGroupedLane(offense, "offensive-line", [
      "off-lt",
      "off-lg",
      "off-c",
      "off-rg",
      "off-rt",
    ]);
  });

  it("renders all four front targets inside one positioned lane without individual left coordinates", () => {
    expectGroupedLane(defense, "defensive-front", [
      "def-le",
      "def-ldt",
      "def-rdt",
      "def-re",
    ]);
  });
});
