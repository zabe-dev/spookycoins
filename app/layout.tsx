import type { Metadata } from 'next';
import { FixedAdBanner } from '@/features/ads/components/ad-banners';
import { getActiveBannerAds } from '@/features/ads/server/banner-ads';
import { Fira_Mono, JetBrains_Mono, Poppins, Space_Grotesk } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const firaMono = Fira_Mono({
  variable: '--font-fira-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://spookycoins.com'),
  title: {
    default: 'SpookyCoins — New Crypto Projects, Presales & Community Voting',
    template: '%s | SpookyCoins',
  },
  description:
    'Discover new crypto projects, token presales, trending coins, and weekly community-voted rankings across ETH, BSC, Solana, Base, Polygon, and more.',
  keywords: [
    'new crypto projects',
    'crypto voting',
    'crypto presales',
    'trending crypto coins',
    'new tokens',
    'meme coins',
    'DeFi tokens',
    'community crypto rankings',
    'crypto watchlist',
    'SpookyCoins',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SpookyCoins — New Crypto Projects, Presales & Community Voting',
    description:
      'Track early crypto projects, vote every 12 hours, follow watchlists, and discover weekly community signals before they get crowded.',
    url: '/',
    siteName: 'SpookyCoins',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpookyCoins — New Crypto Projects, Presales & Community Voting',
    description:
      'Discover new crypto projects, presales, trending coins, and weekly community-voted rankings.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bannerAds = await getActiveBannerAds();

  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${spaceGrotesk.variable} ${firaMono.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
        <FixedAdBanner ads={bannerAds.fixed} />
      </body>
    </html>
  );
}
