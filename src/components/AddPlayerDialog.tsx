import { useEffect, useState, type FormEvent } from "react";
import type { AddPlayerInput } from "../domain/types";

interface AddPlayerDialogProps {
  onClose: () => void;
  onAddPlayer: (input: AddPlayerInput) => Promise<void>;
}

export const AddPlayerDialog = ({
  onClose,
  onAddPlayer,
}: AddPlayerDialogProps) => {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onAddPlayer({ name, number: number || null });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="add-player-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-player-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <h2 id="add-player-title">Add player</h2>
          <button type="button" onClick={onClose} aria-label="Close add player form">
            Close
          </button>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="player-name">Name</label>
          <input
            id="player-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            autoFocus
            required
          />

          <label htmlFor="player-number">
            Jersey number <span>Optional</span>
          </label>
          <input
            id="player-number"
            name="number"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
          />

          <button className="dialog-submit" type="submit" disabled={!name.trim() || isSaving}>
            {isSaving ? "Adding…" : "Add to roster"}
          </button>
        </form>
      </section>
    </div>
  );
};
