import type { DepthChartSnapshot, DepthChartState } from "../domain/types";
import type {
  FirebaseCompatCollectionReference,
  FirebaseCompatDocumentReference,
  FirebaseCompatFirestore,
} from "../auth/firebaseCompat";
import type { SharedChartBackend } from "./SharedChartBackend";
import { normalizeState } from "./stateModel";

const TEAM_ID = "eldorado-freshman";

export class FirebaseSharedChartBackend implements SharedChartBackend {
  private readonly currentRef: FirebaseCompatDocumentReference;
  private readonly snapshotsRef: FirebaseCompatCollectionReference;

  constructor(private readonly firestore: FirebaseCompatFirestore) {
    const teamRef = firestore.collection("teams").doc(TEAM_ID);
    this.currentRef = teamRef.collection("depthChart").doc("current");
    this.snapshotsRef = teamRef.collection("snapshots");
  }

  subscribeCurrent(
    listener: (state: unknown | null) => void,
    onError: (error: Error) => void,
  ): () => void {
    return this.currentRef.onSnapshot(
      (snapshot) => listener(snapshot.exists ? snapshot.data() ?? null : null),
      onError,
    );
  }

  async readCurrent(): Promise<unknown | null> {
    const snapshot = await this.currentRef.get();
    return snapshot.exists ? snapshot.data() ?? null : null;
  }

  async compareAndSetCurrent(
    expectedRevision: number | null,
    state: DepthChartState,
  ): Promise<boolean> {
    return this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(this.currentRef);
      if (!snapshot.exists) {
        if (expectedRevision !== null) return false;
      } else {
        if (expectedRevision === null) return false;
        const current = normalizeState(snapshot.data());
        if (current.revision !== expectedRevision) return false;
      }
      transaction.set(this.currentRef, state);
      return true;
    });
  }

  async listSnapshots(): Promise<DepthChartSnapshot[]> {
    const querySnapshot = await this.snapshotsRef.get();
    const snapshots: DepthChartSnapshot[] = [];

    for (const document of querySnapshot.docs) {
      const data = document.data();
      if (!data || typeof data !== "object") continue;
      const candidate = data as Partial<DepthChartSnapshot>;
      if (
        typeof candidate.name !== "string" ||
        typeof candidate.createdAt !== "string"
      ) {
        continue;
      }
      snapshots.push({
        id: document.id,
        name: candidate.name,
        createdAt: candidate.createdAt,
        createdBy:
          typeof candidate.createdBy === "string" ? candidate.createdBy : null,
        state: normalizeState(candidate.state),
      });
    }

    return snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async writeSnapshot(snapshot: DepthChartSnapshot): Promise<void> {
    await this.snapshotsRef.doc(snapshot.id).set(snapshot);
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    await this.snapshotsRef.doc(snapshotId).delete();
  }
}
