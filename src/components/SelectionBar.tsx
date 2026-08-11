import type { Player } from "../domain/types";

interface SelectionBarProps {
  player: Player | null;
  confirmation: string | null;
  onEdit: (player: Player) => void;
  onCancel: () => void;
}

export const SelectionBar = ({
  player,
  confirmation,
  onEdit,
  onCancel,
}: SelectionBarProps) => {
  if (!player && !confirmation) return null;
  return (
    <div className={`selection-bar${confirmation ? " confirmed" : ""}`} role="status">
      {confirmation ? (
        <strong>{confirmation}</strong>
      ) : player ? (
        <>
          <div>
            <small>Moving player</small>
            <strong>{player.name}</strong>
          </div>
          <span>Choose a position or depth slot</span>
          <button type="button" onClick={() => onEdit(player)}>Edit</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </>
      ) : null}
    </div>
  );
};
