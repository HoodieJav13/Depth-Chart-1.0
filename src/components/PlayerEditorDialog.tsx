import { useEffect, useState, type FormEvent } from "react";
import type { Player, UpdatePlayerInput } from "../domain/types";

interface PlayerEditorDialogProps {
  player: Player;
  onClose: () => void;
  onSave: (input: UpdatePlayerInput) => Promise<void>;
}

export const PlayerEditorDialog = ({ player, onClose, onSave }: PlayerEditorDialogProps) => {
  const [name, setName] = useState(player.name);
  const [number, setNumber] = useState(player.number ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSaving, onClose]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ playerId: player.id, name, number: number || null });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Player could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dialog-backdrop workflow-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="add-player-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-player-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <h2 id="edit-player-title">Edit player</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={(event) => void submit(event)}>
          <label htmlFor="edit-player-name">Name</label>
          <input
            id="edit-player-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />
          <label htmlFor="edit-player-number">Jersey number <span>Optional</span></label>
          <input
            id="edit-player-number"
            value={number}
            onChange={(event) => setNumber(event.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
          />
          {error ? <p className="dialog-error" role="alert">{error}</p> : null}
          <button className="dialog-submit" type="submit" disabled={!name.trim() || isSaving}>
            {isSaving ? "Saving…" : "Save player"}
          </button>
        </form>
      </section>
    </div>
  );
};
