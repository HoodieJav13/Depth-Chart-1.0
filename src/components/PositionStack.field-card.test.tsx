import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Player, PositionConfig } from "../domain/types";
import { PositionStack } from "./PositionStack";

const position: PositionConfig = {
  id: "off-q",
  label: "Q",
  x: 50,
  y: 42,
  listOrder: 6,
};

const players = new Map<string, Player>([
  ["p01", { id: "p01", name: "Skyler Pasternak", number: "12" }],
  ["p02", { id: "p02", name: "Malachi", number: "7" }],
  ["p03", { id: "p03", name: "Tristan Lee", number: "25" }],
]);

const renderPosition = ({
  playerIds = ["p01", "p02"],
  selectedPlayerId = null,
}: {
  playerIds?: string[];
  selectedPlayerId?: string | null;
} = {}) => {
  const onToggle = vi.fn();
  const onMovePlayer = vi.fn();
  const view = render(
    <PositionStack
      position={position}
      playerIds={playerIds}
      playersById={players}
      selectedPlayerId={selectedPlayerId}
      expanded={false}
      onToggle={onToggle}
      onMovePlayer={onMovePlayer}
      oppositePositionLabels={["FS"]}
    />,
  );
  return {
    ...view,
    getByRole: within(view.container).getByRole,
    onToggle,
    onMovePlayer,
  };
};

describe("PositionStack field card", () => {
  it("renders an occupied position as one card with position, dominant number, full name, and depth badge", () => {
    const { container, getByRole } = renderPosition();

    const card = getByRole("button", {
      name: "Q depth chart, 2 players",
    });
    expect(card).toHaveClass("field-position-card");
    expect(card).toHaveAttribute("draggable", "true");
    expect(card).toHaveTextContent("Q");
    expect(card).toHaveTextContent("12");
    expect(card).toHaveTextContent("Skyler Pasternak");
    expect(card).toHaveTextContent("+1");
    expect(card.querySelector(".opposite-position-chip")).toHaveTextContent("FS");
    expect(container.querySelector(".position-marker")).toBeNull();
    expect(container.querySelector(".starter-preview")).toBeNull();
  });

  it("reserves the card header for depth metadata so the badge cannot occlude the full player name", () => {
    const { container } = renderPosition({ playerIds: ["p03", "p02"] });
    const header = container.querySelector(".field-card-header");
    const name = container.querySelector(".field-player-name");
    const depth = container.querySelector(".additional-depth");

    expect(name).toHaveTextContent("Tristan Lee");
    expect(header).toContainElement(depth as HTMLElement);
    expect(name).not.toContainElement(depth as HTMLElement);
  });

  it("distinguishes the selected source card from other valid placement targets", () => {
    const source = renderPosition({ selectedPlayerId: "p01" });
    const sourceCard = source.getByRole("button", { name: "Q depth chart, 2 players" });
    expect(sourceCard).toHaveClass("selected-source");
    expect(sourceCard).not.toHaveClass("placement-target");
    expect(sourceCard).toHaveAttribute("data-placement-state", "source");
    expect(sourceCard).toHaveAttribute("aria-current", "true");
    source.unmount();

    const target = renderPosition({ selectedPlayerId: "p03" });
    const targetCard = target.getByRole("button", { name: "Q depth chart, 2 players" });
    expect(targetCard).toHaveClass("placement-target");
    expect(targetCard).not.toHaveClass("selected-source");
    expect(targetCard).toHaveAttribute("data-placement-state", "target");
    expect(targetCard).not.toHaveAttribute("aria-current");
  });

  it("renders an empty position using the same non-draggable card surface", () => {
    const { getByRole } = renderPosition({ playerIds: [] });

    const card = getByRole("button", {
      name: "Q depth chart, 0 players",
    });
    expect(card).toHaveClass("field-position-card", "empty");
    expect(card).not.toHaveAttribute("draggable", "true");
    expect(card).toHaveTextContent("Q");
    expect(card).not.toHaveTextContent("Skyler Pasternak");
  });

  it("opens position detail without selecting the starter when no player is selected", () => {
    const { getByRole, onToggle, onMovePlayer } =
      renderPosition();

    fireEvent.click(
      getByRole("button", { name: "Q depth chart, 2 players" }),
    );

    expect(onToggle).toHaveBeenCalledWith("off-q");
    expect(onMovePlayer).not.toHaveBeenCalled();
  });

  it("places the selected player without opening detail", () => {
    const { getByRole, onToggle, onMovePlayer } =
      renderPosition({ selectedPlayerId: "p02" });

    fireEvent.click(
      getByRole("button", { name: "Q depth chart, 2 players" }),
    );

    expect(onMovePlayer).toHaveBeenCalledWith("p02", "off-q");
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("drags the displayed starter and suppresses the click generated after drag completion", () => {
    vi.useFakeTimers();
    const { getByRole, onToggle } = renderPosition();
    const card = getByRole("button", {
      name: "Q depth chart, 2 players",
    });
    const dataTransfer = {
      effectAllowed: "none",
      setData: vi.fn(),
      getData: vi.fn(),
    };

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragEnd(card, { dataTransfer });
    fireEvent.click(card);

    expect(dataTransfer.effectAllowed).toBe("move");
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/player-id", "p01");
    expect(onToggle).not.toHaveBeenCalled();

    vi.runAllTimers();
    fireEvent.click(card);
    expect(onToggle).toHaveBeenCalledWith("off-q");
    vi.useRealTimers();
  });
});
