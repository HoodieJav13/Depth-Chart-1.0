import { describe, expect, it } from "vitest";
import { effectivePlayers, normalizeState } from "./stateModel";

describe("stateModel", () => {
  it("upgrades version 1 state without changing player ids or assignments", () => {
    const state = normalizeState({
      version: 1,
      assignments: {
        "offense-base": { "off-q": ["p01", "p02"] },
      },
      addedPlayers: [{ id: "p27", name: "New Player", number: "7" }],
    });

    expect(state.version).toBe(2);
    expect(state.assignments["offense-base"]["off-q"]).toEqual(["p01", "p02"]);
    expect(state.addedPlayers).toEqual([{ id: "p27", name: "New Player", number: "7" }]);
    expect(state.playerOverrides).toEqual({});
    expect(state.archivedPlayerIds).toEqual([]);
  });

  it("applies overrides and removes archived players from the effective roster", () => {
    const state = normalizeState({
      version: 2,
      assignments: {},
      addedPlayers: [],
      playerOverrides: { p01: { name: "Updated Name", number: "12" } },
      archivedPlayerIds: ["p02"],
      revision: 3,
    });

    expect(effectivePlayers(state).find((player) => player.id === "p01")).toMatchObject({
      name: "Updated Name",
      number: "12",
    });
    expect(effectivePlayers(state).some((player) => player.id === "p02")).toBe(false);
  });

  it("preserves one defensive starter and the same player's backups at other positions", () => {
    const state = normalizeState({
      version: 2,
      assignments: {
        "defense-base": {
          "def-alpha": ["p01"],
          "def-mike": ["p02", "p01"],
          "def-fs": ["p03", "p04", "p01"],
        },
      },
      addedPlayers: [],
      playerOverrides: {},
      archivedPlayerIds: [],
      revision: 4,
    });

    expect(state.assignments["defense-base"]["def-alpha"]).toEqual(["p01"]);
    expect(state.assignments["defense-base"]["def-mike"]).toEqual(["p02", "p01"]);
    expect(state.assignments["defense-base"]["def-fs"]).toEqual(["p03", "p04", "p01"]);
  });

  it("keeps the first starter by list order and removes only a later conflicting starter", () => {
    const state = normalizeState({
      version: 2,
      assignments: {
        "defense-base": {
          "def-le": ["p01"],
          "def-mike": ["p02", "p01"],
          "def-alpha": ["p01", "p03"],
          "def-fs": ["p04", "p01"],
        },
      },
      addedPlayers: [],
      playerOverrides: {},
      archivedPlayerIds: [],
      revision: 4,
    });

    expect(state.assignments["defense-base"]["def-le"]).toEqual(["p01"]);
    expect(state.assignments["defense-base"]["def-mike"]).toEqual(["p02", "p01"]);
    expect(state.assignments["defense-base"]["def-alpha"]).toEqual(["p03"]);
    expect(state.assignments["defense-base"]["def-fs"]).toEqual(["p04", "p01"]);
  });

  it("deduplicates a player only within the same position depth list", () => {
    const state = normalizeState({
      version: 2,
      assignments: {
        "defense-base": {
          "def-bandit": ["p02", "p01", "p01"],
          "def-fs": ["p03", "p01"],
        },
      },
      addedPlayers: [],
      playerOverrides: {},
      archivedPlayerIds: [],
      revision: 4,
    });

    expect(state.assignments["defense-base"]["def-bandit"]).toEqual(["p02", "p01"]);
    expect(state.assignments["defense-base"]["def-fs"]).toEqual(["p03", "p01"]);
  });
});
