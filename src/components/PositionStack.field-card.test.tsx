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
  roleName: "Quarterback",
};

const players = new Map<string, Player>([
  ["p01", { id: "p01", name: "Skyler Pasternak", number: "12" }],
  ["p02", { id: "p02", name: "Malachi", number: "7" }],
  ["p03", { id: "p03", name: "Tristan Lee", number: "25" }],
  ["p04", { id: "p04", name: "Andres Chavez" }],
  ["p05", { id: "p05", name: "Ryan Adams", number: "31" }],
]);

const renderPosition = ({
  playerIds = ["p01", "p02"],
  selectedPlayerId = null,
  compact = false,
  positionConfig = position,
}: {
  playerIds?: string[];
  selectedPlayerId?: string | null;
  compact?: boolean;
  positionConfig?: PositionConfig;
} = {}) => {
  const onToggle = vi.fn();
  const onMovePlayer = vi.fn();
  const view = render(
    <PositionStack
      position={positionConfig}
      playerIds={playerIds}
      playersById={players}
      selectedPlayerId={selectedPlayerId}
      expanded={false}
      compact={compact}
      onToggle={onToggle}
      onMovePlayer={onMovePlayer}
      oppositePositionLabels={["M"]}
    />,
  );
  return {
    ...view,
    getByRole: within(view.container).getByRole,
    queryByRole: within(view.container).queryByRole,
    onToggle,
    onMovePlayer,
  };
};

const starterCard = (getByRole: ReturnType<typeof renderPosition>["getByRole"], count: number) =>
  getByRole("button", { name: `Q depth chart, ${count} players` });

describe("position column", () => {
  it("anchors the column with a label block above the card", () => {
    const { container } = renderPosition();
    const block = container.querySelector(".position-label-block");

    expect(block?.querySelector(".position-role-name")).toHaveTextContent("Quarterback");
    expect(block?.querySelector(".position-code")).toHaveTextContent("Q");

    // The label block precedes the card in document order.
    const column = container.querySelector(".position-column") as HTMLElement;
    expect(column.firstElementChild).toBe(block);
  });

  it("omits the role name where the position letter is itself the role", () => {
    const { container } = renderPosition({
      positionConfig: { id: "off-z", label: "Z", x: 14, y: 32, listOrder: 10 },
    });
    expect(container.querySelector(".position-role-name")).toBeNull();
    expect(container.querySelector(".position-code")).toHaveTextContent("Z");
  });

  it("builds the card as hero number over a dedicated nameplate", () => {
    const { container, getByRole } = renderPosition();
    const card = starterCard(getByRole, 2);

    expect(card.querySelector(".field-card-hero .field-jersey-number")).toHaveTextContent("12");
    expect(card.querySelector(".field-card-nameplate .field-player-name")).toHaveTextContent(
      "Skyler Pasternak",
    );
    expect(card.querySelector(".opposite-position-chip")).toHaveTextContent("M");
    expect(container.querySelector(".position-marker")).toBeNull();
  });

  it("does not repeat the position code inside the card, since the label block carries it", () => {
    const { container, getByRole } = renderPosition();
    const card = starterCard(getByRole, 2);
    const labelCodes = container.querySelectorAll(".position-code");

    expect(labelCodes).toHaveLength(1);
    expect(labelCodes[0]).toHaveTextContent("Q");
    expect(card.querySelector(".position-code")).toBeNull();
    expect(card.querySelector(".field-position-chip")).toBeNull();
  });

  it("shows only the primary cross-listing on a compact card, which cannot hold a joined list", () => {
    const view = render(
      <PositionStack
        position={{ id: "off-lg", label: "LG", x: 46, y: 30, listOrder: 2, roleName: "Left Guard" }}
        playerIds={["p01"]}
        playersById={players}
        selectedPlayerId={null}
        expanded={false}
        compact
        onToggle={vi.fn()}
        onMovePlayer={vi.fn()}
        oppositePositionLabels={["LDT", "RDT"]}
      />,
    );
    expect(view.container.querySelector(".opposite-position-chip")).toHaveTextContent("LDT");
    expect(view.container.querySelector(".opposite-position-chip")).not.toHaveTextContent("RDT");
    view.unmount();

    const full = renderPosition({ playerIds: ["p01"] });
    expect(full.container.querySelector(".opposite-position-chip")).toHaveTextContent("M");
  });

  it("falls back to initials in the hero zone when a player has no jersey number", () => {
    const { container } = renderPosition({ playerIds: ["p04"] });
    expect(container.querySelector(".field-jersey-number")).toBeNull();
    expect(container.querySelector(".field-hero-initials")).toHaveTextContent("AC");
    expect(container.querySelector(".field-player-name")).toHaveTextContent("Andres Chavez");
  });

  it("keeps the full name in the nameplate, away from the depth badge", () => {
    const { container } = renderPosition({ playerIds: ["p03", "p02"] });
    const nameplate = container.querySelector(".field-card-nameplate") as HTMLElement;
    const badge = container.querySelector(".additional-depth") as HTMLElement;

    expect(nameplate).toHaveTextContent("Tristan Lee");
    expect(nameplate).not.toContainElement(badge);
    expect(container.querySelector(".field-card-top")).toContainElement(badge);
  });

  it("names up to two backups in strips and counts every backup in the badge", () => {
    const { container } = renderPosition({ playerIds: ["p01", "p02", "p03", "p05"] });
    const strips = container.querySelectorAll(".depth-strip");

    expect(strips).toHaveLength(2);
    // Full names, not truncated to fit.
    expect(strips[0].querySelector(".depth-strip-name")).toHaveTextContent("Malachi");
    expect(strips[0].querySelector(".depth-strip-number")).toHaveTextContent("7");
    expect(strips[1].querySelector(".depth-strip-name")).toHaveTextContent("Tristan Lee");
    // Badge counts all three backups, so hiding a strip responsively stays truthful.
    expect(container.querySelector(".additional-depth")).toHaveTextContent("+3");
  });

  it("gives compact trench columns no strips, keeping their depth in the badge", () => {
    const { container } = renderPosition({
      playerIds: ["p01", "p02", "p03"],
      compact: true,
    });
    expect(container.querySelectorAll(".depth-strip")).toHaveLength(0);
    expect(container.querySelector(".additional-depth")).toHaveTextContent("+2");
    expect(container.querySelector(".position-column")).toHaveClass("compact");
  });

  it("renders an empty position as a non-draggable card with no nameplate", () => {
    const { container, getByRole } = renderPosition({ playerIds: [] });
    const card = getByRole("button", { name: "Q depth chart, 0 players" });

    expect(card).toHaveClass("field-position-card", "empty");
    expect(card).not.toHaveAttribute("draggable", "true");
    expect(card.querySelector(".field-hero-empty")).toHaveTextContent("Q");
    expect(container.querySelector(".field-card-nameplate")).toBeNull();
  });

  it("distinguishes the selected source card from other valid placement targets", () => {
    const source = renderPosition({ selectedPlayerId: "p01" });
    const sourceCard = starterCard(source.getByRole, 2);
    expect(sourceCard).toHaveClass("selected-source");
    expect(sourceCard).not.toHaveClass("placement-target");
    expect(sourceCard).toHaveAttribute("data-placement-state", "source");
    expect(sourceCard).toHaveAttribute("aria-current", "true");
    source.unmount();

    const target = renderPosition({ selectedPlayerId: "p03" });
    const targetCard = starterCard(target.getByRole, 2);
    expect(targetCard).toHaveClass("placement-target");
    expect(targetCard).not.toHaveClass("selected-source");
    expect(targetCard).toHaveAttribute("data-placement-state", "target");
    expect(targetCard).not.toHaveAttribute("aria-current");
  });

  it("opens position detail without selecting the starter when no player is selected", () => {
    const { getByRole, onToggle, onMovePlayer } = renderPosition();

    fireEvent.click(starterCard(getByRole, 2));

    expect(onToggle).toHaveBeenCalledWith("off-q");
    expect(onMovePlayer).not.toHaveBeenCalled();
  });

  it("places the selected player without opening detail", () => {
    const { getByRole, onToggle, onMovePlayer } = renderPosition({
      selectedPlayerId: "p05",
    });

    fireEvent.click(starterCard(getByRole, 2));

    expect(onMovePlayer).toHaveBeenCalledWith("p05", "off-q");
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("gives backup strips the card's click semantics without making them drag sources", () => {
    const { container, getByRole, onToggle } = renderPosition({
      playerIds: ["p01", "p02"],
    });
    const strip = getByRole("button", { name: "Malachi, depth 2 at Q" });

    expect(strip).not.toHaveAttribute("draggable", "true");
    fireEvent.click(strip);
    expect(onToggle).toHaveBeenCalledWith("off-q");

    // Only the starter card is draggable.
    const draggable = container.querySelectorAll('[draggable="true"]');
    expect(draggable).toHaveLength(1);
    expect(draggable[0]).toHaveClass("field-position-card");
  });

  it("drags the displayed starter and suppresses the click generated after drag completion", () => {
    vi.useFakeTimers();
    const { getByRole, onToggle } = renderPosition();
    const card = starterCard(getByRole, 2);
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
