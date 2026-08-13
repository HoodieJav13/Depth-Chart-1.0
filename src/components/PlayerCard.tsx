import type { DragEvent, MouseEvent } from "react";
import type { Player } from "../domain/types";

interface PlayerCardProps {
  player: Player;
  selected: boolean;
  depthIndex?: number;
  sourcePositionId?: string;
  onSelect: (playerId: string, sourcePositionId?: string) => void;
  onDropBefore?: (playerId: string, depthIndex: number, fromPositionId?: string) => void;
}

export const PlayerCard = ({
  player,
  selected,
  depthIndex,
  sourcePositionId,
  onSelect,
  onDropBefore,
}: PlayerCardProps) => {
  const jerseyNumber = player.number?.trim();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelect(player.id, sourcePositionId);
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/player-id", player.id);
    if (sourcePositionId) {
      event.dataTransfer.setData("text/from-position-id", sourcePositionId);
    }
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    if (depthIndex === undefined || !onDropBefore) return;
    event.preventDefault();
    event.stopPropagation();
    const playerId = event.dataTransfer.getData("text/player-id");
    const fromPositionId = event.dataTransfer.getData("text/from-position-id") || undefined;
    if (playerId) onDropBefore(playerId, depthIndex, fromPositionId);
  };

  return (
    <button
      className={`player-card${selected ? " selected" : ""}`}
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
