import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Player, PositionConfig } from "../domain/types";
import { FieldPositionCard } from "./FieldPositionCard";

const position: PositionConfig = {
  id: "off-lt",
  label: "LT",
  x: 42,
  y: 30,
  listOrder: 1,
};

const starter: Player = {
  id: "p01",
  name: "Skyler Pasternak",
  number: "72",
};

const backup: Player = {
  id: "p02",
  name: "Malachi",
  number: "61",
};

interface RenderCardOptions {
  players?: Player[];
  selectedPlayerId?: string | null;
  onOpenPosition?: (positionId: string) => void;
  onMovePlayer?: (playerId: string, positionId: string) => void;
  onFieldDragStart?: () => void;
}

const renderCard = ({
  players = [starter, backup],
  selectedPlayerId = null,
  onOpenPosition = vi.fn(),
  onMovePlayer = vi.fn(),
  onFieldDragStart = vi.fn(),
}: RenderCardOptions = {}) =>
  render(
    <FieldPositionCard
      position={position}
      players={players}
      selectedPlayerId={selectedPlayerId}
      oppositePositionLabel={null}
      onOpenPosition={onOpenPosition}
      onMovePlayer={onMovePlayer}
      onFieldDragStart={onFieldDragStart}
    />,
  );

describe("FieldPositionCard", () => {
  it("renders one occupied card with position, jersey, full name, and depth count", () => {
    renderCard();

    expect(screen.getByRole("button", { name: "LT depth chart, 2 players" })).toBeInTheDocument();
    expect(screen.getByText("LT")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Skyler Pasternak")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("opens the position detail when no player is selected", () => {
    const onOpenPosition = vi.fn();
    renderCard({ onOpenPosition });

    fireEvent.click(screen.getByRole("button", { name: "LT depth chart, 2 players" }));

    expect(onOpenPosition).toHaveBeenCalledWith("off-lt");
  });

  it("places the selected player instead of opening detail", () => {
    const onOpenPosition = vi.fn();
    const onMovePlayer = vi.fn();
    renderCard({ selectedPlayerId: "p02", onOpenPosition, onMovePlayer });

    fireEvent.click(screen.getByRole("button", { name: "LT depth chart, 2 players" }));

    expect(onMovePlayer).toHaveBeenCalledWith("p02", "off-lt");
    expect(onOpenPosition).not.toHaveBeenCalled();
  });

  it("renders an empty position as a non-draggable drop target", () => {
    renderCard({ players: [] });

    const card = screen.getByRole("button", { name: "LT depth chart, empty" });
    expect(card).toHaveAttribute("draggable", "false");
    expect(screen.queryByText("72")).not.toBeInTheDocument();
  });
});
