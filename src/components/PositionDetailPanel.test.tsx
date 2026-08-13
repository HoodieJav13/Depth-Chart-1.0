import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FormationConfig, Player, PositionAssignments, PositionConfig } from "../domain/types";
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
const formation: FormationConfig = {
  id: "offense-base",
  name: "Offense",
  unit: "offense",
  positions: [
    position,
    { id: "off-t", label: "RB", x: 50, y: 54, listOrder: 7 },
  ],
};
const assignments: PositionAssignments = {
  "off-q": ["p01", "p02"],
  "off-t": ["p03"],
};

describe("PositionDetailPanel", () => {
  it("shows ordered depth and exposes select, reorder, unassign, edit, archive, and close", () => {
    const onClose = vi.fn();
    const onSelectPlayer = vi.fn();
    const onMovePlayer = vi.fn();
    const onUnassignPlayer = vi.fn();
    const onCrossListPlayer = vi.fn();
    const onEditPlayer = vi.fn();
    const onArchivePlayer = vi.fn();
    const view = render(
      <PositionDetailPanel
        position={position}
        formation={formation}
        assignments={assignments}
        players={players}
        selectedPlayerId="p01"
        onClose={onClose}
        onSelectPlayer={onSelectPlayer}
        onMovePlayer={onMovePlayer}
        onUnassignPlayer={onUnassignPlayer}
        onCrossListPlayer={onCrossListPlayer}
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
    expect(onSelectPlayer).toHaveBeenCalledWith("p01", "off-q");

    const dataTransfer = {
      getData: vi.fn((type: string) => type === "text/player-id" ? "p02" : "off-q"),
    };
    fireEvent.drop(starterButton, { dataTransfer });
    expect(onMovePlayer).toHaveBeenCalledWith("p02", "off-q", 0, "off-q");

    fireEvent.click(within(rows[0] as HTMLElement).getByRole("button", { name: "Unassign Skyler Pasternak" }));
    expect(onUnassignPlayer).toHaveBeenCalledWith("p01", "off-q");

    fireEvent.click(within(rows[0] as HTMLElement).getByRole("button", { name: "Edit Skyler Pasternak" }));
    fireEvent.click(within(rows[0] as HTMLElement).getByRole("button", { name: "Archive Skyler Pasternak" }));
    expect(onEditPlayer).toHaveBeenCalledWith(players[0]);
    expect(onArchivePlayer).toHaveBeenCalledWith(players[0]);

    fireEvent.click(within(panel).getByRole("button", { name: "Close position detail" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("offers an intentional cross-list action with another position and depth", () => {
    const onCrossListPlayer = vi.fn();
    const view = render(
      <PositionDetailPanel
        position={position}
        formation={formation}
        assignments={assignments}
        players={players}
        selectedPlayerId={null}
        onClose={vi.fn()}
        onSelectPlayer={vi.fn()}
        onMovePlayer={vi.fn()}
        onUnassignPlayer={vi.fn()}
        onCrossListPlayer={onCrossListPlayer}
        onEditPlayer={vi.fn()}
        onArchivePlayer={vi.fn()}
      />,
    );
    const firstRow = view.container.querySelectorAll(".position-detail-row")[0] as HTMLElement;

    fireEvent.click(within(firstRow).getByRole("button", { name: "Cross-list Skyler Pasternak" }));
    fireEvent.change(within(firstRow).getByRole("combobox", { name: "Cross-list position for Skyler Pasternak" }), {
      target: { value: "off-t" },
    });
    fireEvent.change(within(firstRow).getByRole("combobox", { name: "Cross-list depth for Skyler Pasternak" }), {
      target: { value: "1" },
    });
    fireEvent.click(within(firstRow).getByRole("button", { name: "Add Skyler Pasternak at another position" }));

    expect(onCrossListPlayer).toHaveBeenCalledWith("p01", "off-t", 1);
  });

  it("clears an unfinished cross-list form when the displayed position changes", () => {
    const props = {
      formation,
      assignments,
      players,
      selectedPlayerId: null,
      onClose: vi.fn(),
      onSelectPlayer: vi.fn(),
      onMovePlayer: vi.fn(),
      onUnassignPlayer: vi.fn(),
      onCrossListPlayer: vi.fn(),
      onEditPlayer: vi.fn(),
      onArchivePlayer: vi.fn(),
    };
    const view = render(<PositionDetailPanel {...props} position={position} />);

    fireEvent.click(within(view.container).getByRole("button", { name: "Cross-list Skyler Pasternak" }));
    expect(within(view.container).getByRole("combobox", { name: "Cross-list position for Skyler Pasternak" })).toBeInTheDocument();

    view.rerender(
      <PositionDetailPanel
        {...props}
        position={formation.positions[1]}
        players={[players[1]]}
      />,
    );
    view.rerender(<PositionDetailPanel {...props} position={position} />);

    expect(within(view.container).queryByRole("combobox", { name: "Cross-list position for Skyler Pasternak" })).toBeNull();
  });
});
