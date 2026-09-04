'use client';

/* eslint-disable @next/next/no-img-element -- Ad creatives need plain desktop/mobile images that scale by container width without Next image sizing constraints. */
import type { PublicBannerAd } from '@/features/ads/types';
import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

type BannerProps = {
  ads?: PublicBannerAd[];
  offset?: number;
};

function useSelectedAd(ads: PublicBannerAd[] = [], offset = 0, rotating = false) {
  const activeAds = useMemo(() => ads.filter((ad) => ad.desktopImageUrl), [ads]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!rotating || activeAds.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => current + 1), 7000);
    return () => window.clearInterval(timer);
  }, [activeAds.length, rotating]);

  if (activeAds.length === 0) return null;
  return activeAds[(index + offset) % activeAds.length] ?? activeAds[0];
}

function AdBadge() {
  return <span className="ad-creative-badge">Ad</span>;
}

function AdPicture({ ad }: { ad: PublicBannerAd }) {
  return (
    <span className="ad-banner-media" aria-label={ad.title || 'Advertisement'}>
      <img
        className="ad-banner-img ad-banner-img--desktop"
        src={ad.desktopImageUrl}
        alt={ad.title || 'Advertisement'}
      />
      <img
        className="ad-banner-img ad-banner-img--mobile"
        src={ad.mobileImageUrl || ad.desktopImageUrl}
        alt=""
        aria-hidden="true"
      />
    </span>
  );
}

function BasicBannerSlot({ ad, slot = 'primary' }: { ad: PublicBannerAd | null; slot?: string }) {
  if (ad) {
    return (
      <Link
        className={`basic-ad-banner basic-ad-banner--${slot} ad-banner-image`}
        href={ad.targetUrl}
        target="_blank"
      >
        <AdBadge />
        <AdPicture ad={ad} />
      </Link>
    );
  }

  return (
    <div className={`basic-ad-banner basic-ad-banner--${slot}`}>
      <small>AD SPACE</small>
      <div className="ad-placeholder-copy">
        <b>Reach crypto&apos;s earliest coin hunters.</b>
        <span>Premium inventory · Measured impressions and clicks</span>
      </div>
      <Link href="/advertise">View ad packages ↗</Link>
    </div>
  );
}

export function BasicAdBannerPair({ ads = [], offset = 0 }: BannerProps) {
  const firstAd = useSelectedAd(ads, offset, true);
  const secondAd = useSelectedAd(ads, offset + 1, true);

  return (
    <div className="container basic-ad-grid">
      <BasicBannerSlot ad={firstAd} slot="primary" />
      <BasicBannerSlot ad={secondAd} slot="secondary" />
    </div>
  );
}

export function PremiumAdBanner({ ads = [], offset = 0 }: BannerProps) {
  const ad = useSelectedAd(ads, offset, false);

  if (ad) {
    return (
      <Link
        className="container premium-ad-banner ad-banner-image"
        href={ad.targetUrl}
        target="_blank"
      >
        <AdBadge />
        <AdPicture ad={ad} />
      </Link>
    );
  }

  return (
    <div className="container premium-ad-banner">
      <small>PREMIUM ADVERTISEMENT</small>
      <div>
        <b>Reach crypto&apos;s earliest coin hunters.</b>
        <span>Premium inventory · Measured impressions and clicks</span>
      </div>
      <Link href="/advertise">View ad packages ↗</Link>
    </div>
  );
}

export function FixedFooterBanner({ ads = [], offset = 0 }: BannerProps) {
  const ad = useSelectedAd(ads, offset, false);
  const visibleFromStorage = useSyncExternalStore(
    subscribeFixedAdStorage,
    getFixedAdSnapshot,
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  const visible = visibleFromStorage && !dismissed;

  if (!visible) return null;

  return (
    <aside className="fixed-footer-ad-banner">
      <div className="fixed-footer-ad-banner-inner">
        {ad ? (
          <Link className="fixed-footer-ad-banner-creative" href={ad.targetUrl} target="_blank">
            <AdBadge />
            <AdPicture ad={ad} />
          </Link>
        ) : (
          <div className="fixed-footer-ad-banner-placeholder">
            <div className="fixed-footer-ad-banner-placeholder-inner">
              <small>AD SPACE</small>
              <b>SPOOKY</b>
              <span>Reach crypto&apos;s earliest coin hunters.</span>
              <Link href="/advertise">View ad packages ↗</Link>
            </div>
          </div>
        )}
        <button
          className="fixed-footer-ad-banner-close"
          type="button"
          onClick={() => {
            window.localStorage.setItem('spooky-fixed-footer-ad-closed', '1');
            setDismissed(true);
          }}
          aria-label="Close ad"
        >
          ×
        </button>
      </div>
    </aside>
  );
}

function subscribeFixedAdStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getFixedAdSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('spooky-fixed-footer-ad-closed') !== '1';
}
