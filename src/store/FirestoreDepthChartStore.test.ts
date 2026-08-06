import { describe, expect, it } from "vitest";
import type { DepthChartSnapshot, DepthChartState } from "../domain/types";
import type { SharedChartBackend } from "./SharedChartBackend";
import { FirestoreDepthChartStore } from "./FirestoreDepthChartStore";
import { createEmptyState } from "./stateModel";

class FakeBackend implements SharedChartBackend {
  current: DepthChartState | null = null;
  snapshots: DepthChartSnapshot[] = [];
  private listener: ((state: unknown | null) => void) | null = null;

  subscribeCurrent(listener: (state: unknown | null) => void): () => void {
    this.listener = listener;
    return () => {
      this.listener = null;
    };
  }

  async readCurrent(): Promise<unknown | null> {
    return this.current ? structuredClone(this.current) : null;
  }

  async compareAndSetCurrent(
    expectedRevision: number | null,
    state: DepthChartState,
  ): Promise<boolean> {
    if (this.current === null) {
      if (expectedRevision !== null) return false;
    } else if (this.current.revision !== expectedRevision) {
      return false;
    }
    this.current = structuredClone(state);
    this.listener?.(structuredClone(state));
    return true;
  }

  async listSnapshots(): Promise<DepthChartSnapshot[]> {
    return structuredClone(this.snapshots);
  }

  async writeSnapshot(snapshot: DepthChartSnapshot): Promise<void> {
    this.snapshots.push(structuredClone(snapshot));
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    this.snapshots = this.snapshots.filter(
      (snapshot) => snapshot.id !== snapshotId,
    );
  }
}

const coach = {
  phoneNumber: "+15057307634",
  displayName: "Coach Chavez",
};

describe("FirestoreDepthChartStore", () => {
  it("migrates local data only when the shared chart is absent", async () => {
    const backend = new FakeBackend();
    const store = new FirestoreDepthChartStore(backend, coach);
    const local = createEmptyState();
    local.assignments["offense-base"]["off-q"] = ["p01"];

    expect(await store.migrateFromLocal(local)).toBe("created");
    expect(backend.current?.assignments["offense-base"]["off-q"]).toEqual([
      "p01",
    ]);

    const other = createEmptyState();
    other.assignments["offense-base"]["off-q"] = ["p02"];
    expect(await store.migrateFromLocal(other)).toBe("existing");
    expect(backend.current?.assignments["offense-base"]["off-q"]).toEqual([
      "p01",
    ]);
  });

  it("shares mutations through the backend listener", async () => {
    const backend = new FakeBackend();
    backend.current = createEmptyState();
    const first = new FirestoreDepthChartStore(backend, coach);
    const second = new FirestoreDepthChartStore(backend, {
      ...coach,
      displayName: "Coach Two",
    });
    await first.loadLineup();
    await second.loadLineup();

    await first.moveAssignment({
      playerId: "p01",
      formationId: "offense-base",
      toPositionId: "off-q",
    });

    expect(
      (await second.loadLineup()).assignments["offense-base"]["off-q"],
    ).toEqual(["p01"]);
  });

  it("preserves the current chart in a snapshot before later restore", async () => {
    const backend = new FakeBackend();
    backend.current = createEmptyState();
    const store = new FirestoreDepthChartStore(backend, coach);
    await store.loadLineup();
    await store.moveAssignment({
      playerId: "p01",
      formationId: "offense-base",
      toPositionId: "off-q",
    });
    const snapshot = await store.createSnapshot("Week 1");
    await store.unassignPlayer({
      playerId: "p01",
      formationId: "offense-base",
    });
    await store.restoreSnapshot(snapshot.id);
    expect(
      (await store.loadLineup()).assignments["offense-base"]["off-q"],
    ).toEqual(["p01"]);
  });

  it("never reuses an archived added-player id", async () => {
    const backend = new FakeBackend();
    backend.current = createEmptyState();
    const store = new FirestoreDepthChartStore(backend, coach);
    await store.loadLineup();

    const first = await store.addPlayer({ name: "First Added" });
    await store.archivePlayer({ playerId: first.id });
    const second = await store.addPlayer({ name: "Second Added" });

    expect(first.id).toBe("p27");
    expect(second.id).toBe("p28");
  });

  it("refuses undo after another coach has changed the remote revision", async () => {
    const backend = new FakeBackend();
    backend.current = createEmptyState();
    const store = new FirestoreDepthChartStore(backend, coach);
    await store.loadLineup();
    await store.moveAssignment({
      playerId: "p01",
      formationId: "offense-base",
      toPositionId: "off-q",
    });

    const otherCoachState = structuredClone(backend.current!);
    otherCoachState.revision += 1;
    otherCoachState.assignments["offense-base"]["off-rb"] = ["p02"];
    backend.current = otherCoachState;

    await expect(store.undoLastChange()).rejects.toThrow(
      "changed on another device",
    );
    expect(backend.current.assignments["offense-base"]["off-rb"]).toEqual([
      "p02",
    ]);
  });
});
