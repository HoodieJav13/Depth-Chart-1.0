import { useRef, type DragEvent } from "react";
import type { Player, PositionConfig } from "../domain/types";

const VISIBLE_BACKUP_STRIPS = 2;

/** Hero fallback when a player has no jersey number stored. */
const heroInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

interface PositionStackProps {
  position: PositionConfig;
  playerIds: string[];
  playersById: Map<string, Player>;
  selectedPlayerId: string | null;
  expanded: boolean;
  compact?: boolean;
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
  compact = false,
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
  const starter = players[0];
  const backups = players.slice(1);
  // Compact cards cannot carry a legible name strip, so trench depth stays in the badge.
  const strips = compact ? [] : backups.slice(0, VISIBLE_BACKUP_STRIPS);
  const isSelectedSource = Boolean(
    selectedPlayerId && playerIds.includes(selectedPlayerId),
  );
  const placementState = isSelectedSource
    ? "source"
    : selectedPlayerId
      ? "target"
      : "idle";
  const jerseyNumber = starter?.number?.trim();
  // A trench card is too narrow for a joined list; the detail panel carries the full picture.
  const oppositeLabel = compact
    ? oppositePositionLabels[0]
    : oppositePositionLabels.join(" / ");

  const handlePositionClick = () => {
    if (suppressClickRef.current) return;
    if (selectedPlayerId) {
      onMovePlayer(selectedPlayerId, position.id);
      return;
    }
    onToggle(position.id);
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
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
      className={`position-column${expanded ? " expanded" : ""}${compact ? " compact" : ""}`}
      data-position-id={position.id}
      data-testid={`position-${position.id}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <span className="position-label-block">
        {position.roleName ? (
          <span className="position-role-name">{position.roleName}</span>
        ) : null}
        <span className="position-code">{position.label}</span>
      </span>

      <button
        className={`field-position-card${players.length ? " occupied" : " empty"}${isSelectedSource ? " selected-source" : selectedPlayerId ? " placement-target" : ""}`}
        type="button"
        draggable={Boolean(starter)}
        aria-expanded={expanded}
        aria-current={isSelectedSource ? "true" : undefined}
        aria-label={`${position.label} depth chart, ${players.length} players`}
        data-placement-state={placementState}
        onClick={handlePositionClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <span className="field-card-top">
          {starter && oppositeLabel ? (
            <span className="opposite-position-chip">{oppositeLabel}</span>
          ) : null}
          {backups.length ? (
            <span className="additional-depth">+{backups.length}</span>
          ) : null}
        </span>

        <span className="field-card-hero" aria-hidden={starter ? undefined : "true"}>
          {starter ? (
            <span className={jerseyNumber ? "field-jersey-number" : "field-hero-initials"}>
              {jerseyNumber ?? heroInitials(starter.name)}
            </span>
          ) : (
            <span className="field-hero-empty">{position.label}</span>
          )}
        </span>

        {starter ? (
          <span className="field-card-nameplate">
            <span className="field-player-name">{starter.name}</span>
          </span>
        ) : null}
      </button>

      {strips.length ? (
        <span className="depth-strips">
          {strips.map((player, index) => (
            <button
              key={player.id}
              className="depth-strip"
              type="button"
              aria-label={`${player.name}, depth ${index + 2} at ${position.label}`}
              onClick={handlePositionClick}
            >
              {player.number?.trim() ? (
                <span className="depth-strip-number">{player.number.trim()}</span>
              ) : null}
              <span className="depth-strip-name">{player.name}</span>
            </button>
          ))}
        </span>
      ) : null}
    </div>
  );
};
