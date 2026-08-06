import { useMemo, useState, type DragEvent } from "react";
import type { Player } from "../domain/types";
import { ChevronIcon, RosterIcon } from "./icons";
import { PlayerActionsMenu } from "./PlayerActionsMenu";
import { PlayerCard } from "./PlayerCard";

interface UnassignedDrawerProps {
  players: Player[];
  selectedPlayerId: string | null;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onSelectPlayer: (playerId: string) => void;
  onUnassignPlayer: (playerId: string) => void;
  onRequestAddPlayer: () => void;
  onEditPlayer: (player: Player) => void;
  onArchivePlayer: (player: Player) => void;
}

export const UnassignedDrawer = ({
  players,
  selectedPlayerId,
  mobileOpen,
  onMobileOpenChange,
  onSelectPlayer,
  onUnassignPlayer,
  onRequestAddPlayer,
  onEditPlayer,
  onArchivePlayer,
}: UnassignedDrawerProps) => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return players;
    return players.filter((player) =>
      `${player.name} ${player.number ?? ""}`.toLowerCase().includes(normalized),
    );
  }, [players, query]);

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("text/player-id");
    if (playerId) onUnassignPlayer(playerId);
  };

  const moveSelectedToUnassigned = () => {
    if (selectedPlayerId) onUnassignPlayer(selectedPlayerId);
    else onMobileOpenChange(!mobileOpen);
  };

  const rosterRow = (player: Player, closeOnSelect = false) => (
    <div className="roster-player-row" key={player.id}>
      <PlayerCard
        player={player}
        selected={selectedPlayerId === player.id}
        onSelect={(playerId) => {
          onSelectPlayer(playerId);
          if (closeOnSelect) onMobileOpenChange(false);
        }}
      />
      <PlayerActionsMenu player={player} onEdit={onEditPlayer} onArchive={onArchivePlayer} />
    </div>
  );

  return (
    <>
      <aside className="unassigned-drawer desktop-drawer" aria-label="Unassigned players" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <div className="drawer-heading">
          <div><h2>Unassigned Players</h2><span>{players.length}</span></div>
          <input
            className="roster-search"
            type="search"
            aria-label="Search unassigned players"
            placeholder="Search roster"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="add-player-button" type="button" onClick={onRequestAddPlayer}>Add player</button>
          {selectedPlayerId ? <button className="move-selected-button" type="button" onClick={() => onUnassignPlayer(selectedPlayerId)}>Move selected here</button> : null}
        </div>
        <div className="unassigned-list">
          {filtered.length ? filtered.map((player) => rosterRow(player)) : <p className="empty-roster-search">No matching players.</p>}
        </div>
      </aside>

      <section className={`mobile-unassigned${mobileOpen ? " open" : ""}`} aria-label="Unassigned players" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <button className="mobile-unassigned-bar" type="button" aria-expanded={mobileOpen} onClick={moveSelectedToUnassigned}>
          <RosterIcon />
          <strong>{selectedPlayerId ? "Move selected to Unassigned" : "Unassigned"}</strong>
          <span>{players.length}</span>
          <ChevronIcon className={mobileOpen ? "open" : ""} />
        </button>
        {mobileOpen ? (
          <div className="mobile-unassigned-list">
            <input
              className="roster-search"
              type="search"
              aria-label="Search unassigned players"
              placeholder="Search roster"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="add-player-button" type="button" onClick={onRequestAddPlayer}>Add player</button>
            {filtered.map((player) => rosterRow(player, true))}
          </div>
        ) : null}
      </section>
    </>
  );
};
