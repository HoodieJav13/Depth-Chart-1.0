import { useRef, type DragEvent } from "react";
import type { Player, PositionConfig } from "../domain/types";

interface PositionStackProps {
  position: PositionConfig;
  playerIds: string[];
  playersById: Map<string, Player>;
  selectedPlayerId: string | null;
  expanded: boolean;
  inLane?: boolean;
  onToggle: (positionId: string) => void;
  onMovePlayer: (playerId: string, positionId: string, toDepthIndex?: number) => void;
  onStarterDragStart?: () => void;
  onStarterDragEnd?: () => void;
  oppositePositionLabels?: string[];
}

export const PositionStack = ({
  position,
  playerIds,
  playersById,
  selectedPlayerId,
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

  const handlePositionClick = () => {
    if (suppressClickRef.current) return;
    if (selectedPlayerId) {
      onMovePlayer(selectedPlayerId, position.id);
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
    if (playerId) onMovePlayer(playerId, position.id);
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
        className={`field-position-card${players.length ? " occupied" : " empty"}${selectedPlayerId ? " placement-target" : ""}`}
        type="button"
        draggable={Boolean(players[0])}
        aria-expanded={expanded}
        aria-label={`${position.label} depth chart, ${players.length} players`}
        onClick={handlePositionClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <span className="field-position-chip">{position.label}</span>
        {players[0]?.number?.trim() ? (
          <span className="field-jersey-number">{players[0].number.trim()}</span>
        ) : null}
        {players[0] ? (
          <span className="field-player-name">{players[0].name}</span>
        ) : null}
        {players[0] && oppositePositionLabels.length ? (
          <span className="opposite-position-chip">{oppositePositionLabels.join(" / ")}</span>
        ) : null}
        {players.length > 1 ? (
          <span className="additional-depth">+{players.length - 1}</span>
        ) : null}
      </button>

    </div>
  );
};
