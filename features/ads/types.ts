export type BannerPlacement = 'homepage-top' | 'homepage-wide' | 'site-bottom' | 'coin-page-wide';

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
  'homepage-top',
  'homepage-wide',
  'site-bottom',
  'coin-page-wide',
] as const satisfies readonly BannerPlacement[];

export const bannerPlacementLabels: Record<BannerPlacement, string> = {
  'homepage-top': 'Homepage top rotating',
  'homepage-wide': 'Homepage wide banner',
  'site-bottom': 'Fixed bottom banner',
  'coin-page-wide': 'Coin page wide banner',
};
