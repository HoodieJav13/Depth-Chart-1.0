import type { DragEvent, MouseEvent } from "react";
import type { Player } from "../domain/types";

interface PlayerCardProps {
  player: Player;
  selected: boolean;
  depthIndex?: number;
  compact?: boolean;
  onSelect: (playerId: string) => void;
  onDropBefore?: (playerId: string, depthIndex: number) => void;
}

export const PlayerCard = ({
  player,
  selected,
  depthIndex,
  compact = false,
  onSelect,
  onDropBefore,
}: PlayerCardProps) => {
  const jerseyNumber = player.number?.trim();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelect(player.id);
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/player-id", player.id);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    if (depthIndex === undefined || !onDropBefore) return;
    event.preventDefault();
    event.stopPropagation();
    const playerId = event.dataTransfer.getData("text/player-id");
    if (playerId) onDropBefore(playerId, depthIndex);
  };

  return (
    <button
      className={`player-card${selected ? " selected" : ""}${compact ? " compact" : ""}`}
      type="button"
      draggable
      aria-pressed={selected}
      title={player.name}
      data-player-id={player.id}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragOver={(event) => onDropBefore && event.preventDefault()}
      onDrop={handleDrop}
    >
      {jerseyNumber ? <span className="jersey-number">#{jerseyNumber}</span> : null}
      <span className="player-name">{player.name}</span>
    </button>
  );
};
