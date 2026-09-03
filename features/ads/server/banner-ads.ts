import 'server-only';

import { unstable_cache } from 'next/cache';
import { asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { bannerAds } from '@/lib/db/schema';
import { bannerPlacements, type BannerAdMap, type BannerPlacement } from '@/features/ads/types';

const emptyBannerMap = (): BannerAdMap => ({
  'homepage-top': [],
  'homepage-wide': [],
  'homepage-faq-wide': [],
  'site-bottom': [],
  'coin-page-wide': [],
});

export const getActiveBannerAds = unstable_cache(
  async (): Promise<BannerAdMap> => {
    const nowIso = new Date().toISOString();
    const rows = await db
      .select()
      .from(bannerAds)
      .where(
        sql`${bannerAds.status} = 'active'
          and ${bannerAds.startsAt} <= ${nowIso}::timestamptz
          and (${bannerAds.expiresAt} is null or ${bannerAds.expiresAt} > ${nowIso}::timestamptz)`,
      )
      .orderBy(asc(bannerAds.priority), asc(bannerAds.createdAt))
      .catch((error) => {
        console.warn(
          '[banner-ads] Active banner lookup skipped:',
          error instanceof Error ? error.message : error,
        );
        return [];
      });

    const map = emptyBannerMap();

    rows.forEach((row) => {
      if (!isBannerPlacement(row.placement)) return;
      map[row.placement].push({
        id: row.id,
        placement: row.placement,
        title: row.title,
        subtitle: row.subtitle,
        desktopImageUrl: row.desktopImageUrl,
        mobileImageUrl: row.mobileImageUrl,
        targetUrl: row.targetUrl,
      });
    });

    return map;
  },
  ['active-banner-ads-v1'],
  { revalidate: 60, tags: ['banner-ads'] },
);

export async function getAdminBannerAds() {
  return db.select().from(bannerAds).orderBy(asc(bannerAds.placement), asc(bannerAds.priority));
}

export function isBannerPlacement(value: string): value is BannerPlacement {
  return bannerPlacements.includes(value as BannerPlacement);
}
