import { describe, expect, it } from "vitest";
import { MemoryStorage } from "../test/MemoryStorage";
import { LocalStorageDepthChartStore } from "./LocalStorageDepthChartStore";

describe("LocalStorageDepthChartStore", () => {
  it("keeps offense and defense assignments independent", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());

    await store.moveAssignment({
      playerId: "p01",
      formationId: "offense-base",
      toPositionId: "off-q",
    });
    await store.moveAssignment({
      playerId: "p01",
      formationId: "defense-base",
      toPositionId: "def-fs",
    });

    const state = await store.loadLineup();
    expect(state.assignments["offense-base"]["off-q"]).toEqual(["p01"]);
    expect(state.assignments["defense-base"]["def-fs"]).toEqual(["p01"]);
  });

  it("moves and reorders players by stable id", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());

    for (const playerId of ["p01", "p02", "p03"]) {
      await store.moveAssignment({
        playerId,
        formationId: "offense-base",
        toPositionId: "off-q",
      });
    }
    await store.reorderDepth({
      playerId: "p03",
      formationId: "offense-base",
      positionId: "off-q",
      toDepthIndex: 0,
    });

    const state = await store.loadLineup();
    expect(state.assignments["offense-base"]["off-q"]).toEqual([
      "p03",
      "p01",
      "p02",
    ]);
  });

  it("persists through a new adapter instance", async () => {
    const storage = new MemoryStorage();
    const firstStore = new LocalStorageDepthChartStore(storage);
    await firstStore.moveAssignment({
      playerId: "p08",
      formationId: "offense-base",
      toPositionId: "off-x",
    });

    const secondStore = new LocalStorageDepthChartStore(storage);
    const state = await secondStore.loadLineup();
    expect(state.assignments["offense-base"]["off-x"]).toEqual(["p08"]);
  });

  it("adds a name-only player with a stable id and keeps them after reload", async () => {
    const storage = new MemoryStorage();
    const firstStore = new LocalStorageDepthChartStore(storage);
    const player = await firstStore.addPlayer({ name: "  New Player  " });

    expect(player).toEqual({ id: "p27", name: "New Player" });

    await firstStore.moveAssignment({
      playerId: player.id,
      formationId: "offense-base",
      toPositionId: "off-t",
    });

    const secondStore = new LocalStorageDepthChartStore(storage);
    const state = await secondStore.loadLineup();
    expect(state.addedPlayers).toEqual([player]);
    expect(state.assignments["offense-base"]["off-t"]).toEqual(["p27"]);
  });

  it("keeps an optional jersey number when adding a player", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    const player = await store.addPlayer({ name: "New Player", number: " 7 " });

    expect(player).toEqual({ id: "p27", name: "New Player", number: "7" });
  });
});
