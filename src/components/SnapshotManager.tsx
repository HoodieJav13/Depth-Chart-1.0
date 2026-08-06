import { useEffect, useState, type FormEvent } from "react";
import type { DepthChartSnapshot } from "../domain/types";
import type { DepthChartStore } from "../store/DepthChartStore";

interface SnapshotManagerProps {
  store: DepthChartStore;
  onClose: () => void;
}

export const SnapshotManager = ({ store, onClose }: SnapshotManagerProps) => {
  const [snapshots, setSnapshots] = useState<DepthChartSnapshot[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => setSnapshots(await store.listSnapshots());

  useEffect(() => {
    void refresh().catch((caught: unknown) =>
      setError(caught instanceof Error ? caught.message : "Snapshots could not be loaded."),
    );
  }, [store]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await store.createSnapshot(name);
      setName("");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Snapshot could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const restore = async (snapshot: DepthChartSnapshot) => {
    if (!window.confirm(`Restore “${snapshot.name}”? This replaces the current shared chart.`)) return;
    setBusy(true);
    try {
      await store.restoreSnapshot(snapshot.id);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Snapshot could not be restored.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (snapshot: DepthChartSnapshot) => {
    if (!window.confirm(`Delete “${snapshot.name}”?`)) return;
    setBusy(true);
    try {
      await store.deleteSnapshot(snapshot.id);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop workflow-overlay" role="presentation" onMouseDown={onClose}>
      <section className="workflow-dialog snapshot-dialog" role="dialog" aria-modal="true" aria-labelledby="snapshot-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading">
          <h2 id="snapshot-title">Saved snapshots</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <form className="snapshot-create" onSubmit={(event) => void create(event)}>
          <label htmlFor="snapshot-name">Save current chart as</label>
          <div>
            <input id="snapshot-name" value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Before Week 1" />
            <button type="submit" disabled={!name.trim() || busy}>Save</button>
          </div>
        </form>
        {error ? <p className="dialog-error" role="alert">{error}</p> : null}
        <div className="snapshot-list">
          {snapshots.length ? snapshots.map((snapshot) => (
            <article key={snapshot.id}>
              <div>
                <strong>{snapshot.name}</strong>
                <span>{new Date(snapshot.createdAt).toLocaleString()}</span>
                {snapshot.createdBy ? <small>by {snapshot.createdBy}</small> : null}
              </div>
              <button type="button" disabled={busy} onClick={() => void restore(snapshot)}>Restore</button>
              <button className="danger" type="button" disabled={busy} onClick={() => void remove(snapshot)}>Delete</button>
            </article>
          )) : <p className="empty-snapshots">No snapshots saved yet.</p>}
        </div>
      </section>
    </div>
  );
};
