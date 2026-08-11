import { useEffect, useMemo, useState } from "react";
import { App } from "./App";
import { getFirebaseFirestore } from "./auth/firebaseCompat";
import type { MigrationResult } from "./domain/types";
import { FirebaseSharedChartBackend } from "./store/FirebaseSharedChartBackend";
import { FirestoreDepthChartStore } from "./store/FirestoreDepthChartStore";
import { LocalStorageDepthChartStore } from "./store/LocalStorageDepthChartStore";

interface AuthenticatedAppProps {
  displayName: string;
  phoneNumber: string;
  onSignOut: () => Promise<void>;
}

export const AuthenticatedApp = ({
  displayName,
  phoneNumber,
  onSignOut,
}: AuthenticatedAppProps) => {
  const localStore = useMemo(() => new LocalStorageDepthChartStore(), []);
  const sharedStore = useMemo(
    () =>
      new FirestoreDepthChartStore(
        new FirebaseSharedChartBackend(getFirebaseFirestore()),
        { displayName, phoneNumber },
      ),
    [displayName, phoneNumber],
  );
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    let active = true;
    void localStore
      .loadLineup()
      .then((localState) => sharedStore.migrateFromLocal(localState))
      .then((result) => {
        if (active) setMigrationResult(result);
      })
      .catch(() => {
        if (active) setMigrationResult("existing");
      });
    return () => {
      active = false;
    };
  }, [localStore, sharedStore]);

  return (
    <App
      store={sharedStore}
      coachDisplayName={displayName}
      signedInPhoneNumber={phoneNumber}
      onSignOut={onSignOut}
      migrationResult={migrationResult}
    />
  );
};
