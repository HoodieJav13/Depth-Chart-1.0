import type { DragEvent } from "react";
import type { Player } from "../domain/types";
import { ChevronIcon, RosterIcon } from "./icons";
import { PlayerCard } from "./PlayerCard";

interface UnassignedDrawerProps {
  players: Player[];
  selectedPlayerId: string | null;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onSelectPlayer: (playerId: string) => void;
  onUnassignPlayer: (playerId: string) => void;
  onRequestAddPlayer: () => void;
}

export const UnassignedDrawer = ({
  players,
  selectedPlayerId,
  mobileOpen,
  onMobileOpenChange,
  onSelectPlayer,
  onUnassignPlayer,
  onRequestAddPlayer,
}: UnassignedDrawerProps) => {
  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("text/player-id");
    if (playerId) onUnassignPlayer(playerId);
  };

  const moveSelectedToUnassigned = () => {
    if (selectedPlayerId) onUnassignPlayer(selectedPlayerId);
    else onMobileOpenChange(!mobileOpen);
  };

  return (
    <>
      <aside
        className="unassigned-drawer desktop-drawer"
        aria-label="Unassigned players"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="drawer-heading">
          <div>
            <h2>Unassigned Players</h2>
            <span>{players.length}</span>
          </div>
          <button className="add-player-button" type="button" onClick={onRequestAddPlayer}>
            Add player
          </button>
          {selectedPlayerId ? (
            <button className="move-selected-button" type="button" onClick={() => onUnassignPlayer(selectedPlayerId)}>
              Move selected here
            </button>
          ) : null}
        </div>
        <div className="unassigned-list">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              selected={selectedPlayerId === player.id}
              onSelect={onSelectPlayer}
            />
          ))}
        </div>
      </aside>

      <section
        className={`mobile-unassigned${mobileOpen ? " open" : ""}`}
        aria-label="Unassigned players"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <button
          className="mobile-unassigned-bar"
          type="button"
          aria-expanded={mobileOpen}
          onClick={moveSelectedToUnassigned}
        >
          <RosterIcon />
          <strong>{selectedPlayerId ? "Move selected to Unassigned" : "Unassigned"}</strong>
          <span>{players.length}</span>
          <ChevronIcon className={mobileOpen ? "open" : ""} />
        </button>
        {mobileOpen ? (
          <div className="mobile-unassigned-list">
            <button className="add-player-button" type="button" onClick={onRequestAddPlayer}>
              Add player
            </button>
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selected={selectedPlayerId === player.id}
                onSelect={(playerId) => {
                  onSelectPlayer(playerId);
                  onMobileOpenChange(false);
                }}
              />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
};
