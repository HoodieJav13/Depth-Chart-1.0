import type { FormationConfig, StoreStatus } from "../domain/types";
import { CoachSessionMenu } from "./CoachSessionMenu";
import { SaveStatus } from "./SaveStatus";
import { UnitTabs } from "./UnitTabs";

interface AppHeaderProps {
  formations: FormationConfig[];
  activeFormationId: string;
  onFormationChange: (formationId: string) => void;
  coachDisplayName: string;
  signedInPhoneNumber: string;
  status: StoreStatus;
  onRetry: () => void;
  onOpenSnapshots: () => void;
  onOpenPrint: () => void;
  onSignOut: () => Promise<void>;
}

export const AppHeader = ({
  formations,
  activeFormationId,
  onFormationChange,
  coachDisplayName,
  signedInPhoneNumber,
  status,
  onRetry,
  onOpenSnapshots,
  onOpenPrint,
  onSignOut,
}: AppHeaderProps) => (
  <header className="app-header">
    <h1>Eldorado Depth Chart</h1>
    <UnitTabs
      formations={formations}
      activeFormationId={activeFormationId}
      onChange={onFormationChange}
    />
    <div className="header-actions">
      <SaveStatus status={status} onRetry={onRetry} />
      <button
        className="header-tool"
        type="button"
        onClick={onOpenSnapshots}
      >
        Snapshots
      </button>
      <button className="header-tool" type="button" onClick={onOpenPrint}>
        Print
      </button>
      <CoachSessionMenu
        displayName={coachDisplayName}
        phoneNumber={signedInPhoneNumber}
        onOpenSnapshots={onOpenSnapshots}
        onOpenPrint={onOpenPrint}
        onSignOut={onSignOut}
      />
    </div>
  </header>
);
