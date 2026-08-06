import { useEffect, useRef, useState } from "react";

interface CoachSessionMenuProps {
  displayName: string;
  phoneNumber: string;
  onSignOut: () => Promise<void>;
}

const endingDigits = (phoneNumber: string): string =>
  phoneNumber.replace(/\D/g, "").slice(-4);

const initialsFor = (displayName: string): string => {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "C";
};

export const CoachSessionMenu = ({
  displayName,
  phoneNumber,
  onSignOut,
}: CoachSessionMenuProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="coach-session-menu" ref={containerRef}>
      <button
        className="coach-menu-trigger"
        type="button"
        aria-label={`${displayName} account`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="coach-avatar" aria-hidden="true">
          {initialsFor(displayName)}
        </span>
        <span className="coach-menu-name">{displayName}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </button>

      {open ? (
        <div className="coach-menu-popover" role="menu">
          <div className="coach-menu-summary">
            <strong>{displayName}</strong>
            <span>Ending in {endingDigits(phoneNumber)}</span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void onSignOut();
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
};
