import type { DragEvent } from "react";
import type { Player, PositionConfig } from "../domain/types";

interface FieldPositionCardProps {
  position: PositionConfig;
  players: Player[];
  selectedPlayerId: string | null;
  oppositePositionLabel: string | null;
  onOpenPosition: (positionId: string) => void;
  onMovePlayer: (playerId: string, positionId: string) => void;
  onFieldDragStart: () => void;
}

export const FieldPositionCard = ({
  position,
  players,
  selectedPlayerId,
  oppositePositionLabel,
  onOpenPosition,
  onMovePlayer,
  onFieldDragStart,
}: FieldPositionCardProps) => {
  const starter = players[0] ?? null;
  const jerseyNumber = starter?.number?.trim() ?? "";
  const depthCount = players.length;
  const ariaLabel = depthCount
    ? `${position.label} depth chart, ${depthCount} ${depthCount === 1 ? "player" : "players"}`
    : `${position.label} depth chart, empty`;

  const handleClick = () => {
    if (selectedPlayerId) {
      onMovePlayer(selectedPlayerId, position.id);
      return;
    }
    onOpenPosition(position.id);
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (!starter) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/player-id", starter.id);
    onFieldDragStart();
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("text/player-id");
    if (playerId) onMovePlayer(playerId, position.id);
  };

  return (
    <button
      className={`field-position-card${starter ? " occupied" : " empty"}${
        selectedPlayerId ? " ready-to-place" : ""
      }`}
      type="button"
      draggable={Boolean(starter)}
      aria-label={ariaLabel}
      data-position-id={position.id}
      data-starter-id={starter?.id}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <span className="field-position-chip">{position.label}</span>
      {oppositePositionLabel ? (
        <span className="field-opposite-chip" aria-label={`Also ${oppositePositionLabel}`}>
          {oppositePositionLabel}
        </span>
      ) : null}
      {starter ? (
        <>
          <span className={`field-jersey-number${jerseyNumber ? "" : " missing"}`}>
            {jerseyNumber || "—"}
          </span>
          <span className="field-player-name">{starter.name}</span>
          {depthCount > 1 ? (
            <span className="field-depth-badge">+{depthCount - 1}</span>
          ) : null}
        </>
      ) : (
        <span className="field-empty-label">Open depth</span>
      )}
    </button>
  );
};
