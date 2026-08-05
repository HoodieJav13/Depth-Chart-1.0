import formationsJson from "../config/formations.json";
import rosterJson from "../config/roster.json";
import type { FormationsConfig, RosterConfig } from "./types";

export const roster = rosterJson as RosterConfig;
export const formationConfig = formationsJson as FormationsConfig;

export const formationsById = new Map(
  formationConfig.formations.map((formation) => [formation.id, formation]),
);
