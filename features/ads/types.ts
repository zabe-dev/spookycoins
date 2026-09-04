export type BannerPlacement = 'premium' | 'wide' | 'coin-page';

export type PublicBannerAd = {
  id: string;
  placement: BannerPlacement;
  title: string;
  subtitle: string | null;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  targetUrl: string;
};

export type BannerAdMap = Record<BannerPlacement, PublicBannerAd[]>;

export const bannerPlacements = [
  'premium',
  'wide',
  'coin-page',
] as const satisfies readonly BannerPlacement[];

export const bannerPlacementLabels: Record<BannerPlacement, string> = {
  premium: 'Premium top banner',
  wide: 'Wide banner',
  'coin-page': 'Coin page banner',
};

export const legacyBannerPlacementMap: Record<string, BannerPlacement> = {
  'homepage-top': 'premium',
  'homepage-wide': 'wide',
  'homepage-faq-wide': 'wide',
  'site-bottom': 'wide',
  'coin-page-wide': 'wide',
};

export function normalizeBannerPlacement(value: string): BannerPlacement | null {
  if (bannerPlacements.includes(value as BannerPlacement)) return value as BannerPlacement;
  return legacyBannerPlacementMap[value] || null;
}
