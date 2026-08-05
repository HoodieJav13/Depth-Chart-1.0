import { useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { AddPlayerDialog } from "./components/AddPlayerDialog";
import { DesktopField } from "./components/DesktopField";
import { MobileDepthList } from "./components/MobileDepthList";
import { UnassignedDrawer } from "./components/UnassignedDrawer";
import { formationConfig, formationsById, roster } from "./domain/config";
import { useDepthChart } from "./hooks/useDepthChart";
import type { AddPlayerInput } from "./domain/types";
import type { DepthChartStore } from "./store/DepthChartStore";

interface AppProps {
  store: DepthChartStore;
}

export const App = ({ store }: AppProps) => {
  const [activeFormationId, setActiveFormationId] = useState("offense-base");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [mobileUnassignedOpen, setMobileUnassignedOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const { state, isLoading } = useDepthChart(store);

  const formation = formationsById.get(activeFormationId) ?? formationConfig.formations[0];
  const assignments = useMemo(
    () => state.assignments[formation.id] ?? {},
    [formation.id, state.assignments],
  );

  const assignedPlayerIds = useMemo(
    () => new Set(Object.values(assignments).flat()),
    [assignments],
  );
  const players = useMemo(
    () => [...roster.players, ...state.addedPlayers],
    [state.addedPlayers],
  );
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const unassignedPlayers = players.filter(
    (player) => !assignedPlayerIds.has(player.id),
  );

  const selectPlayer = (playerId: string) => {
    setSelectedPlayerId((current) => (current === playerId ? null : playerId));
  };

  const movePlayer = async (
    playerId: string,
    positionId: string,
    toDepthIndex?: number,
  ) => {
    await store.moveAssignment({
      playerId,
      formationId: formation.id,
      toPositionId: positionId,
      toDepthIndex,
    });
    setSelectedPlayerId(null);
  };

  const unassignPlayer = async (playerId: string) => {
    await store.unassignPlayer({ playerId, formationId: formation.id });
    setSelectedPlayerId(null);
  };

  const addPlayer = async (input: AddPlayerInput) => {
    await store.addPlayer(input);
    setAddPlayerOpen(false);
    setMobileUnassignedOpen(true);
  };

  const changeFormation = (formationId: string) => {
    setActiveFormationId(formationId);
    setSelectedPlayerId(null);
    setExpandedPositionId(null);
    setMobileUnassignedOpen(false);
  };

  return (
    <div className="app-shell">
      <AppHeader
        formations={formationConfig.formations}
        activeFormationId={formation.id}
        onFormationChange={changeFormation}
      />

      {isLoading ? (
        <div className="loading-state">Loading depth chart…</div>
      ) : (
        <div className="workspace">
          <DesktopField
            formation={formation}
            assignments={assignments}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
            expandedPositionId={expandedPositionId}
            onTogglePosition={(positionId) =>
              setExpandedPositionId((current) =>
                current === positionId ? null : positionId,
              )
            }
            onSelectPlayer={selectPlayer}
            onMovePlayer={(playerId, positionId, toDepthIndex) =>
              void movePlayer(playerId, positionId, toDepthIndex)
            }
          />
          <MobileDepthList
            key={formation.id}
            formation={formation}
            assignments={assignments}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={selectPlayer}
            onMovePlayer={(playerId, positionId, toDepthIndex) =>
              void movePlayer(playerId, positionId, toDepthIndex)
            }
          />
          <UnassignedDrawer
            players={unassignedPlayers}
            selectedPlayerId={selectedPlayerId}
            mobileOpen={mobileUnassignedOpen}
            onMobileOpenChange={setMobileUnassignedOpen}
            onSelectPlayer={selectPlayer}
            onUnassignPlayer={(playerId) => void unassignPlayer(playerId)}
            onRequestAddPlayer={() => setAddPlayerOpen(true)}
          />
          {addPlayerOpen ? (
            <AddPlayerDialog
              onClose={() => setAddPlayerOpen(false)}
              onAddPlayer={addPlayer}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
