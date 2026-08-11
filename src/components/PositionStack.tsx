import type { DragEvent } from "react";
import type { Player, PositionConfig } from "../domain/types";
import { PlayerCard } from "./PlayerCard";

interface PositionStackProps {
  position: PositionConfig;
  playerIds: string[];
  playersById: Map<string, Player>;
  selectedPlayerId: string | null;
  expanded: boolean;
  dense: boolean;
  onToggle: (positionId: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onMovePlayer: (playerId: string, positionId: string, toDepthIndex?: number) => void;
}

export const PositionStack = ({
  position,
  playerIds,
  playersById,
  selectedPlayerId,
  expanded,
  dense,
  onToggle,
  onSelectPlayer,
  onMovePlayer,
}: PositionStackProps) => {
  const players = playerIds.flatMap((id) => {
    const player = playersById.get(id);
    return player ? [player] : [];
  });

  const handlePositionClick = () => {
    if (selectedPlayerId) {
      onMovePlayer(selectedPlayerId, position.id);
      return;
    }
    onToggle(position.id);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("text/player-id");
    if (playerId) onMovePlayer(playerId, position.id);
  };

  return (
    <div
      className={`position-node${expanded ? " expanded" : ""}${dense ? " dense" : ""}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        ...(dense ? { width: "48px" } : {}),
      }}
      data-position-id={position.id}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <button
        className="position-marker"
        type="button"
        aria-expanded={expanded}
        aria-label={`${position.label} depth chart, ${players.length} players`}
        onClick={handlePositionClick}
      >
        <span>{position.label}</span>
        {players.length > 0 ? <strong>{players.length}</strong> : null}
      </button>

      {!expanded && players[0] ? (
        <div className="starter-preview">
          <PlayerCard
            player={players[0]}
            selected={selectedPlayerId === players[0].id}
            compact={dense}
            onSelect={onSelectPlayer}
          />
          {players.length > 1 ? (
            <span className="additional-depth">+{players.length - 1}</span>
          ) : null}
        </div>
      ) : null}

      {expanded ? (
        <div
          className={`depth-popover${position.x > 72 ? " open-left" : ""}`}
          role="group"
          aria-label={`${position.label} players`}
        >
          <div className="depth-popover-header">
            <span>{position.label}</span>
            <small>{players.length || "Empty"}</small>
          </div>
          <div className="depth-list">
            {players.length ? (
              players.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  selected={selectedPlayerId === player.id}
                  depthIndex={index}
                  onSelect={onSelectPlayer}
                  onDropBefore={(playerId, toDepthIndex) =>
                    onMovePlayer(playerId, position.id, toDepthIndex)
                  }
                />
              ))
            ) : (
              <button
                className="empty-position"
                type="button"
                onClick={handlePositionClick}
              >
                {selectedPlayerId ? "Place selected player" : "Select a player first"}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
