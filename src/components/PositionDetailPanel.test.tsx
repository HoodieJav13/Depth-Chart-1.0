import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Player, PositionConfig } from "../domain/types";
import { PositionDetailPanel } from "./PositionDetailPanel";

const position: PositionConfig = {
  id: "off-q",
  label: "Q",
  x: 50,
  y: 42,
  listOrder: 6,
};
const players: Player[] = [
  { id: "p01", name: "Skyler Pasternak", number: "12" },
  { id: "p02", name: "Malachi", number: "7" },
];

describe("PositionDetailPanel", () => {
  it("shows ordered depth and exposes select, reorder, unassign, edit, archive, and close", () => {
    const onClose = vi.fn();
    const onSelectPlayer = vi.fn();
    const onMovePlayer = vi.fn();
    const onUnassignPlayer = vi.fn();
    const onEditPlayer = vi.fn();
    const onArchivePlayer = vi.fn();
    const view = render(
      <PositionDetailPanel
        position={position}
        players={players}
        selectedPlayerId="p01"
        onClose={onClose}
        onSelectPlayer={onSelectPlayer}
        onMovePlayer={onMovePlayer}
        onUnassignPlayer={onUnassignPlayer}
        onEditPlayer={onEditPlayer}
        onArchivePlayer={onArchivePlayer}
        assignmentSummary={() => ["Offense: Q", "Defense: FS"]}
      />,
    );
    const panel = view.container.querySelector(".position-detail-panel") as HTMLElement;

    expect(within(panel).getByRole("heading", { name: "Q Depth" })).toBeInTheDocument();
    const rows = panel.querySelectorAll(".position-detail-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Skyler Pasternak");
    expect(rows[0]).toHaveTextContent("Offense: Q");
    expect(rows[0]).toHaveTextContent("Defense: FS");
    expect(rows[1]).toHaveTextContent("Malachi");

    const starterButton = within(rows[0] as HTMLElement).getByRole("button", { name: /^#12Skyler Pasternak$/ });
    fireEvent.click(starterButton);
    expect(onSelectPlayer).toHaveBeenCalledWith("p01");

    const dataTransfer = { getData: vi.fn(() => "p02") };
    fireEvent.drop(starterButton, { dataTransfer });
    expect(onMovePlayer).toHaveBeenCalledWith("p02", "off-q", 0);

    fireEvent.click(within(rows[0] as HTMLElement).getByRole("button", { name: "Unassign Skyler Pasternak" }));
    expect(onUnassignPlayer).toHaveBeenCalledWith("p01");

    fireEvent.click(within(rows[0] as HTMLElement).getByRole("button", { name: "Edit Skyler Pasternak" }));
    fireEvent.click(within(rows[0] as HTMLElement).getByRole("button", { name: "Archive Skyler Pasternak" }));
    expect(onEditPlayer).toHaveBeenCalledWith(players[0]);
    expect(onArchivePlayer).toHaveBeenCalledWith(players[0]);

    fireEvent.click(within(panel).getByRole("button", { name: "Close position detail" }));
    expect(onClose).toHaveBeenCalled();
  });
});
