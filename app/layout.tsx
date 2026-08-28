import type { Metadata } from 'next';
import { Fira_Mono, Poppins, Space_Grotesk } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
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

export const metadata: Metadata = {
  title: 'SpookyCoins — Community Crypto Discovery',
  description:
    'Discover early crypto coins, vote every 12 hours, and follow the signals communities create.',
  openGraph: {
    title: 'SpookyCoins — Find what’s moving next.',
    description: 'Community-powered crypto discovery.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpookyCoins — Find what’s moving next.',
    description: 'Community-powered crypto discovery.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${poppins.variable} ${spaceGrotesk.variable} ${firaMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
