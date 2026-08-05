import type { FormationConfig, Player, PositionAssignments } from "../domain/types";
import { PositionStack } from "./PositionStack";

interface DesktopFieldProps {
  formation: FormationConfig;
  assignments: PositionAssignments;
  playersById: Map<string, Player>;
  selectedPlayerId: string | null;
  expandedPositionId: string | null;
  onTogglePosition: (positionId: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onMovePlayer: (playerId: string, positionId: string, toDepthIndex?: number) => void;
}

export const DesktopField = ({
  formation,
  assignments,
  playersById,
  selectedPlayerId,
  expandedPositionId,
  onTogglePosition,
  onSelectPlayer,
  onMovePlayer,
}: DesktopFieldProps) => (
  <main className="field-shell" aria-label={`${formation.name} field view`}>
    <div className="football-field">
      <span className="field-label field-label-left">EAGLES</span>
      <span className="field-label field-label-right">ELDORADO</span>
      {formation.positions.map((position) => {
        const dense = formation.positions.some(
          (other) =>
            other.id !== position.id &&
            Math.abs(other.y - position.y) <= 3 &&
            Math.abs(other.x - position.x) < 9,
        );

        return (
          <PositionStack
            key={position.id}
            position={position}
            playerIds={assignments[position.id] ?? []}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
            expanded={expandedPositionId === position.id}
            dense={dense}
            onToggle={onTogglePosition}
            onSelectPlayer={onSelectPlayer}
            onMovePlayer={onMovePlayer}
          />
        );
      })}
    </div>
  </main>
);
