import { useState } from "react";
import type { FormationConfig, Player, PositionAssignments } from "../domain/types";

interface CrossListActionProps {
  player: Player;
  formation: FormationConfig;
  sourcePositionId: string;
  assignments: PositionAssignments;
  onCrossListPlayer: (playerId: string, positionId: string, toDepthIndex: number) => void;
}

interface CrossListTarget {
  positionId: string;
  depthIndex: number;
}

export const CrossListAction = ({
  player,
  formation,
  sourcePositionId,
  assignments,
  onCrossListPlayer,
}: CrossListActionProps) => {
  const [target, setTarget] = useState<CrossListTarget | null>(null);
  const otherPositions = [...formation.positions]
    .filter((position) => position.id !== sourcePositionId)
    .sort((left, right) => left.listOrder - right.listOrder);
  const targetDepthCount = target ? assignments[target.positionId]?.length ?? 0 : 0;

  const beginCrossList = () => {
    const firstPosition = otherPositions[0];
    if (!firstPosition) return;
    setTarget({
      positionId: firstPosition.id,
      depthIndex: assignments[firstPosition.id]?.length ?? 0,
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Cross-list ${player.name}`}
        onClick={beginCrossList}
      >
        Cross-list
      </button>
      {target ? (
        <form
          className="cross-list-controls"
          onSubmit={(event) => {
            event.preventDefault();
            onCrossListPlayer(player.id, target.positionId, target.depthIndex);
            setTarget(null);
          }}
        >
          <label>
            <span>Position</span>
            <select
              aria-label={`Cross-list position for ${player.name}`}
              value={target.positionId}
              onChange={(event) => {
                const positionId = event.target.value;
                setTarget({
                  positionId,
                  depthIndex: assignments[positionId]?.length ?? 0,
                });
              }}
            >
              {otherPositions.map((position) => (
                <option key={position.id} value={position.id}>{position.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Depth</span>
            <select
              aria-label={`Cross-list depth for ${player.name}`}
              value={target.depthIndex}
              onChange={(event) => setTarget((current) => current ? {
                ...current,
                depthIndex: Number(event.target.value),
              } : null)}
            >
              {Array.from({ length: targetDepthCount + 1 }, (_, depthIndex) => (
                <option key={depthIndex} value={depthIndex}>
                  {depthIndex === 0 ? "#1 Starter" : `#${depthIndex + 1}`}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" aria-label={`Add ${player.name} at another position`}>Add</button>
          <button type="button" onClick={() => setTarget(null)}>Cancel</button>
        </form>
      ) : null}
    </>
  );
};
