import Link from 'next/link';

export function GhostLogo() {
  return (
    <svg className="ghost-logo" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="currentColor" />
      <circle
        cx="20"
        cy="20"
        r="15.5"
        fill="none"
        stroke="#0b0d0e"
        strokeWidth="1.2"
        opacity=".35"
      />
      <path
        d="M11 19.2C11 13.1 14.8 9 20 9s9 4.1 9 10.2V30l-4.4-3-4.6 3-4.6-3-4.4 3V19.2Z"
        fill="#0b0d0e"
      />
      <path
        d="M15.2 18.8c1.3-1.6 2.7-1.6 4 0-1.3 1.5-2.7 1.5-4 0Zm5.6 0c1.3-1.6 2.7-1.6 4 0-1.3 1.5-2.7 1.5-4 0Z"
        fill="currentColor"
      />
      <path
        d="M17.2 23.1c1.8 1.2 3.8 1.2 5.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({ beta = false }: { beta?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="SpookyCoins home">
      <span className="brand-mark">
        <GhostLogo />
      </span>
      <span>spookycoins</span>
      {beta && <em>beta</em>}
    </Link>
  );
}
