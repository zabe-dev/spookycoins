import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Vyral — Community Crypto Discovery',
  description:
    'Discover early crypto projects, vote every 12 hours, and follow the signals communities create.',
  openGraph: {
    title: 'VYRAL — Find what’s moving next.',
    description: 'Community-powered crypto discovery.',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: 'VYRAL community-powered crypto discovery' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VYRAL — Find what’s moving next.',
    description: 'Community-powered crypto discovery.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
