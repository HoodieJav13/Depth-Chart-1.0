import { useState } from "react";
import type { MigrationResult } from "../domain/types";

interface MigrationNoticeProps {
  result: MigrationResult | null;
}

export const MigrationNotice = ({ result }: MigrationNoticeProps) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || result === null || result === "existing") return null;

  return (
    <div className="migration-notice" role="status">
      <span>
        {result === "created"
          ? "This device’s depth chart was imported into the new shared chart."
          : "The shared depth chart is ready."}
      </span>
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss migration message">
        Dismiss
      </button>
    </div>
  );
};
