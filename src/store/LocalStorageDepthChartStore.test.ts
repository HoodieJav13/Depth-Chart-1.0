import { describe, expect, it } from "vitest";
import { MemoryStorage } from "../test/MemoryStorage";
import { LocalStorageDepthChartStore } from "./LocalStorageDepthChartStore";

const defense = "defense-base";

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
    await store.unassignPlayer({
      playerId: "p01",
      formationId: "offense-base",
      fromPositionId: "off-q",
    });
    await store.restoreSnapshot(snapshot.id);
    expect((await store.loadLineup()).assignments["offense-base"]["off-q"]).toEqual(["p01"]);
  });

  it("cross-lists a player without removing the original assignment", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({
      playerId: "p01",
      formationId: defense,
      toPositionId: "def-bandit",
    });
    await store.moveAssignment({
      playerId: "p02",
      formationId: defense,
      toPositionId: "def-mike",
    });

    await store.crossListAssignment({
      playerId: "p01",
      formationId: defense,
      toPositionId: "def-mike",
      toDepthIndex: 1,
    });

    const assignments = (await store.loadLineup()).assignments[defense];
    expect(assignments["def-bandit"]).toEqual(["p01"]);
    expect(assignments["def-mike"]).toEqual(["p02", "p01"]);
  });

  it("allows a backup cross-list when the player starts elsewhere", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-bandit" });
    await store.moveAssignment({ playerId: "p02", formationId: defense, toPositionId: "def-mike" });

    await store.crossListAssignment({
      playerId: "p01",
      formationId: defense,
      toPositionId: "def-mike",
      toDepthIndex: 1,
    });

    expect((await store.loadLineup()).assignments[defense]["def-mike"]).toEqual(["p02", "p01"]);
  });

  it("rejects cross-listing a second starter in the same formation", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-bandit" });

    await expect(store.crossListAssignment({
      playerId: "p01",
      formationId: defense,
      toPositionId: "def-alpha",
      toDepthIndex: 0,
    })).rejects.toThrow("Reid Alcaraz is already starting at B.");

    expect((await store.loadLineup()).assignments[defense]["def-alpha"]).toEqual([]);
  });

  it("allows the same player to start once on offense and once on defense", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: "offense-base", toPositionId: "off-q" });
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-alpha" });

    const state = await store.loadLineup();
    expect(state.assignments["offense-base"]["off-q"]).toEqual(["p01"]);
    expect(state.assignments[defense]["def-alpha"]).toEqual(["p01"]);
  });

  it("moves only the selected cross-listed occurrence", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-bandit" });
    await store.moveAssignment({ playerId: "p02", formationId: defense, toPositionId: "def-mike" });
    await store.moveAssignment({ playerId: "p03", formationId: defense, toPositionId: "def-fs" });
    await store.crossListAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-mike", toDepthIndex: 1 });

    await store.moveAssignment({
      playerId: "p01",
      formationId: defense,
      fromPositionId: "def-mike",
      toPositionId: "def-fs",
      toDepthIndex: 1,
    });

    const assignments = (await store.loadLineup()).assignments[defense];
    expect(assignments["def-bandit"]).toEqual(["p01"]);
    expect(assignments["def-mike"]).toEqual(["p02"]);
    expect(assignments["def-fs"]).toEqual(["p03", "p01"]);
  });

  it("moves a starter occurrence to another position in the same formation", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-bandit" });

    await store.moveAssignment({
      playerId: "p01",
      formationId: defense,
      fromPositionId: "def-bandit",
      toPositionId: "def-alpha",
      toDepthIndex: 0,
    });

    const assignments = (await store.loadLineup()).assignments[defense];
    expect(assignments["def-bandit"]).toEqual([]);
    expect(assignments["def-alpha"]).toEqual(["p01"]);
  });

  it("unassigns only one occurrence and keeps a cross-listed player assigned", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p02", formationId: defense, toPositionId: "def-mike" });
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-bandit" });
    await store.crossListAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-mike", toDepthIndex: 1 });

    await store.unassignPlayer({ playerId: "p01", formationId: defense, fromPositionId: "def-mike" });

    const assignments = (await store.loadLineup()).assignments[defense];
    expect(assignments["def-bandit"]).toEqual(["p01"]);
    expect(Object.values(assignments).flat()).toContain("p01");
  });

  it("returns a player to the unassigned roster after the final occurrence is removed", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-bandit" });
    await store.unassignPlayer({ playerId: "p01", formationId: defense, fromPositionId: "def-bandit" });

    const assignments = (await store.loadLineup()).assignments[defense];
    expect(new Set(Object.values(assignments).flat()).has("p01")).toBe(false);
  });

  it("rejects listing the same player twice at one position", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-bandit" });

    await expect(store.crossListAssignment({
      playerId: "p01",
      formationId: defense,
      toPositionId: "def-bandit",
      toDepthIndex: 1,
    })).rejects.toThrow("already listed at B");
  });

  it("keeps ordinary roster-origin placement and same-position reorder valid", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-mike" });
    await store.moveAssignment({ playerId: "p02", formationId: defense, toPositionId: "def-mike" });
    await store.reorderDepth({ playerId: "p02", formationId: defense, positionId: "def-mike", toDepthIndex: 0 });

    expect((await store.loadLineup()).assignments[defense]["def-mike"]).toEqual(["p02", "p01"]);
  });

  it("rejects a stale source occurrence without creating a saved no-op revision", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.moveAssignment({ playerId: "p01", formationId: defense, toPositionId: "def-bandit" });
    const revisionBeforeStaleMove = (await store.loadLineup()).revision;

    await expect(store.moveAssignment({
      playerId: "p01",
      formationId: defense,
      fromPositionId: "def-mike",
      toPositionId: "def-fs",
    })).rejects.toThrow("no longer assigned at M");

    const state = await store.loadLineup();
    expect(state.revision).toBe(revisionBeforeStaleMove);
    expect(state.assignments[defense]["def-bandit"]).toEqual(["p01"]);
    expect(state.assignments[defense]["def-fs"]).toEqual([]);
  });

  it("rejects placement when the selected player was archived before the action", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.archivePlayer({ playerId: "p01" });
    const revisionBeforeMove = (await store.loadLineup()).revision;

    await expect(store.moveAssignment({
      playerId: "p01",
      formationId: defense,
      toPositionId: "def-fs",
    })).rejects.toThrow("Reid Alcaraz is no longer available");

    expect((await store.loadLineup()).revision).toBe(revisionBeforeMove);
  });

  it("rejects cross-listing when the selected player was archived before the action", async () => {
    const store = new LocalStorageDepthChartStore(new MemoryStorage());
    await store.archivePlayer({ playerId: "p01" });
    const revisionBeforeCrossList = (await store.loadLineup()).revision;

    await expect(store.crossListAssignment({
      playerId: "p01",
      formationId: defense,
      toPositionId: "def-fs",
      toDepthIndex: 1,
    })).rejects.toThrow("Reid Alcaraz is no longer available");

    expect((await store.loadLineup()).revision).toBe(revisionBeforeCrossList);
  });
});
