import type { StoreStatus } from "../domain/types";

interface SaveStatusProps {
  status: StoreStatus;
  onRetry: () => void;
}

export const SaveStatus = ({ status, onRetry }: SaveStatusProps) => {
  const label =
    status.phase === "saving"
      ? "Saving…"
      : status.phase === "offline"
        ? "Offline"
        : status.phase === "error"
          ? "Save failed"
          : status.phase === "loading"
            ? "Loading…"
            : "Saved";

  return (
    <div className={`save-status ${status.phase}`} role="status" aria-live="polite">
      <span className="save-status-dot" aria-hidden="true" />
      <span>{label}</span>
      {status.canRetry ? (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
};
