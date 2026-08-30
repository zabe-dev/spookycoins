import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import {
  ArrowRight,
  Handshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import type { Metadata } from 'next';
import '../market.css';
import './partners.css';

export const metadata: Metadata = {
  title: 'Partners',
  description:
    'SpookyCoins is looking for crypto ecosystem partners, launchpads, communities, tools, and service providers.',
  alternates: {
    canonical: '/partners',
  },
  openGraph: {
    title: 'Partner with SpookyCoins',
    description:
      'SpookyCoins is looking for crypto ecosystem partners. Contact @CoinSpookySupport on Telegram if interested.',
    url: '/partners',
  },
};

const partnerTypes = [
  { label: 'Launchpads and presale platforms', icon: Sparkles },
  { label: 'KYC and audit providers', icon: ShieldCheck },
  { label: 'Crypto communities and media pages', icon: UsersRound },
  { label: 'DEX, chart, and data tooling teams', icon: ArrowRight },
  { label: 'Project service providers', icon: Handshake },
  { label: 'Ecosystem growth partners', icon: Sparkles },
];

export default function PartnersPage() {
  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container partners-shell">
        <div className="partners-hero">
          <p className="eyebrow">
            <span>●</span> Partners
          </p>
          <h1>Build with the next wave of crypto project hunters.</h1>
          <p>
            SpookyCoins is looking for aligned partners across discovery, launch, security, data,
            and community growth. If your product helps early crypto projects or the people finding
            them, we should talk.
          </p>
          <a className="partners-primary" href="https://t.me/CoinSpookySupport">
            <MessageCircle aria-hidden="true" />
            Contact @CoinSpookySupport
          </a>
        </div>

        <div className="partners-grid">
          {partnerTypes.map(({ label, icon: Icon }) => (
            <div key={label}>
              <span>
                <Icon aria-hidden="true" />
              </span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
