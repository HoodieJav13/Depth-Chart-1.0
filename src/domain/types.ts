export type UnitType = "offense" | "defense" | "specialTeams";

export interface Player {
  id: string;
  name: string;
  number?: string | null;
}

export interface PositionConfig {
  id: string;
  label: string;
  x: number;
  y: number;
  listOrder: number;
}

export interface FormationConfig {
  id: string;
  name: string;
  unit: UnitType;
  positions: PositionConfig[];
}

export interface RosterConfig {
  players: Player[];
}

export interface FormationsConfig {
  formations: FormationConfig[];
}

export type PositionAssignments = Record<string, string[]>;
export type FormationAssignments = Record<string, PositionAssignments>;

export interface DepthChartState {
  version: 1;
  assignments: FormationAssignments;
  addedPlayers: Player[];
}

export interface AddPlayerInput {
  name: string;
  number?: string | null;
}

export interface MoveAssignmentInput {
  playerId: string;
  formationId: string;
  toPositionId: string;
  toDepthIndex?: number;
}

export interface ReorderDepthInput {
  playerId: string;
  formationId: string;
  positionId: string;
  toDepthIndex: number;
}

export interface UnassignPlayerInput {
  playerId: string;
  formationId: string;
}
