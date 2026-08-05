import type { FormationConfig } from "../domain/types";

interface UnitTabsProps {
  formations: FormationConfig[];
  activeFormationId: string;
  onChange: (formationId: string) => void;
}

export const UnitTabs = ({
  formations,
  activeFormationId,
  onChange,
}: UnitTabsProps) => (
  <nav className="unit-tabs" aria-label="Depth chart unit">
    {formations.map((formation) => (
      <button
        key={formation.id}
        className={formation.id === activeFormationId ? "active" : ""}
        type="button"
        aria-current={formation.id === activeFormationId ? "page" : undefined}
        onClick={() => onChange(formation.id)}
      >
        {formation.name}
      </button>
    ))}
  </nav>
);
