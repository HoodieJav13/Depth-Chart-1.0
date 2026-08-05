import type { FormationConfig } from "../domain/types";
import { UnitTabs } from "./UnitTabs";

interface AppHeaderProps {
  formations: FormationConfig[];
  activeFormationId: string;
  onFormationChange: (formationId: string) => void;
  signedInPhoneNumber: string;
  onSignOut: () => Promise<void>;
}

const formatPhoneNumber = (phoneNumber: string): string => {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(phoneNumber);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phoneNumber;
};

export const AppHeader = ({
  formations,
  activeFormationId,
  onFormationChange,
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
    <div className="coach-session">
      <span>{formatPhoneNumber(signedInPhoneNumber)}</span>
      <button type="button" onClick={() => void onSignOut()}>
        Sign out
      </button>
    </div>
  </header>
);
