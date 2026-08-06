import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FormationConfig, Player } from "../domain/types";
import { PrintDepthChart } from "./PrintDepthChart";

const formation: FormationConfig = {
  id: "test",
  name: "Offense",
  unit: "offense",
  positions: [{ id: "q", label: "Q", x: 0, y: 0, listOrder: 1 }],
};

describe("PrintDepthChart", () => {
  it("renders ordered depth players from the active chart", () => {
    const players = new Map<string, Player>([
      ["p01", { id: "p01", name: "Starter", number: "1" }],
      ["p02", { id: "p02", name: "Backup", number: "2" }],
    ]);
    render(
      <PrintDepthChart
        title="Week 1"
        date="August 6, 2026"
        formation={formation}
        assignments={{ q: ["p01", "p02"] }}
        playersById={players}
      />,
    );
    expect(screen.getByRole("heading", { name: "Week 1" })).toBeInTheDocument();
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Backup")).toBeInTheDocument();
  });
});
