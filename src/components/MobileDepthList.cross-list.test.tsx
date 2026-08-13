import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FormationConfig, Player } from "../domain/types";
import { MobileDepthList } from "./MobileDepthList";

const formation: FormationConfig = {
  id: "defense-base",
  name: "Defense",
  unit: "defense",
  positions: [
    { id: "def-bandit", label: "B", x: 70, y: 40, listOrder: 1 },
    { id: "def-fs", label: "FS", x: 50, y: 56, listOrder: 2 },
  ],
};
const playersById = new Map<string, Player>([
  ["p01", { id: "p01", name: "Reid Alcaraz", number: "1" }],
  ["p02", { id: "p02", name: "William Witwer", number: "3" }],
]);

describe("MobileDepthList cross-listing", () => {
  it("offers Cross-list controls for each assigned player row", () => {
    const onCrossListPlayer = vi.fn();
    const view = render(
      <MobileDepthList
        formation={formation}
        assignments={{ "def-bandit": ["p01"], "def-fs": ["p02"] }}
        playersById={playersById}
        selectedPlayerId={null}
        onSelectPlayer={vi.fn()}
        onMovePlayer={vi.fn()}
        onCrossListPlayer={onCrossListPlayer}
      />,
    );

    fireEvent.click(view.getByRole("button", { name: "Cross-list Reid Alcaraz" }));
    fireEvent.change(view.getByRole("combobox", { name: "Cross-list position for Reid Alcaraz" }), {
      target: { value: "def-fs" },
    });
    fireEvent.change(view.getByRole("combobox", { name: "Cross-list depth for Reid Alcaraz" }), {
      target: { value: "1" },
    });
    fireEvent.click(view.getByRole("button", { name: "Add Reid Alcaraz at another position" }));

    expect(onCrossListPlayer).toHaveBeenCalledWith("p01", "def-fs", 1);
  });
});
