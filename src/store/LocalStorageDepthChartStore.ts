import { formationConfig, roster } from "../domain/config";
import type {
  AddPlayerInput,
  DepthChartState,
  FormationAssignments,
  MoveAssignmentInput,
  Player,
  ReorderDepthInput,
  UnassignPlayerInput,
} from "../domain/types";
import type { DepthChartStore, StateListener } from "./DepthChartStore";

const STORAGE_KEY = "eldorado-depth-chart.phase1.v1";

const emptyAssignments = (): FormationAssignments =>
  Object.fromEntries(
    formationConfig.formations.map((formation) => [
      formation.id,
      Object.fromEntries(formation.positions.map((position) => [position.id, []])),
    ]),
  );

const cloneState = (state: DepthChartState): DepthChartState =>
  structuredClone(state);

const cleanState = (candidate: unknown): DepthChartState => {
  const assignments = emptyAssignments();
  const raw = candidate as Partial<DepthChartState> | null;

  if (!raw || raw.version !== 1 || typeof raw.assignments !== "object") {
    return { version: 1, assignments, addedPlayers: [] };
  }

  const seedPlayerIds = new Set(roster.players.map((player) => player.id));
  const addedPlayerIds = new Set<string>();
  const addedPlayers = Array.isArray(raw.addedPlayers)
    ? raw.addedPlayers.filter((candidatePlayer): candidatePlayer is Player => {
        if (!candidatePlayer || typeof candidatePlayer !== "object") return false;

        const player = candidatePlayer as Partial<Player>;
        const id = typeof player.id === "string" ? player.id.trim() : "";
        const name = typeof player.name === "string" ? player.name.trim() : "";
        if (!id || !name || seedPlayerIds.has(id) || addedPlayerIds.has(id)) {
          return false;
        }
        addedPlayerIds.add(id);
        return true;
      })
    : [];
  const validPlayerIds = new Set([...seedPlayerIds, ...addedPlayerIds]);

  for (const formation of formationConfig.formations) {
    const seenPlayers = new Set<string>();
    const candidateFormation = raw.assignments?.[formation.id];

    for (const position of formation.positions) {
      const candidatePlayers = candidateFormation?.[position.id];
      if (!Array.isArray(candidatePlayers)) continue;

      assignments[formation.id][position.id] = candidatePlayers.filter(
        (playerId): playerId is string => {
          if (
            typeof playerId !== "string" ||
            !validPlayerIds.has(playerId) ||
            seenPlayers.has(playerId)
          ) {
            return false;
          }
          seenPlayers.add(playerId);
          return true;
        },
      );
    }
  }

  return { version: 1, assignments, addedPlayers };
};

export class LocalStorageDepthChartStore implements DepthChartStore {
  private state: DepthChartState;
  private readonly listeners = new Set<StateListener>();

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

  async addPlayer({ name, number }: AddPlayerInput): Promise<Player> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Player name is required.");

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

  async moveAssignment({
    playerId,
    formationId,
    toPositionId,
    toDepthIndex,
  }: MoveAssignmentInput): Promise<void> {
    if (!this.hasPlayer(playerId)) return;

    const formationAssignments = this.state.assignments[formationId];
    if (!formationAssignments || !(toPositionId in formationAssignments)) return;

    const next = cloneState(this.state);
    const nextFormation = next.assignments[formationId];

    for (const positionId of Object.keys(nextFormation)) {
      nextFormation[positionId] = nextFormation[positionId].filter(
        (assignedId) => assignedId !== playerId,
      );
    }

    const target = nextFormation[toPositionId];
    const insertAt = Math.max(
      0,
      Math.min(toDepthIndex ?? target.length, target.length),
    );
    target.splice(insertAt, 0, playerId);
    this.commit(next);
  }

  async reorderDepth({
    playerId,
    formationId,
    positionId,
    toDepthIndex,
  }: ReorderDepthInput): Promise<void> {
    await this.moveAssignment({
      playerId,
      formationId,
      toPositionId: positionId,
      toDepthIndex,
    });
  }

  async unassignPlayer({
    playerId,
    formationId,
  }: UnassignPlayerInput): Promise<void> {
    const formationAssignments = this.state.assignments[formationId];
    if (!formationAssignments) return;

    const next = cloneState(this.state);
    for (const positionId of Object.keys(next.assignments[formationId])) {
      next.assignments[formationId][positionId] = next.assignments[formationId][
        positionId
      ].filter((assignedId) => assignedId !== playerId);
    }
    this.commit(next);
  }

  private readState(): DepthChartState {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return cleanState(raw ? JSON.parse(raw) : null);
    } catch {
      return cleanState(null);
    }
  }

  private hasPlayer(playerId: string): boolean {
    return (
      roster.players.some((player) => player.id === playerId) ||
      this.state.addedPlayers.some((player) => player.id === playerId)
    );
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

  private commit(next: DepthChartState): void {
    this.state = cleanState(next);
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    const snapshot = cloneState(this.state);
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
