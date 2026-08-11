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
});
