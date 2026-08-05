interface IconProps {
  className?: string;
}

export const ChevronIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="m6.5 9 5.5 5.5L17.5 9" />
  </svg>
);

export const RosterIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M16 19.5v-1.2c0-2.1-1.8-3.8-4-3.8H7c-2.2 0-4 1.7-4 3.8v1.2" />
    <circle cx="9.5" cy="8" r="3.5" />
    <path d="M15 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c1.8.7 3 2.1 3 3.8v.9" />
  </svg>
);
