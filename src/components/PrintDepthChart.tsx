import type { FormationConfig, Player, PositionAssignments } from "../domain/types";

interface PrintDepthChartProps {
  title: string;
  date: string;
  formation: FormationConfig;
  assignments: PositionAssignments;
  playersById: Map<string, Player>;
}

export const PrintDepthChart = ({
  title,
  date,
  formation,
  assignments,
  playersById,
}: PrintDepthChartProps) => (
  <section className="print-depth-chart" aria-label="Printable depth chart">
    <header>
      <div>
        <p>Eldorado Football</p>
        <h1>{title || `${formation.name} Depth Chart`}</h1>
      </div>
      <span>{date}</span>
    </header>
    <div className="print-position-grid">
      {[...formation.positions]
        .sort((a, b) => a.listOrder - b.listOrder)
        .map((position) => (
          <article key={position.id}>
            <h2>{position.label}</h2>
            <ol>
              {(assignments[position.id] ?? []).map((playerId) => {
                const player = playersById.get(playerId);
                return player ? (
                  <li key={player.id}>
                    <b>{player.number ? `#${player.number}` : "—"}</b>
                    <span>{player.name}</span>
                  </li>
                ) : null;
              })}
              {(assignments[position.id] ?? []).length === 0 ? <li className="empty">Unassigned</li> : null}
            </ol>
          </article>
        ))}
    </div>
  </section>
);
