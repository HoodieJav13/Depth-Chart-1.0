import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Player, PositionConfig } from "../domain/types";
import { PositionStack } from "./PositionStack";

const center: PositionConfig = {
  id: "off-c",
  label: "C",
  x: 50,
  y: 30,
  listOrder: 3,
};

describe("dense position hit targets", () => {
  it("shrinks the position-node hitbox to the marker width so adjacent OL wrappers cannot steal clicks", () => {
    const { container } = render(
      <PositionStack
        position={center}
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

    const node = container.querySelector<HTMLElement>('[data-position-id="off-c"]');
    expect(node).not.toBeNull();
    expect(node).toHaveStyle({ width: "48px" });
  });
});
