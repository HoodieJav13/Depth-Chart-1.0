import { roster } from "../domain/config";
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
import type {
  DepthChartStore,
  StateListener,
  StatusListener,
} from "./DepthChartStore";
import {
  cloneState,
  createEmptyState,
  effectivePlayers,
  isDuplicatePlayer,
  normalizeState,
  removePlayerFromAssignments,
} from "./stateModel";

const STORAGE_KEY = "eldorado-depth-chart.phase1.v1";
const SNAPSHOT_KEY = "eldorado-depth-chart.snapshots.v1";

export class LocalStorageDepthChartStore implements DepthChartStore {
  private state: DepthChartState;
  private previousState: DepthChartState | null = null;
  private readonly listeners = new Set<StateListener>();
  private readonly statusListeners = new Set<StatusListener>();
  private status: StoreStatus = { phase: "idle", canUndo: false, canRetry: false };

  constructor(private readonly storage: Storage = window.localStorage) {
    this.state = this.readState();
  }

  async loadLineup(): Promise<DepthChartState> {
    return cloneState(this.state);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener({ ...this.status });
    return () => this.statusListeners.delete(listener);
  }

  async addPlayer({ name, number }: AddPlayerInput): Promise<Player> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Player name is required.");
    if (isDuplicatePlayer(this.state, { name: cleanName, number })) {
      throw new Error("That player already exists.");
    }
    const cleanNumber = number?.trim() || undefined;
    const player: Player = {
      id: this.nextPlayerId(),
      name: cleanName,
      ...(cleanNumber ? { number: cleanNumber } : {}),
    };
    const next = cloneState(this.state);
    next.addedPlayers.push(player);
    this.commit(next);
    return player;
  }

  async updatePlayer({ playerId, name, number }: UpdatePlayerInput): Promise<void> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Player name is required.");
    if (isDuplicatePlayer(this.state, { name: cleanName, number }, playerId)) {
      throw new Error("That player already exists.");
    }
    const next = cloneState(this.state);
    const addedIndex = next.addedPlayers.findIndex((player) => player.id === playerId);
    const cleanNumber = number?.trim() || null;
    if (addedIndex >= 0) {
      next.addedPlayers[addedIndex] = {
        ...next.addedPlayers[addedIndex],
        name: cleanName,
        number: cleanNumber,
      };
    } else if (roster.players.some((player) => player.id === playerId)) {
      next.playerOverrides[playerId] = { name: cleanName, number: cleanNumber };
    } else {
      return;
    }
    this.commit(next);
  }

  async archivePlayer({ playerId }: ArchivePlayerInput): Promise<void> {
    if (!effectivePlayers(this.state).some((player) => player.id === playerId)) return;
    const next = cloneState(this.state);
    next.archivedPlayerIds = [...new Set([...next.archivedPlayerIds, playerId])];
    removePlayerFromAssignments(next, playerId);
    this.commit(next);
  }

  async moveAssignment({ playerId, formationId, toPositionId, toDepthIndex }: MoveAssignmentInput): Promise<void> {
    if (!effectivePlayers(this.state).some((player) => player.id === playerId)) return;
    const formation = this.state.assignments[formationId];
    if (!formation || !(toPositionId in formation)) return;
    const next = cloneState(this.state);
    const nextFormation = next.assignments[formationId];
    for (const positionId of Object.keys(nextFormation)) {
      nextFormation[positionId] = nextFormation[positionId].filter((id) => id !== playerId);
    }
    const target = nextFormation[toPositionId];
    const insertAt = Math.max(0, Math.min(toDepthIndex ?? target.length, target.length));
    target.splice(insertAt, 0, playerId);
    this.commit(next);
  }

  async reorderDepth(input: ReorderDepthInput): Promise<void> {
    await this.moveAssignment({
      playerId: input.playerId,
      formationId: input.formationId,
      toPositionId: input.positionId,
      toDepthIndex: input.toDepthIndex,
    });
  }

  async unassignPlayer({ playerId, formationId }: UnassignPlayerInput): Promise<void> {
    if (!this.state.assignments[formationId]) return;
    const next = cloneState(this.state);
    for (const positionId of Object.keys(next.assignments[formationId])) {
      next.assignments[formationId][positionId] = next.assignments[formationId][positionId].filter(
        (id) => id !== playerId,
      );
    }
    this.commit(next);
  }

  async undoLastChange(): Promise<boolean> {
    if (!this.previousState) return false;
    const current = cloneState(this.state);
    this.state = normalizeState(this.previousState);
    this.previousState = current;
    this.persistAndEmit();
    return true;
  }

  async retryLastWrite(): Promise<void> {
    this.setStatus({ phase: "saved", canUndo: Boolean(this.previousState), canRetry: false });
  }

  async migrateFromLocal(state: DepthChartState): Promise<MigrationResult> {
    if (this.state.revision > 0 || effectivePlayers(this.state).length !== roster.players.length) {
      return "existing";
    }
    this.previousState = cloneState(this.state);
    this.state = normalizeState(state);
    this.persistAndEmit();
    return "created";
  }

  async listSnapshots(): Promise<DepthChartSnapshot[]> {
    return this.readSnapshots().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createSnapshot(name: string): Promise<DepthChartSnapshot> {
    const cleanName = name.trim().slice(0, 60);
    if (!cleanName) throw new Error("Snapshot name is required.");
    const snapshot: DepthChartSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      createdAt: new Date().toISOString(),
      state: cloneState(this.state),
    };
    const snapshots = this.readSnapshots();
    snapshots.push(snapshot);
    this.storage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
    return structuredClone(snapshot);
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    const snapshot = this.readSnapshots().find((candidate) => candidate.id === snapshotId);
    if (!snapshot) throw new Error("Snapshot not found.");
    this.commit(snapshot.state);
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    const snapshots = this.readSnapshots().filter((snapshot) => snapshot.id !== snapshotId);
    this.storage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
  }

  private readState(): DepthChartState {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return normalizeState(raw ? JSON.parse(raw) : createEmptyState());
    } catch {
      return createEmptyState();
    }
  }

  private readSnapshots(): DepthChartSnapshot[] {
    try {
      const raw = this.storage.getItem(SNAPSHOT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((value) => value && typeof value === "object")
        .map((value) => ({
          id: String(value.id),
          name: String(value.name).slice(0, 60),
          createdAt: String(value.createdAt),
          createdBy: value.createdBy ? String(value.createdBy) : null,
          state: normalizeState(value.state),
        }));
    } catch {
      return [];
    }
  }

  private nextPlayerId(): string {
    const usedIds = new Set([
      ...roster.players.map((player) => player.id),
      ...this.state.addedPlayers.map((player) => player.id),
    ]);
    let nextNumber = 1;
    for (const id of usedIds) {
      const match = /^p(\d+)$/.exec(id);
      if (match) nextNumber = Math.max(nextNumber, Number(match[1]) + 1);
    }
    let nextId = `p${String(nextNumber).padStart(2, "0")}`;
    while (usedIds.has(nextId)) {
      nextNumber += 1;
      nextId = `p${String(nextNumber).padStart(2, "0")}`;
    }
    return nextId;
  }

  private commit(candidate: DepthChartState): void {
    this.previousState = cloneState(this.state);
    const next = normalizeState(candidate);
    next.revision = this.state.revision + 1;
    next.updatedAt = new Date().toISOString();
    this.state = next;
    this.persistAndEmit();
  }

  private persistAndEmit(): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    const snapshot = cloneState(this.state);
    this.listeners.forEach((listener) => listener(snapshot));
    this.setStatus({
      phase: "saved",
      canUndo: Boolean(this.previousState),
      canRetry: false,
      lastSavedAt: new Date().toISOString(),
    });
  }

  private setStatus(status: StoreStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener({ ...status }));
  }
}
