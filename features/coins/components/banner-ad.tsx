'use client';

import Link from 'next/link';

export function BannerAd() {
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
