export type UnitType = "offense" | "defense" | "specialTeams";

export interface Player {
  id: string;
  name: string;
  number?: string | null;
}

export interface PlayerOverride {
  name?: string;
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

export interface DepthChartStateV1 {
  version: 1;
  assignments: FormationAssignments;
  addedPlayers: Player[];
}

export interface DepthChartState {
  version: 2;
  assignments: FormationAssignments;
  addedPlayers: Player[];
  playerOverrides: Record<string, PlayerOverride>;
  archivedPlayerIds: string[];
  revision: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface AddPlayerInput {
  name: string;
  number?: string | null;
}

export interface UpdatePlayerInput {
  playerId: string;
  name: string;
  number?: string | null;
}

export interface ArchivePlayerInput {
  playerId: string;
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

export type StorePhase = "idle" | "loading" | "saving" | "saved" | "offline" | "error";

export interface StoreStatus {
  phase: StorePhase;
  canUndo: boolean;
  canRetry: boolean;
  message?: string;
  lastSavedAt?: string;
}

export interface DepthChartSnapshot {
  id: string;
  name: string;
  createdAt: string;
  createdBy?: string | null;
  state: DepthChartState;
}

export type MigrationResult = "created" | "existing" | "skipped";
