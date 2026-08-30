import { Flag, Share2, ShoppingCart } from 'lucide-react';

type SocialKind = 'share' | 'report' | 'buy';

const icons = {
  share: Share2,
  report: Flag,
  buy: ShoppingCart,
};

function Icon({ kind }: { kind: SocialKind }) {
  const SocialIcon = icons[kind];
  return <SocialIcon aria-hidden="true" />;
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
