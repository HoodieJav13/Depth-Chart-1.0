import type {
  AddPlayerInput,
  DepthChartState,
  MoveAssignmentInput,
  Player,
  ReorderDepthInput,
  UnassignPlayerInput,
} from "../domain/types";

export type StateListener = (state: DepthChartState) => void;

export interface DepthChartStore {
  loadLineup(): Promise<DepthChartState>;
  addPlayer(input: AddPlayerInput): Promise<Player>;
  moveAssignment(input: MoveAssignmentInput): Promise<void>;
  reorderDepth(input: ReorderDepthInput): Promise<void>;
  unassignPlayer(input: UnassignPlayerInput): Promise<void>;
  subscribe(listener: StateListener): () => void;
}
