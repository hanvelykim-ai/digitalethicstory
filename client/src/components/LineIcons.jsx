export function FeatherIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="line-icon">
      <path
        d="M20.5 3.5c-4 0-13 2-15.5 14.5M4 20l3.5-3.5M9 15l4-4M12 12l4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="line-icon">
      <path
        d="M6 10c6-3 12-3 18 0v28c-6-3-12-3-18 0V10z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M42 10c-6-3-12-3-18 0v28c6-3 12-3 18 0V10z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ApronIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="line-icon">
      <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M16 25l5.5 5.5L33 19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="line-icon">
      <path d="M4 12l6 6L20 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
