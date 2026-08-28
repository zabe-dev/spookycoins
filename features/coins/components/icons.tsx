'use client';

export function BoltIcon() {
  return (
    <svg className="bolt-icon" aria-hidden="true" viewBox="0 0 448 512">
      <path
        fill="currentColor"
        d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288h111.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3S397.3 224 384 224H272.5l76.9-179.4z"
      />
    </svg>
  );
}

export function DiscoveryIcon({ type }: { type: 'new' | 'trend' | 'watch' }) {
  if (type === 'new') {
    return (
      <svg className="discovery-icon new-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v18M3 12h18" />
        <path d="m17 4 .7 1.8L20 7l-2.3 1.2L17 10l-.7-1.8L14 7l2.3-1.2L17 4Z" />
      </svg>
    );
  }

  if (type === 'trend') {
    return (
      <svg className="discovery-icon trend-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 17 9 12l4 3 7-9" />
        <path d="M15 6h5v5" />
      </svg>
    );
  }

  return (
    <svg className="discovery-icon watch-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-8-4.6-8-10a4.4 4.4 0 0 1 8-2.5A4.4 4.4 0 0 1 20 10c0 5.4-8 10-8 10Z" />
      <path d="m9.2 11.8 1.8 1.8 4-4" />
    </svg>
  );
}
