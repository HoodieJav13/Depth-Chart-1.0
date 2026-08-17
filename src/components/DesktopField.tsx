import type {
  FormationConfig,
  Player,
  PositionAssignments,
  PositionConfig,
} from "../domain/types";
import { PositionStack } from "./PositionStack";
import type { PlayerAssignmentSummary } from "../domain/assignmentSummary";

const OFFENSIVE_LINE_IDS = ["off-lt", "off-lg", "off-c", "off-rg", "off-rt"];
const EMPTY_ASSIGNMENT_SUMMARIES = new Map<string, PlayerAssignmentSummary>();

interface BandDefinition {
  name: string;
  ids: string[];
  /** Positions rendered as one tight cluster of compact cards inside the band. */
  group?: { name: string; ids: string[] };
}

/**
 * Formations render as semantic bands rather than at literal x/y screen coordinates.
 * `x` still orders columns inside a band; `y` is unused by this view. Neither is edited.
 * Defense runs secondary-first so the deep coverage sits at the top of the screen.
 */
const OFFENSE_BANDS: BandDefinition[] = [
  {
    name: "line-of-scrimmage",
    ids: ["off-z", "off-y", ...OFFENSIVE_LINE_IDS, "off-h", "off-x"],
    group: { name: "offensive-line", ids: OFFENSIVE_LINE_IDS },
  },
  { name: "backfield", ids: ["off-q"] },
  { name: "deep-backfield", ids: ["off-t"] },
];

const DEFENSE_BANDS: BandDefinition[] = [
  { name: "secondary", ids: ["def-lc", "def-alpha", "def-fs", "def-bandit", "def-rc"] },
  { name: "linebackers", ids: ["def-will", "def-mike"] },
  { name: "front", ids: ["def-le", "def-ldt", "def-rdt", "def-re"] },
];

type Slot =
  | { key: string; kind: "single"; order: number; position: PositionConfig }
  | { key: string; kind: "group"; order: number; name: string; positions: PositionConfig[] };

const byX = (a: PositionConfig, b: PositionConfig) => a.x - b.x;

const buildSlots = (positions: PositionConfig[], band: BandDefinition): Slot[] => {
  const groupIds = new Set(band.group?.ids ?? []);
  const members = band.ids
    .flatMap((id) => positions.filter((position) => position.id === id))
    .sort(byX);
  const grouped = members.filter((position) => groupIds.has(position.id));
  const slots: Slot[] = members
    .filter((position) => !groupIds.has(position.id))
    .map((position) => ({
      key: position.id,
      kind: "single" as const,
      order: position.x,
      position,
    }));

  if (band.group && grouped.length) {
    slots.push({
      key: `group-${band.group.name}`,
      kind: "group",
      order: Math.min(...grouped.map((position) => position.x)),
      name: band.group.name,
      positions: grouped,
    });
  }

  return slots.sort((a, b) => a.order - b.order);
};

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
  const declaredBands = formation.unit === "offense" ? OFFENSE_BANDS : DEFENSE_BANDS;
  const declaredIds = new Set(declaredBands.flatMap((band) => band.ids));
  // Anything a formation adds without a declared band still renders rather than vanishing.
  const undeclared = formation.positions.filter((position) => !declaredIds.has(position.id));
  const bands: BandDefinition[] = undeclared.length
    ? [...declaredBands, { name: "unassigned-band", ids: undeclared.map((position) => position.id) }]
    : declaredBands;
  const oppositeUnit = formation.unit === "offense" ? "defense" : "offense";

  const renderPosition = (position: PositionConfig, compact = false) => {
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
        compact={compact}
        onToggle={onTogglePosition}
        onMovePlayer={onMovePlayer}
        onStarterDragStart={onStarterDragStart}
        onStarterDragEnd={onStarterDragEnd}
        oppositePositionLabels={
          starterId ? assignmentSummaries.get(starterId)?.[oppositeUnit] ?? [] : []
        }
      />
    );
  };

  return (
    <main className="field-shell" aria-label={`${formation.name} field view`}>
      <div className="football-field">
        <span className="field-label field-label-left">EAGLES</span>
        <span className="field-label field-label-right">ELDORADO</span>
        <div className="formation-bands">
          {bands.map((band) => {
            const slots = buildSlots(formation.positions, band);
            if (!slots.length) return null;
            return (
              <div key={band.name} className="formation-band" data-band={band.name}>
                {slots.map((slot) =>
                  slot.kind === "single" ? (
                    renderPosition(slot.position)
                  ) : (
                    <div
                      key={slot.key}
                      className={`position-group ${slot.name}`}
                      data-position-group={slot.name}
                    >
                      {slot.positions.map((position) => renderPosition(position, true))}
                    </div>
                  ),
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};
