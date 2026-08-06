import { describe, expect, it } from "vitest";
import { MemoryStorage } from "../test/MemoryStorage";
import { LocalStorageDepthChartStore } from "./LocalStorageDepthChartStore";

describe("LocalStorageDepthChartStore", () => {
  it("keeps offense and defense assignments independent", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: "offense-base", toPositionId: "off-q" });
    await store.moveAssignment({ playerId: "p01", formationId: "defense-base", toPositionId: "def-fs" });
    const state = await store.loadLineup();
    expect(state.assignments["offense-base"]["off-q"]).toEqual(["p01"]);
    expect(state.assignments["defense-base"]["def-fs"]).toEqual(["p01"]);
  });

  it("persists version 1 data through migration", async () => {
    const storage = new MemoryStorage();
    storage.setItem("eldorado-depth-chart.phase1.v1", JSON.stringify({
      version: 1,
      assignments: { "offense-base": { "off-q": ["p01"] } },
      addedPlayers: [{ id: "p27", name: "New Player" }],
    }));
    const store = new LocalStorageDepthChartStore(storage);
    const state = await store.loadLineup();
    expect(state.version).toBe(2);
    expect(state.assignments["offense-base"]["off-q"]).toEqual(["p01"]);
    expect(state.addedPlayers[0].id).toBe("p27");
  });

  it("edits a seed player through an override", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.updatePlayer({ playerId: "p01", name: "Updated Player", number: "12" });
    const state = await store.loadLineup();
    expect(state.playerOverrides.p01).toEqual({ name: "Updated Player", number: "12" });
  });

  it("prevents an exact duplicate name and number", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await expect(store.addPlayer({ name: "Reid Alcaraz", number: "" })).rejects.toThrow(
      "already exists",
    );
  });

  it("archives a player and removes all assignments", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: "offense-base", toPositionId: "off-q" });
    await store.moveAssignment({ playerId: "p01", formationId: "defense-base", toPositionId: "def-fs" });
    await store.archivePlayer({ playerId: "p01" });
    const state = await store.loadLineup();
    expect(state.archivedPlayerIds).toContain("p01");
    expect(state.assignments["offense-base"]["off-q"]).toEqual([]);
    expect(state.assignments["defense-base"]["def-fs"]).toEqual([]);
  });

  it("undoes the most recent mutation", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: "offense-base", toPositionId: "off-q" });
    expect(await store.undoLastChange()).toBe(true);
    expect((await store.loadLineup()).assignments["offense-base"]["off-q"]).toEqual([]);
  });

  it("creates and restores a named snapshot", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: "offense-base", toPositionId: "off-q" });
    const snapshot = await store.createSnapshot("Before Week 1");
    await store.unassignPlayer({ playerId: "p01", formationId: "offense-base" });
    await store.restoreSnapshot(snapshot.id);
    expect((await store.loadLineup()).assignments["offense-base"]["off-q"]).toEqual(["p01"]);
  });
});
