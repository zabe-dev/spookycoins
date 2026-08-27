type SocialKind = 'website' | 'telegram' | 'x' | 'discord' | 'share' | 'report' | 'buy';

const paths: Record<SocialKind, string> = {
  website:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c2.5 2.7 3.8 6 3.8 10S14.5 19.3 12 22m0-20C9.5 4.7 8.2 8 8.2 12s1.3 7.3 3.8 10M2 12h20',
  telegram: 'm3 11 17-7-4 16-6-5-4 3 1-5 13-9-16 6Z',
  x: 'M5 4h4l10 16h-4L5 4Zm14 0-6 7m-2 3-6 6',
  discord: 'M7 7c3-2 7-2 10 0l2 10c-2 2-4 3-5 3l-1-2h-2l-1 2c-1 0-3-1-5-3L7 7Zm3 7h.01M14 14h.01',
  share: 'M8 12 16 5m0 0v5m0-5h-5M18 13v6H5V6h6',
  report: 'M6 21V4m0 1h11l-2 4 2 4H6',
  buy: 'M4 6h2l2 10h9l2-7H7m2 11h.01M17 20h.01',
};

function Icon({ kind }: { kind: SocialKind }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[kind]} />
    </svg>
  );
}

export function CoinSocialActions({ buyUrl }: { buyUrl?: string }) {
  const socials: Array<{ kind: SocialKind; label: string; href?: string }> = [
    { kind: 'website', label: 'Website', href: '#' },
    { kind: 'telegram', label: 'Telegram', href: '#' },
    { kind: 'x', label: 'X', href: '#' },
    { kind: 'discord', label: 'Discord', href: '#' },
  ];

  return (
    <div className="coin-social-actions">
      <div className="official-links" aria-label="Official project links">
        {socials.map(({ kind, label, href }) => (
          <a key={kind} href={href} aria-label={label} title={label}>
            <Icon kind={kind} />
            <span>{label}</span>
          </a>
        ))}
      </div>
      <div className="project-utilities">
        <button className="share-action" aria-label="Share project">
          <Icon kind="share" />
          <span>Share</span>
        </button>
        <button className="report-action" aria-label="Report project">
          <Icon kind="report" />
          <span>Report</span>
        </button>
        {buyUrl && (
          <a className="buy-action" href={buyUrl} target="_blank" rel="noreferrer">
            <Icon kind="buy" />
            <span>Buy</span>
          </a>
        )}
      </div>
    </div>
  );
}
