import type { FormationAssignments, FormationConfig, UnitType } from "./types";

export type PlayerAssignmentSummary = Record<"offense" | "defense", string[]>;

export const buildPlayerAssignmentSummaries = (
  formations: FormationConfig[],
  assignments: FormationAssignments,
): Map<string, PlayerAssignmentSummary> => {
  const summaries = new Map<string, PlayerAssignmentSummary>();

  for (const formation of formations) {
    if (formation.unit !== "offense" && formation.unit !== "defense") continue;
    const unit = formation.unit as Exclude<UnitType, "specialTeams">;
    const formationAssignments = assignments[formation.id] ?? {};
    for (const position of formation.positions) {
      for (const playerId of formationAssignments[position.id] ?? []) {
        const summary = summaries.get(playerId) ?? { offense: [], defense: [] };
        if (!summary[unit].includes(position.label)) summary[unit].push(position.label);
        summaries.set(playerId, summary);
      }
    }
  }

  return summaries;
};
