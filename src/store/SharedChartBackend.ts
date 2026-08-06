import type { DepthChartSnapshot, DepthChartState } from "../domain/types";

export interface SharedChartBackend {
  subscribeCurrent(
    listener: (state: unknown | null) => void,
    onError: (error: Error) => void,
  ): () => void;
  readCurrent(): Promise<unknown | null>;
  compareAndSetCurrent(
    expectedRevision: number | null,
    state: DepthChartState,
  ): Promise<boolean>;
  listSnapshots(): Promise<DepthChartSnapshot[]>;
  writeSnapshot(snapshot: DepthChartSnapshot): Promise<void>;
  deleteSnapshot(snapshotId: string): Promise<void>;
}
