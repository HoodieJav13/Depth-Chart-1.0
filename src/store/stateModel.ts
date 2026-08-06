import { formationConfig, roster } from "../domain/config";
import type {
  AddPlayerInput,
  DepthChartState,
  DepthChartStateV1,
  FormationAssignments,
  Player,
  PlayerOverride,
} from "../domain/types";

export const emptyAssignments = (): FormationAssignments =>
  Object.fromEntries(
    formationConfig.formations.map((formation) => [
      formation.id,
      Object.fromEntries(formation.positions.map((position) => [position.id, []])),
    ]),
  );

export const createEmptyState = (): DepthChartState => ({
  version: 2,
  assignments: emptyAssignments(),
  addedPlayers: [],
  playerOverrides: {},
  archivedPlayerIds: [],
  revision: 0,
  updatedAt: null,
  updatedBy: null,
});

export const cloneState = (state: DepthChartState): DepthChartState => structuredClone(state);

const cleanPlayer = (value: unknown): Player | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Player>;
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  if (!id || !name) return null;
  const number = typeof candidate.number === "string" ? candidate.number.trim() : null;
  return { id, name, ...(number ? { number } : {}) };
};

const cleanOverride = (value: unknown): PlayerOverride | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as PlayerOverride;
  const override: PlayerOverride = {};
  if (typeof candidate.name === "string" && candidate.name.trim()) {
    override.name = candidate.name.trim();
  }
  if (candidate.number === null) override.number = null;
  if (typeof candidate.number === "string") override.number = candidate.number.trim() || null;
  return Object.keys(override).length ? override : null;
};

export const normalizeState = (candidate: unknown): DepthChartState => {
  const next = createEmptyState();
  const raw = candidate as Partial<DepthChartState & DepthChartStateV1> | null;
  if (!raw || (raw.version !== 1 && raw.version !== 2)) return next;

  const seedIds = new Set(roster.players.map((player) => player.id));
  const addedIds = new Set<string>();
  if (Array.isArray(raw.addedPlayers)) {
    for (const value of raw.addedPlayers) {
      const player = cleanPlayer(value);
      if (!player || seedIds.has(player.id) || addedIds.has(player.id)) continue;
      addedIds.add(player.id);
      next.addedPlayers.push(player);
    }
  }

  if (raw.version === 2 && raw.playerOverrides && typeof raw.playerOverrides === "object") {
    for (const [playerId, value] of Object.entries(raw.playerOverrides)) {
      if (!seedIds.has(playerId) && !addedIds.has(playerId)) continue;
      const override = cleanOverride(value);
      if (override) next.playerOverrides[playerId] = override;
    }
  }

  const archived = raw.version === 2 && Array.isArray(raw.archivedPlayerIds)
    ? raw.archivedPlayerIds.filter((id): id is string =>
        typeof id === "string" && (seedIds.has(id) || addedIds.has(id)),
      )
    : [];
  next.archivedPlayerIds = [...new Set(archived)];

  const validIds = new Set([...seedIds, ...addedIds]);
  for (const formation of formationConfig.formations) {
    const seen = new Set<string>();
    const sourceFormation = raw.assignments?.[formation.id];
    for (const position of formation.positions) {
      const source = sourceFormation?.[position.id];
      if (!Array.isArray(source)) continue;
      next.assignments[formation.id][position.id] = source.filter((id): id is string => {
        if (
          typeof id !== "string" ||
          !validIds.has(id) ||
          next.archivedPlayerIds.includes(id) ||
          seen.has(id)
        ) return false;
        seen.add(id);
        return true;
      });
    }
  }

  if (raw.version === 2) {
    next.revision = Number.isFinite(raw.revision) ? Math.max(0, Number(raw.revision)) : 0;
    next.updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : null;
    next.updatedBy = typeof raw.updatedBy === "string" ? raw.updatedBy : null;
  }
  return next;
};

export const effectivePlayers = (state: DepthChartState): Player[] => {
  const archived = new Set(state.archivedPlayerIds);
  return [...roster.players, ...state.addedPlayers]
    .filter((player) => !archived.has(player.id))
    .map((player) => ({ ...player, ...(state.playerOverrides[player.id] ?? {}) }));
};

const normalizeText = (value: string | null | undefined): string =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export const isDuplicatePlayer = (
  state: DepthChartState,
  input: AddPlayerInput,
  excludePlayerId?: string,
): boolean => {
  const name = normalizeText(input.name);
  const number = normalizeText(input.number);
  return effectivePlayers(state).some(
    (player) =>
      player.id !== excludePlayerId &&
      normalizeText(player.name) === name &&
      normalizeText(player.number) === number,
  );
};

export const removePlayerFromAssignments = (
  state: DepthChartState,
  playerId: string,
): void => {
  for (const formation of Object.values(state.assignments)) {
    for (const positionId of Object.keys(formation)) {
      formation[positionId] = formation[positionId].filter((id) => id !== playerId);
    }
  }
};

export const hasMeaningfulLocalData = (state: DepthChartState): boolean =>
  state.addedPlayers.length > 0 ||
  Object.values(state.assignments).some((formation) =>
    Object.values(formation).some((players) => players.length > 0),
  );
