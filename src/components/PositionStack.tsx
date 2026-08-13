import { useRef, type DragEvent } from "react";
import type { Player, PositionConfig } from "../domain/types";

interface PositionStackProps {
  position: PositionConfig;
  playerIds: string[];
  playersById: Map<string, Player>;
  selectedPlayerId: string | null;
  selectedFromPositionId?: string;
  expanded: boolean;
  inLane?: boolean;
  onToggle: (positionId: string) => void;
  onMovePlayer: (playerId: string, positionId: string, toDepthIndex?: number, fromPositionId?: string) => void;
  onStarterDragStart?: () => void;
  onStarterDragEnd?: () => void;
  oppositePositionLabels?: string[];
}

export const PositionStack = ({
  position,
  playerIds,
  playersById,
  selectedPlayerId,
  selectedFromPositionId,
  expanded,
  inLane = false,
  onToggle,
  onMovePlayer,
  onStarterDragStart,
  onStarterDragEnd,
  oppositePositionLabels = [],
}: PositionStackProps) => {
  const suppressClickRef = useRef(false);
  const players = playerIds.flatMap((id) => {
    const player = playersById.get(id);
    return player ? [player] : [];
  });
  const isSelectedSource = Boolean(
    selectedPlayerId && selectedFromPositionId === position.id,
  );
  const placementState = isSelectedSource
    ? "source"
    : selectedPlayerId
      ? "target"
      : "idle";

  const handlePositionClick = () => {
    if (suppressClickRef.current) return;
    if (selectedPlayerId) {
      onMovePlayer(selectedPlayerId, position.id, undefined, selectedFromPositionId);
      return;
    }
    onToggle(position.id);
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    const starter = players[0];
    if (!starter) return;
    suppressClickRef.current = true;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/player-id", starter.id);
    event.dataTransfer.setData("text/from-position-id", position.id);
    onStarterDragStart?.();
  };

  const handleDragEnd = () => {
    onStarterDragEnd?.();
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("text/player-id");
    const fromPositionId = event.dataTransfer.getData("text/from-position-id") || undefined;
    if (playerId) onMovePlayer(playerId, position.id, undefined, fromPositionId);
  };

  return (
    <div
      className={`position-node${expanded ? " expanded" : ""}${inLane ? " lane-position" : ""}`}
      style={inLane ? undefined : { left: `${position.x}%`, top: `${position.y}%` }}
      data-position-id={position.id}
      data-testid={`position-${position.id}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <button
        className={`field-position-card${players.length ? " occupied" : " empty"}${isSelectedSource ? " selected-source" : selectedPlayerId ? " placement-target" : ""}`}
        type="button"
        draggable={Boolean(players[0])}
        aria-expanded={expanded}
        aria-current={isSelectedSource ? "true" : undefined}
        aria-label={`${position.label} depth chart, ${players.length} players`}
        data-placement-state={placementState}
        onClick={handlePositionClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <span className="field-card-header">
          <span className="field-position-chip">{position.label}</span>
          <span className="field-card-meta">
            {players[0] && oppositePositionLabels.length ? (
              <span className="opposite-position-chip">{oppositePositionLabels.join(" / ")}</span>
            ) : null}
            {players.length > 1 ? (
              <span className="additional-depth">+{players.length - 1}</span>
            ) : null}
          </span>
        </span>
        {players[0]?.number?.trim() ? (
          <span className="field-jersey-number">{players[0].number.trim()}</span>
        ) : null}
        {players[0] ? (
          <span className="field-player-name">{players[0].name}</span>
        ) : null}
      </button>

    </div>
  );
};
