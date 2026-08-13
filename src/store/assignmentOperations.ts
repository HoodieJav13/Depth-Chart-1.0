import { formationConfig, roster } from "../domain/config";
import type {
  CrossListAssignmentInput,
  DepthChartState,
  MoveAssignmentInput,
  PositionConfig,
  UnassignPlayerInput,
} from "../domain/types";
import { effectivePlayers } from "./stateModel";

const positionFor = (formationId: string, positionId: string): PositionConfig | null =>
  formationConfig.formations
    .find((formation) => formation.id === formationId)
    ?.positions.find((position) => position.id === positionId) ?? null;

const playerName = (state: DepthChartState, playerId: string): string =>
  effectivePlayers(state).find((player) => player.id === playerId)?.name ?? "Player";

export const unavailablePlayerError = (
  state: DepthChartState,
  playerId: string,
): Error => {
  const knownPlayer = [
    ...roster.players,
    ...state.addedPlayers,
  ].find((player) => player.id === playerId);
  const name = state.playerOverrides[playerId]?.name ?? knownPlayer?.name ?? "Player";
  return new Error(`${name} is no longer available. Refresh the depth chart and try again.`);
};

const insertIndex = (requested: number | undefined, length: number): number =>
  Math.max(0, Math.min(requested ?? length, length));

const duplicatePositionError = (
  state: DepthChartState,
  playerId: string,
  position: PositionConfig,
): Error => new Error(`${playerName(state, playerId)} is already listed at ${position.label}.`);

const unavailablePositionError = (): Error =>
  new Error("That position is no longer available. Refresh the depth chart and try again.");

const staleSourceError = (
  state: DepthChartState,
  playerId: string,
  formationId: string,
  fromPositionId: string,
): Error => {
  const sourcePosition = positionFor(formationId, fromPositionId);
  return new Error(
    `${playerName(state, playerId)} is no longer assigned at ${sourcePosition?.label ?? "that position"}.`,
  );
};

const assertStarterAvailable = (
  state: DepthChartState,
  formationId: string,
  playerId: string,
  toDepthIndex: number,
): void => {
  if (toDepthIndex !== 0) return;
  const formation = formationConfig.formations.find((item) => item.id === formationId);
  if (!formation) return;
  const assignments = state.assignments[formationId];
  const conflictingPosition = [...formation.positions]
    .sort((left, right) => left.listOrder - right.listOrder)
    .find((position) => assignments[position.id]?.[0] === playerId);
  if (conflictingPosition) {
    throw new Error(
      `${playerName(state, playerId)} is already starting at ${conflictingPosition.label}.`,
    );
  }
};

export const moveAssignmentInState = (
  state: DepthChartState,
  input: MoveAssignmentInput,
): void => {
  const formation = state.assignments[input.formationId];
  const targetPosition = positionFor(input.formationId, input.toPositionId);
  if (!formation || !targetPosition || !(input.toPositionId in formation)) {
    throw unavailablePositionError();
  }

  if (input.fromPositionId) {
    if (!(input.fromPositionId in formation)) {
      throw staleSourceError(state, input.playerId, input.formationId, input.fromPositionId);
    }
    const source = formation[input.fromPositionId];
    if (!source.includes(input.playerId)) {
      throw staleSourceError(state, input.playerId, input.formationId, input.fromPositionId);
    }
    if (
      input.fromPositionId !== input.toPositionId &&
      formation[input.toPositionId].includes(input.playerId)
    ) {
      throw duplicatePositionError(state, input.playerId, targetPosition);
    }
    formation[input.fromPositionId] = source.filter((id) => id !== input.playerId);
  } else {
    const existingPosition = Object.entries(formation).find(([, playerIds]) =>
      playerIds.includes(input.playerId),
    );
    if (existingPosition) {
      throw new Error(
        `${playerName(state, input.playerId)} is already assigned. Choose the specific occurrence to move.`,
      );
    }
  }

  const target = formation[input.toPositionId];
  if (target.includes(input.playerId)) {
    throw duplicatePositionError(state, input.playerId, targetPosition);
  }
  const toDepthIndex = insertIndex(input.toDepthIndex, target.length);
  assertStarterAvailable(state, input.formationId, input.playerId, toDepthIndex);
  target.splice(toDepthIndex, 0, input.playerId);
};

export const crossListAssignmentInState = (
  state: DepthChartState,
  input: CrossListAssignmentInput,
): void => {
  const formation = state.assignments[input.formationId];
  const targetPosition = positionFor(input.formationId, input.toPositionId);
  if (!formation || !targetPosition || !(input.toPositionId in formation)) {
    throw unavailablePositionError();
  }
  const target = formation[input.toPositionId];
  if (target.includes(input.playerId)) {
    throw duplicatePositionError(state, input.playerId, targetPosition);
  }
  const toDepthIndex = insertIndex(input.toDepthIndex, target.length);
  assertStarterAvailable(state, input.formationId, input.playerId, toDepthIndex);
  target.splice(toDepthIndex, 0, input.playerId);
};

export const unassignOccurrenceInState = (
  state: DepthChartState,
  input: UnassignPlayerInput,
): void => {
  const formation = state.assignments[input.formationId];
  if (!formation || !(input.fromPositionId in formation)) {
    throw staleSourceError(state, input.playerId, input.formationId, input.fromPositionId);
  }
  if (!formation[input.fromPositionId].includes(input.playerId)) {
    throw staleSourceError(state, input.playerId, input.formationId, input.fromPositionId);
  }
  formation[input.fromPositionId] = formation[input.fromPositionId].filter(
    (id) => id !== input.playerId,
  );
};
