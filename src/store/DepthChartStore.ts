import type {
  AddPlayerInput,
  ArchivePlayerInput,
  DepthChartSnapshot,
  DepthChartState,
  MigrationResult,
  MoveAssignmentInput,
  Player,
  ReorderDepthInput,
  StoreStatus,
  UnassignPlayerInput,
  UpdatePlayerInput,
} from "../domain/types";

export type StateListener = (state: DepthChartState) => void;
export type StatusListener = (status: StoreStatus) => void;

export interface DepthChartStore {
  loadLineup(): Promise<DepthChartState>;
  addPlayer(input: AddPlayerInput): Promise<Player>;
  updatePlayer(input: UpdatePlayerInput): Promise<void>;
  archivePlayer(input: ArchivePlayerInput): Promise<void>;
  moveAssignment(input: MoveAssignmentInput): Promise<void>;
  reorderDepth(input: ReorderDepthInput): Promise<void>;
  unassignPlayer(input: UnassignPlayerInput): Promise<void>;
  undoLastChange(): Promise<boolean>;
  retryLastWrite(): Promise<void>;
  migrateFromLocal(state: DepthChartState): Promise<MigrationResult>;
  listSnapshots(): Promise<DepthChartSnapshot[]>;
  createSnapshot(name: string): Promise<DepthChartSnapshot>;
  restoreSnapshot(snapshotId: string): Promise<void>;
  deleteSnapshot(snapshotId: string): Promise<void>;
  subscribe(listener: StateListener): () => void;
  subscribeStatus(listener: StatusListener): () => void;
}
