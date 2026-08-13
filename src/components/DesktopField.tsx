import type { FormationConfig, Player, PositionAssignments } from "../domain/types";
import { PositionStack } from "./PositionStack";
import type { PlayerAssignmentSummary } from "../domain/assignmentSummary";

const OFFENSIVE_LINE_IDS = ["off-lt", "off-lg", "off-c", "off-rg", "off-rt"];
const DEFENSIVE_FRONT_IDS = ["def-le", "def-ldt", "def-rdt", "def-re"];
const EMPTY_ASSIGNMENT_SUMMARIES = new Map<string, PlayerAssignmentSummary>();

interface DesktopFieldProps {
  formation: FormationConfig;
  assignments: PositionAssignments;
  playersById: Map<string, Player>;
  selectedPlayerId: string | null;
  selectedFromPositionId?: string;
  expandedPositionId: string | null;
  onTogglePosition: (positionId: string) => void;
  onMovePlayer: (playerId: string, positionId: string, toDepthIndex?: number, fromPositionId?: string) => void;
  onStarterDragStart?: () => void;
  onStarterDragEnd?: () => void;
  assignmentSummaries?: Map<string, PlayerAssignmentSummary>;
}

export const DesktopField = ({
  formation,
  assignments,
  playersById,
  selectedPlayerId,
  selectedFromPositionId,
  expandedPositionId,
  onTogglePosition,
  onMovePlayer,
  onStarterDragStart,
  onStarterDragEnd,
  assignmentSummaries = EMPTY_ASSIGNMENT_SUMMARIES,
}: DesktopFieldProps) => {
  const laneDefinition = formation.unit === "offense"
    ? { name: "offensive-line", ids: OFFENSIVE_LINE_IDS }
    : { name: "defensive-front", ids: DEFENSIVE_FRONT_IDS };
  const laneIds = new Set(laneDefinition.ids);
  const lanePositions = laneDefinition.ids.flatMap((id) => {
    const position = formation.positions.find((item) => item.id === id);
    return position ? [position] : [];
  });
  const oppositeUnit = formation.unit === "offense" ? "defense" : "offense";
  const renderPosition = (position: FormationConfig["positions"][number], inLane = false) => {
    const starterId = assignments[position.id]?.[0];
    return (
          <PositionStack
            key={position.id}
            position={position}
            playerIds={assignments[position.id] ?? []}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
            selectedFromPositionId={selectedFromPositionId}
            expanded={expandedPositionId === position.id}
            inLane={inLane}
            onToggle={onTogglePosition}
            onMovePlayer={onMovePlayer}
            onStarterDragStart={onStarterDragStart}
            onStarterDragEnd={onStarterDragEnd}
            oppositePositionLabels={starterId ? assignmentSummaries.get(starterId)?.[oppositeUnit] ?? [] : []}
          />
    );
  };

  return (
    <main className="field-shell" aria-label={`${formation.name} field view`}>
      <div className="football-field">
        <span className="field-label field-label-left">EAGLES</span>
        <span className="field-label field-label-right">ELDORADO</span>
        <div className="formation-coordinate-layer">
          <div className="line-of-scrimmage" style={{ top: "30%" }} aria-hidden="true" />
          {lanePositions.length ? (
            <div
              className={`position-lane ${laneDefinition.name}`}
              data-position-lane={laneDefinition.name}
              style={{ left: "50%", top: "30%" }}
            >
              {lanePositions.map((position) => renderPosition(position, true))}
            </div>
          ) : null}
          {formation.positions
            .filter((position) => !laneIds.has(position.id))
            .map((position) => renderPosition(position))}
        </div>
      </div>
    </main>
  );
};
