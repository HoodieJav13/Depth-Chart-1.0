import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formationConfig } from "../domain/config";
import type { Player, PositionConfig } from "../domain/types";
import { PositionStack } from "./PositionStack";

const offensiveLineIds = ["off-lt", "off-lg", "off-c", "off-rg", "off-rt"];

const renderDensePosition = (position: PositionConfig) => {
  const { container } = render(
    <PositionStack
      position={position}
      playerIds={[]}
      playersById={new Map<string, Player>()}
      selectedPlayerId={null}
      expanded={false}
      dense
      onToggle={vi.fn()}
      onSelectPlayer={vi.fn()}
      onMovePlayer={vi.fn()}
    />,
  );

  return container.querySelector<HTMLElement>(`[data-position-id="${position.id}"]`);
};

describe("dense offensive-line hit targets", () => {
  it("uses a narrow position-node hitbox instead of the default 108px container", () => {
    const offense = formationConfig.formations.find((formation) => formation.id === "offense-base");
    const center = offense?.positions.find((position) => position.id === "off-c");
    expect(center).toBeDefined();

    const node = renderDensePosition(center!);
    expect(node).not.toBeNull();
    expect(node).toHaveStyle({ width: "54px" });
  });

  it("spaces the five offensive-line centers at least six percentage points apart", () => {
    const offense = formationConfig.formations.find((formation) => formation.id === "offense-base");
    expect(offense).toBeDefined();

    const line = offensiveLineIds.map((id) => offense!.positions.find((position) => position.id === id)!);
    for (let index = 1; index < line.length; index += 1) {
      expect(line[index].x - line[index - 1].x).toBeGreaterThanOrEqual(6);
    }
  });
});
