type SocialKind = 'share' | 'report' | 'buy';

const paths: Record<SocialKind, string> = {
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
  return (
    <div className="coin-social-actions">
      <div className="coin-utilities">
        <button className="share-action" aria-label="Share coin">
          <Icon kind="share" />
          <span>Share</span>
        </button>
        <button className="report-action" aria-label="Report coin">
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
