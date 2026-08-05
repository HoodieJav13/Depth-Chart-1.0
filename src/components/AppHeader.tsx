import type { FormationConfig } from "../domain/types";
import { UnitTabs } from "./UnitTabs";

interface AppHeaderProps {
  formations: FormationConfig[];
  activeFormationId: string;
  onFormationChange: (formationId: string) => void;
}

export const AppHeader = ({
  formations,
  activeFormationId,
  onFormationChange,
}: AppHeaderProps) => (
  <header className="app-header">
    <h1>Eldorado Depth Chart</h1>
    <UnitTabs
      formations={formations}
      activeFormationId={activeFormationId}
      onChange={onFormationChange}
    />
  </header>
);
