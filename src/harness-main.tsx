/* eslint-disable react-refresh/only-export-components -- standalone dev entry point */
/**
 * Offline visual harness for the field layout. Renders DesktopField against local fixtures
 * with no auth and no Firestore, so geometry can be checked at real viewports without
 * touching the live shared chart.
 *
 * Run `npm run dev` and open /harness.html. Not an entry point in the production build.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AppHeader } from "./components/AppHeader";
import { DesktopField } from "./components/DesktopField";
import { buildPlayerAssignmentSummaries } from "./domain/assignmentSummary";
import { formationConfig, formationsById, roster } from "./domain/config";
import type { FormationAssignments, Player } from "./domain/types";
import "./styles.css";
import "./mobile-polish.css";
import "./workflow.css";
import "./print.css";

const players: Player[] = roster.players
  .slice(0, 24)
  .map((player, index) => ({ ...player, number: String(index + 1) }));
const playersById = new Map(players.map((player) => [player.id, player]));

const seed = (formationId: string, offset: number): FormationAssignments[string] => {
  const formation = formationsById.get(formationId);
  if (!formation) return {};
  return Object.fromEntries(
    formation.positions.map((position, index) => {
      const starter = players[(index + offset) % players.length];
      const second = players[(index + offset + 11) % players.length];
      const third = players[(index + offset + 15) % players.length];
      // Vary depth so strips, the +N badge, and single-deep columns all appear.
      const depth = index % 3 === 0 ? 3 : index % 3 === 1 ? 2 : 1;
      return [position.id, [starter, second, third].slice(0, depth).map((p) => p.id)];
    }),
  );
};

const assignments: FormationAssignments = {
  "offense-base": seed("offense-base", 0),
  "defense-base": seed("defense-base", 3),
};

const Harness = () => {
  const [formationId, setFormationId] = useState("offense-base");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [surface, setSurface] = useState<"collapsed" | "roster">("collapsed");
  const formation = formationsById.get(formationId) ?? formationConfig.formations[0];
  const summaries = buildPlayerAssignmentSummaries(formationConfig.formations, assignments);

  return (
    <div className="app-shell">
      <AppHeader
        formations={formationConfig.formations}
        activeFormationId={formation.id}
        onFormationChange={setFormationId}
        coachDisplayName="Harness"
        signedInPhoneNumber="+10000000000"
        status={{ phase: "saved", canUndo: false, canRetry: false }}
        onRetry={() => {}}
        onOpenSnapshots={() => {}}
        onOpenPrint={() => {}}
        onSignOut={async () => {}}
      />
      <div
        className={`workspace${surface === "roster" ? " right-surface-roster" : ""}`}
      >
        <DesktopField
          formation={formation}
          assignments={assignments[formation.id] ?? {}}
          playersById={playersById}
          selectedPlayerId={selectedPlayerId}
          expandedPositionId={expandedPositionId}
          onTogglePosition={(id) =>
            setExpandedPositionId((current) => (current === id ? null : id))
          }
          onMovePlayer={() => {}}
          assignmentSummaries={summaries}
        />
        <aside className={`desktop-drawer${surface === "roster" ? " expanded" : ""}`}>
          <button type="button" onClick={() => setSurface(surface === "roster" ? "collapsed" : "roster")}>
            toggle rail
          </button>
        </aside>
      </div>
      <div style={{ position: "fixed", bottom: 4, left: 4, zIndex: 99, display: "flex", gap: 6 }}>
        <button type="button" onClick={() => setSelectedPlayerId(selectedPlayerId ? null : players[0].id)}>
          {selectedPlayerId ? "clear selection" : "select player"}
        </button>
      </div>
    </div>
  );
};

createRoot(document.getElementById("root") as HTMLElement).render(<Harness />);
