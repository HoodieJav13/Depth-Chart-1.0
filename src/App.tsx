import { useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { AddPlayerDialog } from "./components/AddPlayerDialog";
import { DesktopField } from "./components/DesktopField";
import { MigrationNotice } from "./components/MigrationNotice";
import { MobileDepthList } from "./components/MobileDepthList";
import { PlayerEditorDialog } from "./components/PlayerEditorDialog";
import { PrintControls } from "./components/PrintControls";
import { PrintDepthChart } from "./components/PrintDepthChart";
import { PositionDetailPanel } from "./components/PositionDetailPanel";
import { SelectionBar } from "./components/SelectionBar";
import { SnapshotManager } from "./components/SnapshotManager";
import { UndoBar } from "./components/UndoBar";
import { UnassignedDrawer } from "./components/UnassignedDrawer";
import { formationConfig, formationsById } from "./domain/config";
import { useDepthChart } from "./hooks/useDepthChart";
import type {
  AddPlayerInput,
  MigrationResult,
  Player,
  UpdatePlayerInput,
} from "./domain/types";
import type { DepthChartStore } from "./store/DepthChartStore";
import { effectivePlayers } from "./store/stateModel";
import { buildPlayerAssignmentSummaries } from "./domain/assignmentSummary";
import {
  beginFieldDrag,
  completeFieldDrag,
  createRightSurfaceState,
  closePositionDetail,
  openPositionDetail,
  setRosterOpen,
} from "./rightSurfaceState";

interface AppProps {
  store: DepthChartStore;
  coachDisplayName: string;
  signedInPhoneNumber: string;
  onSignOut: () => Promise<void>;
  migrationResult?: MigrationResult | null;
}

export const App = ({
  store,
  coachDisplayName,
  signedInPhoneNumber,
  onSignOut,
  migrationResult = null,
}: AppProps) => {
  const [activeFormationId, setActiveFormationId] = useState("offense-base");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [rightSurface, setRightSurface] = useState(createRightSurfaceState);
  const [mobileUnassignedOpen, setMobileUnassignedOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printTitle, setPrintTitle] = useState("");
  const [printDate, setPrintDate] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [moveConfirmation, setMoveConfirmation] = useState<string | null>(null);
  const { state, status, isLoading } = useDepthChart(store);

  const formation = formationsById.get(activeFormationId) ?? formationConfig.formations[0];
  const assignments = useMemo(() => state.assignments[formation.id] ?? {}, [formation.id, state.assignments]);
  const players = useMemo(() => effectivePlayers(state), [state]);
  const playersById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);
  const assignedPlayerIds = useMemo(() => new Set(Object.values(assignments).flat()), [assignments]);
  const unassignedPlayers = players.filter((player) => !assignedPlayerIds.has(player.id));
  const selectedPlayer = selectedPlayerId ? playersById.get(selectedPlayerId) ?? null : null;
  const assignmentSummaries = useMemo(
    () => buildPlayerAssignmentSummaries(formationConfig.formations, state.assignments),
    [state.assignments],
  );
  const expandedPosition = expandedPositionId
    ? formation.positions.find((item) => item.id === expandedPositionId) ?? null
    : null;
  const expandedPlayers = expandedPosition
    ? (assignments[expandedPosition.id] ?? []).flatMap((id) => {
        const player = playersById.get(id);
        return player ? [player] : [];
      })
    : [];

  const showError = (error: unknown) => {
    setActionError(error instanceof Error ? error.message : "The action could not be completed.");
  };

  const selectPlayer = (playerId: string) => {
    setMoveConfirmation(null);
    setSelectedPlayerId((current) => (current === playerId ? null : playerId));
  };

  const movePlayer = async (playerId: string, positionId: string, toDepthIndex?: number) => {
    setActionError(null);
    try {
      await store.moveAssignment({ playerId, formationId: formation.id, toPositionId: positionId, toDepthIndex });
      const player = playersById.get(playerId);
      const position = formation.positions.find((item) => item.id === positionId);
      setMoveConfirmation(`${player?.name ?? "Player"} moved to ${position?.label ?? "position"}`);
      setSelectedPlayerId(null);
      window.setTimeout(() => setMoveConfirmation(null), 1800);
    } catch (error) {
      showError(error);
    }
  };

  const unassignPlayer = async (playerId: string) => {
    try {
      await store.unassignPlayer({ playerId, formationId: formation.id });
      setSelectedPlayerId(null);
    } catch (error) {
      showError(error);
    }
  };

  const addPlayer = async (input: AddPlayerInput) => {
    await store.addPlayer(input);
    setAddPlayerOpen(false);
    setMobileUnassignedOpen(true);
  };

  const updatePlayer = async (input: UpdatePlayerInput) => {
    await store.updatePlayer(input);
  };

  const archivePlayer = async (player: Player) => {
    if (!window.confirm(`Archive ${player.name}? They will be removed from all positions.`)) return;
    try {
      await store.archivePlayer({ playerId: player.id });
      if (selectedPlayerId === player.id) setSelectedPlayerId(null);
    } catch (error) {
      showError(error);
    }
  };

  const changeFormation = (formationId: string) => {
    setActiveFormationId(formationId);
    setSelectedPlayerId(null);
    setExpandedPositionId(null);
    setMobileUnassignedOpen(false);
    setRightSurface(createRightSurfaceState());
  };

  const togglePositionDetail = (positionId: string) => {
    if (expandedPositionId === positionId && rightSurface.mode === "position") {
      setExpandedPositionId(null);
      setRightSurface(closePositionDetail);
      return;
    }
    setExpandedPositionId(positionId);
    setRightSurface(openPositionDetail);
  };

  const closePosition = () => {
    setExpandedPositionId(null);
    setRightSurface(closePositionDetail);
  };

  const print = (title: string, date: string) => {
    setPrintTitle(title);
    setPrintDate(date);
    setPrintOpen(false);
    window.setTimeout(() => window.print(), 0);
  };

  return (
    <div className="app-shell">
      <AppHeader
        formations={formationConfig.formations}
        activeFormationId={formation.id}
        onFormationChange={changeFormation}
        coachDisplayName={coachDisplayName}
        signedInPhoneNumber={signedInPhoneNumber}
        status={status}
        onRetry={() => void store.retryLastWrite().catch(showError)}
        onOpenSnapshots={() => setSnapshotsOpen(true)}
        onOpenPrint={() => setPrintOpen(true)}
        onSignOut={onSignOut}
      />
      <MigrationNotice result={migrationResult} />
      {actionError ? <div className="workflow-error" role="alert"><span>{actionError}</span><button type="button" onClick={() => setActionError(null)}>Dismiss</button></div> : null}

      {isLoading ? (
        <div className="loading-state">Loading shared depth chart…</div>
      ) : (
        <div className={`workspace right-surface-${rightSurface.mode}`}>
          <DesktopField
            formation={formation}
            assignments={assignments}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
            expandedPositionId={expandedPositionId}
            onTogglePosition={togglePositionDetail}
            onMovePlayer={(playerId, positionId, toDepthIndex) => void movePlayer(playerId, positionId, toDepthIndex)}
            onStarterDragStart={() => setRightSurface(beginFieldDrag)}
            onStarterDragEnd={() => setRightSurface((current) => completeFieldDrag(current, false))}
            assignmentSummaries={assignmentSummaries}
          />
          <MobileDepthList
            key={formation.id}
            formation={formation}
            assignments={assignments}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={selectPlayer}
            onMovePlayer={(playerId, positionId, toDepthIndex) => void movePlayer(playerId, positionId, toDepthIndex)}
          />
          <UnassignedDrawer
            players={unassignedPlayers}
            selectedPlayerId={selectedPlayerId}
            mobileOpen={mobileUnassignedOpen}
            desktopOpen={rightSurface.mode === "roster"}
            desktopVisible={rightSurface.mode !== "position"}
            onMobileOpenChange={setMobileUnassignedOpen}
            onDesktopOpenChange={(open) => setRightSurface((current) => setRosterOpen(current, open))}
            onDesktopDrop={() => setRightSurface((current) => completeFieldDrag(current, true))}
            onSelectPlayer={selectPlayer}
            onUnassignPlayer={(playerId) => void unassignPlayer(playerId)}
            onRequestAddPlayer={() => setAddPlayerOpen(true)}
            onEditPlayer={setEditingPlayer}
            onArchivePlayer={(player) => void archivePlayer(player)}
          />
          {rightSurface.mode === "position" && expandedPosition ? (
            <PositionDetailPanel
              position={expandedPosition}
              players={expandedPlayers}
              selectedPlayerId={selectedPlayerId}
              onClose={closePosition}
              onSelectPlayer={selectPlayer}
              onMovePlayer={(playerId, positionId, toDepthIndex) => void movePlayer(playerId, positionId, toDepthIndex)}
              onUnassignPlayer={(playerId) => void unassignPlayer(playerId)}
              onEditPlayer={setEditingPlayer}
              onArchivePlayer={(player) => void archivePlayer(player)}
              assignmentSummary={(playerId) => {
                const summary = assignmentSummaries.get(playerId);
                if (!summary) return [];
                return [
                  ...(summary.offense.length ? [`Offense: ${summary.offense.join(", ")}`] : []),
                  ...(summary.defense.length ? [`Defense: ${summary.defense.join(", ")}`] : []),
                ];
              }}
            />
          ) : null}
        </div>
      )}

      <SelectionBar player={selectedPlayer} confirmation={moveConfirmation} onEdit={setEditingPlayer} onCancel={() => setSelectedPlayerId(null)} />
      <UndoBar canUndo={status.canUndo} onUndo={() => void store.undoLastChange().catch(showError)} />
      <PrintDepthChart title={printTitle} date={printDate} formation={formation} assignments={assignments} playersById={playersById} />

      {addPlayerOpen ? <AddPlayerDialog onClose={() => setAddPlayerOpen(false)} onAddPlayer={addPlayer} /> : null}
      {editingPlayer ? <PlayerEditorDialog player={editingPlayer} onClose={() => setEditingPlayer(null)} onSave={updatePlayer} /> : null}
      {snapshotsOpen ? <SnapshotManager store={store} onClose={() => setSnapshotsOpen(false)} /> : null}
      {printOpen ? <PrintControls defaultTitle={`Eldorado ${formation.name} Depth Chart`} onClose={() => setPrintOpen(false)} onPrint={print} /> : null}
    </div>
  );
};
