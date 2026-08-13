import type {
  FormationConfig,
  Player,
  PositionAssignments,
  PositionConfig,
} from "../domain/types";
import { CrossListAction } from "./CrossListAction";
import { PlayerCard } from "./PlayerCard";

interface PositionDetailPanelProps {
  formation: FormationConfig;
  position: PositionConfig;
  assignments: PositionAssignments;
  players: Player[];
  selectedPlayerId: string | null;
  onClose: () => void;
  onSelectPlayer: (playerId: string, fromPositionId: string) => void;
  onMovePlayer: (playerId: string, positionId: string, toDepthIndex?: number, fromPositionId?: string) => void;
  onUnassignPlayer: (playerId: string, fromPositionId: string) => void;
  onCrossListPlayer: (playerId: string, positionId: string, toDepthIndex: number) => void;
  onEditPlayer: (player: Player) => void;
  onArchivePlayer: (player: Player) => void;
  assignmentSummary?: (playerId: string) => string[];
}

export const PositionDetailPanel = ({
  formation,
  position,
  assignments,
  players,
  selectedPlayerId,
  onClose,
  onSelectPlayer,
  onMovePlayer,
  onUnassignPlayer,
  onCrossListPlayer,
  onEditPlayer,
  onArchivePlayer,
  assignmentSummary,
}: PositionDetailPanelProps) => {
  return (
    <aside className="position-detail-panel desktop-drawer" aria-label={`${position.label} position detail`}>
      <header className="position-detail-header">
        <div>
          <span>Position</span>
          <h2>{position.label} Depth</h2>
          <small>{players.length ? `${players.length} assigned` : "Empty"}</small>
        </div>
        <button type="button" aria-label="Close position detail" onClick={onClose}>×</button>
      </header>
      <div className="position-detail-list">
        {players.length ? players.map((player, index) => (
            <div className="position-detail-row" key={player.id}>
              <span className="depth-order">{index + 1}</span>
              <PlayerCard
                player={player}
                selected={selectedPlayerId === player.id}
                depthIndex={index}
                sourcePositionId={position.id}
                onSelect={(playerId) => onSelectPlayer(playerId, position.id)}
                onDropBefore={(movingPlayerId, toDepthIndex, fromPositionId) =>
                  onMovePlayer(movingPlayerId, position.id, toDepthIndex, fromPositionId)
                }
              />
              {selectedPlayerId === player.id && assignmentSummary ? (
                <div className="assignment-summary">
                  {assignmentSummary(player.id).map((line) => <span key={line}>{line}</span>)}
                </div>
              ) : null}
              <div className="position-player-actions">
                <CrossListAction
                  key={`${formation.id}:${position.id}:${player.id}`}
                  player={player}
                  formation={formation}
                  sourcePositionId={position.id}
                  assignments={assignments}
                  onCrossListPlayer={onCrossListPlayer}
                />
                <button type="button" aria-label={`Unassign ${player.name}`} onClick={() => onUnassignPlayer(player.id, position.id)}>Unassign</button>
                <button type="button" aria-label={`Edit ${player.name}`} onClick={() => onEditPlayer(player)}>Edit</button>
                <button className="danger" type="button" aria-label={`Archive ${player.name}`} onClick={() => onArchivePlayer(player)}>Archive</button>
              </div>
            </div>
          )) : (
          <div className="position-detail-empty">
            <strong>No players assigned</strong>
            <span>Select a roster player, then place them on this field card.</span>
          </div>
        )}
      </div>
    </aside>
  );
};
