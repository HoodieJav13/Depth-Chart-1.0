import { useState } from "react";
import type { FormationConfig, Player, PositionAssignments } from "../domain/types";
import { ChevronIcon } from "./icons";
import { PlayerCard } from "./PlayerCard";

interface MobileDepthListProps {
  formation: FormationConfig;
  assignments: PositionAssignments;
  playersById: Map<string, Player>;
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
  onMovePlayer: (playerId: string, positionId: string, toDepthIndex?: number) => void;
}

export const MobileDepthList = ({
  formation,
  assignments,
  playersById,
  selectedPlayerId,
  onSelectPlayer,
  onMovePlayer,
}: MobileDepthListProps) => {
  const sortedPositions = [...formation.positions].sort(
    (a, b) => a.listOrder - b.listOrder,
  );
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(sortedPositions.map((position) => position.id)),
  );

  const togglePosition = (positionId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(positionId)) next.delete(positionId);
      else next.add(positionId);
      return next;
    });
  };

  return (
    <main className="mobile-depth-list" aria-label={`${formation.name} depth list`}>
      {sortedPositions.map((position) => {
        const playerIds = assignments[position.id] ?? [];
        const isExpanded = expanded.has(position.id);

        return (
          <section
            className={`mobile-position-row${selectedPlayerId ? " ready-to-place" : ""}`}
            key={position.id}
            data-position-id={position.id}
          >
            <div className="mobile-position-heading">
              <button
                className="mobile-expand-button"
                type="button"
                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${position.label}`}
                aria-expanded={isExpanded}
                onClick={() => togglePosition(position.id)}
              >
                <ChevronIcon className={isExpanded ? "open" : ""} />
              </button>
              <button
                className="mobile-position-target"
                type="button"
                onClick={() => {
                  if (selectedPlayerId) onMovePlayer(selectedPlayerId, position.id);
                  else togglePosition(position.id);
                }}
              >
                <strong>{position.label}</strong>
                <span>{playerIds.length}</span>
              </button>
            </div>

            {isExpanded ? (
              <div className="mobile-player-stack">
                {playerIds.length ? (
                  playerIds.flatMap((playerId, index) => {
                    const player = playersById.get(playerId);
                    return player ? (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        selected={selectedPlayerId === player.id}
                        depthIndex={index}
                        onSelect={(clickedPlayerId) => {
                          if (
                            selectedPlayerId &&
                            selectedPlayerId !== clickedPlayerId
                          ) {
                            onMovePlayer(selectedPlayerId, position.id, index);
                            return;
                          }
                          onSelectPlayer(clickedPlayerId);
                        }}
                        onDropBefore={(movingPlayerId, toDepthIndex) =>
                          onMovePlayer(movingPlayerId, position.id, toDepthIndex)
                        }
                      />
                    ) : [];
                  })
                ) : (
                  <button
                    className="mobile-empty-target"
                    type="button"
                    disabled={!selectedPlayerId}
                    onClick={() =>
                      selectedPlayerId && onMovePlayer(selectedPlayerId, position.id)
                    }
                  >
                    {selectedPlayerId ? "Place selected player" : "No players assigned"}
                  </button>
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </main>
  );
};
