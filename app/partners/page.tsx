import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import {
  CalendarClock,
  ChartLine,
  MessageCircle,
  Network,
  ShieldCheck,
  UsersRound,
  Wrench,
} from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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
          <PartnerType label="Launchpads and presale platforms">
            <CalendarClock aria-hidden="true" />
          </PartnerType>
          <PartnerType label="KYC and audit providers">
            <ShieldCheck aria-hidden="true" />
          </PartnerType>
          <PartnerType label="Crypto communities and media pages">
            <UsersRound aria-hidden="true" />
          </PartnerType>
          <PartnerType label="DEX, chart, and data tooling teams">
            <ChartLine aria-hidden="true" />
          </PartnerType>
          <PartnerType label="Project service providers">
            <Wrench aria-hidden="true" />
          </PartnerType>
          <PartnerType label="Ecosystem growth partners">
            <Network aria-hidden="true" />
          </PartnerType>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function PartnerType({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <span>{children}</span>
      <strong>{label}</strong>
    </div>
  );
}
