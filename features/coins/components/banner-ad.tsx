'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PublicBannerAd } from '@/features/ads/types';

export function BannerAd({ ads = [] }: { ads?: PublicBannerAd[] }) {
  const activeAds = useMemo(() => ads.filter((ad) => ad.desktopImageUrl), [ads]);
  const [index, setIndex] = useState(0);
  const ad = activeAds[index % Math.max(activeAds.length, 1)];

  useEffect(() => {
    if (activeAds.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => current + 1), 7000);
    return () => window.clearInterval(timer);
  }, [activeAds.length]);

  if (ad) {
    return (
      <Link className="banner-ad banner-ad-image" href={ad.targetUrl} target="_blank">
        <picture>
          {ad.mobileImageUrl && <source media="(max-width: 620px)" srcSet={ad.mobileImageUrl} />}
          <img src={ad.desktopImageUrl} alt={ad.title} />
        </picture>
        <span className="banner-ad-overlay">
          <small>AD SPACE</small>
          <b>{ad.title}</b>
          {ad.subtitle && <em>{ad.subtitle}</em>}
        </span>
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
