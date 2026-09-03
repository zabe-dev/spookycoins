import Link from 'next/link';
import type { PublicBannerAd } from '@/features/ads/types';

export function CoinAd({ ads = [] }: { ads?: PublicBannerAd[] }) {
  const ad = ads[0];

  if (ad) {
    return (
      <Link className="container wide-banner wide-banner-image" href={ad.targetUrl} target="_blank">
        <picture>
          {ad.mobileImageUrl && <source media="(max-width: 620px)" srcSet={ad.mobileImageUrl} />}
          <img src={ad.desktopImageUrl} alt={ad.title} />
        </picture>
        <span className="wide-banner-overlay">
          <small>FULL-WIDTH ADVERTISEMENT</small>
          <b>{ad.title}</b>
          {ad.subtitle && <em>{ad.subtitle}</em>}
        </span>
      </Link>
    );
  }

  return (
    <div className="container wide-banner">
      <small>FULL-WIDTH ADVERTISEMENT</small>
      <div>
        <b>Reach crypto&apos;s earliest coin hunters.</b>
        <span>Premium inventory · Measured impressions and clicks</span>
      </div>
      <Link href="/advertise">View ad packages ↗</Link>
    </div>
  );
}
