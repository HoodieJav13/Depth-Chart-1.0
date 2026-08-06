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
import type { SharedChartBackend } from "./SharedChartBackend";
import {
  cloneState,
  createEmptyState,
  effectivePlayers,
  hasMeaningfulLocalData,
  isDuplicatePlayer,
  normalizeState,
  removePlayerFromAssignments,
} from "./stateModel";

interface CoachIdentity {
  phoneNumber: string;
  displayName: string;
}

type StateMutation<T> = (state: DepthChartState) => T;

export class FirestoreDepthChartStore implements DepthChartStore {
  private state = createEmptyState();
  private previousState: DepthChartState | null = null;
  private loaded = false;
  private readonly stateListeners = new Set<StateListener>();
  private readonly statusListeners = new Set<StatusListener>();
  private status: StoreStatus = {
    phase: "loading",
    canUndo: false,
    canRetry: false,
  };
  private remoteUnsubscribe: (() => void) | null = null;
  private retryOperation: (() => Promise<void>) | null = null;

  constructor(
    private readonly backend: SharedChartBackend,
    private readonly coach: CoachIdentity,
  ) {}

  async loadLineup(): Promise<DepthChartState> {
    if (!this.loaded) {
      try {
        const remote = await this.backend.readCurrent();
        this.state = remote ? normalizeState(remote) : createEmptyState();
        this.loaded = true;
        this.ensureRemoteSubscription();
        this.setStatus({
          phase: "saved",
          canUndo: false,
          canRetry: false,
          lastSavedAt: this.state.updatedAt ?? undefined,
        });
      } catch (error) {
        this.setFailure(error, () => this.loadLineup().then(() => undefined));
        throw error;
      }
    }
    return cloneState(this.state);
  }

  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    this.ensureRemoteSubscription();
    return () => {
      this.stateListeners.delete(listener);
      if (this.stateListeners.size === 0) {
        this.remoteUnsubscribe?.();
        this.remoteUnsubscribe = null;
      }
    };
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener({ ...this.status });
    return () => this.statusListeners.delete(listener);
  }

  async addPlayer(input: AddPlayerInput): Promise<Player> {
    let created: Player | null = null;
    await this.mutate("Add player", (next) => {
      const cleanName = input.name.trim();
      if (!cleanName) throw new Error("Player name is required.");
      if (isDuplicatePlayer(next, input)) throw new Error("That player already exists.");
      const usedIds = new Set(effectivePlayers(next).map((player) => player.id));
      let number = 1;
      for (const id of usedIds) {
        const match = /^p(\d+)$/.exec(id);
        if (match) number = Math.max(number, Number(match[1]) + 1);
      }
      let id = `p${String(number).padStart(2, "0")}`;
      while (usedIds.has(id)) {
        number += 1;
        id = `p${String(number).padStart(2, "0")}`;
      }
      created = {
        id,
        name: cleanName,
        ...(input.number?.trim() ? { number: input.number.trim() } : {}),
      };
      next.addedPlayers.push(created);
    });
    if (!created) throw new Error("Player was not created.");
    return created;
  }

  async updatePlayer(input: UpdatePlayerInput): Promise<void> {
    await this.mutate("Update player", (next) => {
      const cleanName = input.name.trim();
      if (!cleanName) throw new Error("Player name is required.");
      if (isDuplicatePlayer(next, input, input.playerId)) {
        throw new Error("That player already exists.");
      }
      const addedIndex = next.addedPlayers.findIndex((player) => player.id === input.playerId);
      const number = input.number?.trim() || null;
      if (addedIndex >= 0) {
        next.addedPlayers[addedIndex] = {
          ...next.addedPlayers[addedIndex],
          name: cleanName,
          number,
        };
        return;
      }
      if (!effectivePlayers(next).some((player) => player.id === input.playerId)) return;
      next.playerOverrides[input.playerId] = { name: cleanName, number };
    });
  }

  async archivePlayer({ playerId }: ArchivePlayerInput): Promise<void> {
    await this.mutate("Archive player", (next) => {
      if (!effectivePlayers(next).some((player) => player.id === playerId)) return;
      next.archivedPlayerIds = [...new Set([...next.archivedPlayerIds, playerId])];
      removePlayerFromAssignments(next, playerId);
    });
  }

  async moveAssignment(input: MoveAssignmentInput): Promise<void> {
    await this.mutate("Move player", (next) => {
      if (!effectivePlayers(next).some((player) => player.id === input.playerId)) return;
      const formation = next.assignments[input.formationId];
      if (!formation || !(input.toPositionId in formation)) return;
      for (const positionId of Object.keys(formation)) {
        formation[positionId] = formation[positionId].filter((id) => id !== input.playerId);
      }
      const target = formation[input.toPositionId];
      const insertAt = Math.max(
        0,
        Math.min(input.toDepthIndex ?? target.length, target.length),
      );
      target.splice(insertAt, 0, input.playerId);
    });
  }

  async reorderDepth(input: ReorderDepthInput): Promise<void> {
    await this.moveAssignment({
      playerId: input.playerId,
      formationId: input.formationId,
      toPositionId: input.positionId,
      toDepthIndex: input.toDepthIndex,
    });
  }

  async unassignPlayer(input: UnassignPlayerInput): Promise<void> {
    await this.mutate("Unassign player", (next) => {
      const formation = next.assignments[input.formationId];
      if (!formation) return;
      for (const positionId of Object.keys(formation)) {
        formation[positionId] = formation[positionId].filter((id) => id !== input.playerId);
      }
    });
  }

  async undoLastChange(): Promise<boolean> {
    if (!this.previousState) return false;
    const previous = cloneState(this.previousState);
    const remote = await this.backend.readCurrent();
    const currentRemote = remote ? normalizeState(remote) : createEmptyState();
    if (currentRemote.revision !== this.state.revision) {
      throw new Error("The chart changed on another device, so this move can no longer be undone.");
    }
    await this.mutate("Undo change", (next) => {
      next.assignments = cloneState(previous).assignments;
      next.addedPlayers = cloneState(previous).addedPlayers;
      next.playerOverrides = cloneState(previous).playerOverrides;
      next.archivedPlayerIds = [...previous.archivedPlayerIds];
    });
    return true;
  }

  async retryLastWrite(): Promise<void> {
    if (this.retryOperation) await this.retryOperation();
  }

  async migrateFromLocal(localState: DepthChartState): Promise<MigrationResult> {
    const remote = await this.backend.readCurrent();
    if (remote) return "existing";
    if (!hasMeaningfulLocalData(localState)) {
      const empty = createEmptyState();
      empty.revision = 1;
      empty.updatedAt = new Date().toISOString();
      empty.updatedBy = this.coach.displayName;
      const created = await this.backend.compareAndSetCurrent(null, empty);
      if (created) {
        this.state = empty;
        this.loaded = true;
        this.emitState();
        return "skipped";
      }
      return "existing";
    }
    const next = normalizeState(localState);
    next.revision = Math.max(1, next.revision + 1);
    next.updatedAt = new Date().toISOString();
    next.updatedBy = this.coach.displayName;
    const created = await this.backend.compareAndSetCurrent(null, next);
    if (!created) return "existing";
    this.state = next;
    this.loaded = true;
    this.emitState();
    this.setStatus({
      phase: "saved",
      canUndo: false,
      canRetry: false,
      lastSavedAt: next.updatedAt ?? undefined,
    });
    return "created";
  }

  async listSnapshots(): Promise<DepthChartSnapshot[]> {
    return this.backend.listSnapshots();
  }

  async createSnapshot(name: string): Promise<DepthChartSnapshot> {
    const cleanName = name.trim().slice(0, 60);
    if (!cleanName) throw new Error("Snapshot name is required.");
    const snapshot: DepthChartSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      createdAt: new Date().toISOString(),
      createdBy: this.coach.displayName,
      state: cloneState(this.state),
    };
    await this.backend.writeSnapshot(snapshot);
    return snapshot;
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    const snapshot = (await this.backend.listSnapshots()).find((item) => item.id === snapshotId);
    if (!snapshot) throw new Error("Snapshot not found.");
    await this.mutate("Restore snapshot", (next) => {
      const restored = cloneState(snapshot.state);
      next.assignments = restored.assignments;
      next.addedPlayers = restored.addedPlayers;
      next.playerOverrides = restored.playerOverrides;
      next.archivedPlayerIds = restored.archivedPlayerIds;
    });
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    await this.backend.deleteSnapshot(snapshotId);
  }

  private ensureRemoteSubscription(): void {
    if (this.remoteUnsubscribe) return;
    this.remoteUnsubscribe = this.backend.subscribeCurrent(
      (remote) => {
        if (!remote) return;
        const next = normalizeState(remote);
        if (next.revision < this.state.revision) return;
        this.state = next;
        this.loaded = true;
        this.emitState();
        this.setStatus({
          phase: navigator.onLine ? "saved" : "offline",
          canUndo: Boolean(this.previousState),
          canRetry: false,
          lastSavedAt: next.updatedAt ?? undefined,
        });
      },
      (error) => this.setFailure(error, () => this.loadLineup().then(() => undefined)),
    );
  }

  private async mutate<T>(label: string, operation: StateMutation<T>): Promise<T> {
    const retry = async () => {
      await this.mutate(label, operation);
    };
    this.retryOperation = retry;
    this.setStatus({
      phase: navigator.onLine ? "saving" : "offline",
      canUndo: Boolean(this.previousState),
      canRetry: false,
      message: label,
    });

    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const raw = await this.backend.readCurrent();
        const base = raw ? normalizeState(raw) : createEmptyState();
        const next = cloneState(base);
        const result = operation(next);
        next.revision = base.revision + 1;
        next.updatedAt = new Date().toISOString();
        next.updatedBy = this.coach.displayName;
        const saved = await this.backend.compareAndSetCurrent(
          raw ? base.revision : null,
          next,
        );
        if (!saved) continue;
        this.previousState = cloneState(base);
        this.state = next;
        this.loaded = true;
        this.retryOperation = null;
        this.emitState();
        this.setStatus({
          phase: "saved",
          canUndo: true,
          canRetry: false,
          lastSavedAt: next.updatedAt ?? undefined,
        });
        return result;
      }
      throw new Error("Another coach changed the chart at the same time. Try the move again.");
    } catch (error) {
      this.setFailure(error, retry);
      throw error;
    }
  }

  private emitState(): void {
    const snapshot = cloneState(this.state);
    this.stateListeners.forEach((listener) => listener(snapshot));
  }

  private setFailure(error: unknown, retry: () => Promise<void>): void {
    this.retryOperation = retry;
    this.setStatus({
      phase: navigator.onLine ? "error" : "offline",
      canUndo: Boolean(this.previousState),
      canRetry: true,
      message: error instanceof Error ? error.message : "The shared chart could not be saved.",
    });
  }

  private setStatus(status: StoreStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener({ ...status }));
  }
}
