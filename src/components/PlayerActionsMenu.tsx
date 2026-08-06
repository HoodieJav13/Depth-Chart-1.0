import type { Player } from "../domain/types";

interface PlayerActionsMenuProps {
  player: Player;
  onEdit: (player: Player) => void;
  onArchive: (player: Player) => void;
}

export const PlayerActionsMenu = ({
  player,
  onEdit,
  onArchive,
}: PlayerActionsMenuProps) => (
  <details className="player-actions-menu">
    <summary aria-label={`Actions for ${player.name}`}>•••</summary>
    <div>
      <button type="button" onClick={() => onEdit(player)}>
        Edit player
      </button>
      <button className="danger" type="button" onClick={() => onArchive(player)}>
        Archive player
      </button>
    </div>
  </details>
);
