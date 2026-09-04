'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PublicBannerAd } from '@/features/ads/types';

type BannerProps = {
  ads?: PublicBannerAd[];
  offset?: number;
};

function useRotatingAd(ads: PublicBannerAd[] = [], offset = 0) {
  const activeAds = useMemo(() => ads.filter((ad) => ad.desktopImageUrl), [ads]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (activeAds.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => current + 1), 7000);
    return () => window.clearInterval(timer);
  }, [activeAds.length]);

  if (activeAds.length === 0) return null;
  return activeAds[(index + offset) % activeAds.length] ?? activeAds[0];
}

function AdBadge() {
  return <span className="ad-creative-badge">Ad</span>;
}

export function PremiumAdBanner({ ads = [], offset = 0 }: BannerProps) {
  const ad = useRotatingAd(ads, offset);

  if (ad) {
    return (
      <Link className="banner-ad banner-ad-image" href={ad.targetUrl} target="_blank">
        <AdBadge />
        <picture>
          {ad.mobileImageUrl && <source media="(max-width: 620px)" srcSet={ad.mobileImageUrl} />}
          <img src={ad.desktopImageUrl} alt={ad.title || 'Advertisement'} />
        </picture>
      </Link>
    );
  }

  return (
    <div className="banner-ad">
      <small>AD SPACE</small>
      <div className="ad-placeholder-copy">
        <b>Reach crypto&apos;s earliest coin hunters.</b>
        <span>Premium inventory · Measured impressions and clicks</span>
      </div>
      <Link href="/advertise">View ad packages ↗</Link>
    </div>
  );
}

export function WideAdBanner({ ads = [], offset = 0 }: BannerProps) {
  const ad = useRotatingAd(ads, offset);

  if (ad) {
    return (
      <Link className="container wide-banner wide-banner-image" href={ad.targetUrl} target="_blank">
        <AdBadge />
        <picture>
          {ad.mobileImageUrl && <source media="(max-width: 620px)" srcSet={ad.mobileImageUrl} />}
          <img src={ad.desktopImageUrl} alt={ad.title || 'Advertisement'} />
        </picture>
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

export function CoinPageAdBanner({ ads = [], offset = 0 }: BannerProps) {
  const ad = useRotatingAd(ads, offset);

  if (ad) {
    return (
      <Link className="coin-page-ad-banner ad-banner-image" href={ad.targetUrl} target="_blank">
        <AdBadge />
        <picture>
          {ad.mobileImageUrl && <source media="(max-width: 620px)" srcSet={ad.mobileImageUrl} />}
          <img src={ad.desktopImageUrl} alt={ad.title || 'Advertisement'} />
        </picture>
      </Link>
    );
  }

  return (
    <div className="coin-page-ad-banner">
      <small>COIN PAGE AD</small>
      <b>Put your project beside active coin research.</b>
      <Link href="/advertise">View ad packages ↗</Link>
    </div>
  );
}
