import type { FormationConfig } from "../domain/types";
import { CoachSessionMenu } from "./CoachSessionMenu";
import { UnitTabs } from "./UnitTabs";

interface AppHeaderProps {
  formations: FormationConfig[];
  activeFormationId: string;
  onFormationChange: (formationId: string) => void;
  coachDisplayName: string;
  signedInPhoneNumber: string;
  onSignOut: () => Promise<void>;
}

export const AppHeader = ({
  formations,
  activeFormationId,
  onFormationChange,
  coachDisplayName,
  signedInPhoneNumber,
  onSignOut,
}: AppHeaderProps) => (
  <header className="app-header">
    <h1>Eldorado Depth Chart</h1>
    <UnitTabs
      formations={formations}
      activeFormationId={activeFormationId}
      onChange={onFormationChange}
    />
    <CoachSessionMenu
      displayName={coachDisplayName}
      phoneNumber={signedInPhoneNumber}
      onSignOut={onSignOut}
    />
  </header>
);
