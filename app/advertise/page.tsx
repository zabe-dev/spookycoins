import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { BoltIcon } from '@/features/coins/components';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Megaphone,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import type { Metadata } from 'next';
import '../market.css';
import './advertise.css';
import { SubmitProjectAction } from './submit-project-action';

export const metadata: Metadata = {
  title: 'Advertise Crypto Projects',
  description:
    'Advertise on SpookyCoins with Promoted Coin slots and Boost packages for listed crypto projects. Banner ad placements are paused for now.',
  alternates: {
    canonical: '/advertise',
  },
  openGraph: {
    title: 'Advertise Crypto Projects on SpookyCoins',
    description:
      'Promote listed crypto projects with Promoted Coin placements, Boost packages, and Golden Ticker visibility.',
    url: '/advertise',
  },
};

const promotedRates = [
  { duration: '1–2 days', discount: 'No discount', price: '$30/day' },
  { duration: '3–6 days', discount: '20% off', price: '$24/day' },
  { duration: '7–13 days', discount: '30% off', price: '$21/day' },
  { duration: '14+ days', discount: '40% off', price: '$18/day' },
];

const boostRates = [
  { package: '10×', price: '$39', multiplier: '×2', duration: '24 hours', extra: '—' },
  { package: '30×', price: '$89', multiplier: '×2', duration: '3 days', extra: '—' },
  { package: '50×', price: '$149', multiplier: '×3', duration: '24 hours', extra: '—' },
  { package: '100×', price: '$299', multiplier: '×3', duration: '3 days', extra: '—' },
  { package: '500×', price: '$799', multiplier: '×5', duration: '7 days', extra: 'Golden Ticker' },
];

const approvalSteps = [
  'Choose your project and promotion type.',
  'Message @SpookyCoinsSupport on Telegram.',
  'We manually review the placement request.',
  'Confirm the payment/order details.',
  'Approved promotions go live on the next available schedule.',
];

export default function AdvertisePage() {
  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container advertise-shell">
        <div className="advertise-hero">
          <p className="eyebrow">
            <span>●</span> Advertise on SpookyCoins
          </p>
          <h1>Reach crypto’s earliest project hunters.</h1>
          <p>
            SpookyCoins currently sells two promotion products: Promoted Coin slots and Boosts.
            Banner ad spaces are visible in the prototype, but they are paused and not available for
            self-serve purchase yet.
          </p>
          <div className="advertise-actions">
            <a className="advertise-primary" href="https://t.me/SpookyCoinsSupport">
              <MessageCircle aria-hidden="true" />
              Contact @SpookyCoinsSupport
            </a>
            <SubmitProjectAction />
          </div>
        </div>

        <div className="advertise-grid">
          <section className="advertise-card">
            <span className="advertise-card-icon">
              <Megaphone aria-hidden="true" />
            </span>
            <h2>Promoted Coins</h2>
            <p>
              Promoted Coin placement gives approved projects premium table visibility for the dates
              purchased. This is advertising inventory, not a safety endorsement.
            </p>
            <div className="advertise-table">
              {promotedRates.map((rate) => (
                <div key={rate.duration}>
                  <span>{rate.duration}</span>
                  <b>{rate.discount}</b>
                  <strong>{rate.price}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="advertise-card">
            <span className="advertise-card-icon bolt">
              <BoltIcon />
            </span>
            <h2>Boost packages</h2>
            <p>
              Boosts multiply a project’s displayed/ranking vote value for the purchased active
              period. Raw votes are never changed, and only one boost can be active per project.
            </p>
            <div className="advertise-boosts">
              {boostRates.map((rate) => (
                <div key={rate.package} className={rate.package === '500×' ? 'golden' : ''}>
                  <b>{rate.package}</b>
                  <span>{rate.price}</span>
                  <small>
                    {rate.multiplier} · {rate.duration}
                  </small>
                  {rate.extra !== '—' && <em>{rate.extra}</em>}
                </div>
              ))}
            </div>
            <div className="golden-ticker-preview" aria-label="Golden Ticker example">
              <span className="coin-dot">S</span>
              <strong className="gold-name gold-name-animated">SPOOKY</strong>
              <small>$SPKY</small>
              <span className="boost-badge boost-500">
                <BoltIcon />
                500×
              </span>
            </div>
          </section>
        </div>

        <section className="advertise-card advertise-wide">
          <div className="advertise-wide-copy">
            <span className="advertise-card-icon analytics">
              <Activity aria-hidden="true" />
            </span>
            <div>
              <h2>Advertiser analytics are in development.</h2>
              <p>
                We&apos;re building measured campaign reporting for future ad operations, so
                advertisers can understand placement performance through impressions, clicks, and
                campaign-level results instead of guessing what worked.
              </p>
              <p>
                For now, placements stay hands-on. Message us with your project, preferred
                promotion, and target dates, and we&apos;ll review the request manually before
                confirming the earliest available start time. Same-day starts are not guaranteed.
              </p>
            </div>
          </div>
          <ol className="approval-list" type="1">
            {approvalSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="advertise-policy">
          <div>
            <ShieldCheck aria-hidden="true" />
            <h2>Eligibility rules</h2>
            <p>
              The project must already be submitted/listed on SpookyCoins, must not be suspended,
              rejected, fraud-flagged, hidden, or under review, and must pass final manual approval.
            </p>
          </div>
          <div>
            <BarChart3 aria-hidden="true" />
            <h2>Banner ads are paused</h2>
            <p>
              Banner placements are not operational right now. If we reopen them later, they will
              require direct scheduling, creative review, and advertiser analytics.
            </p>
          </div>
          <div>
            <ArrowRight aria-hidden="true" />
            <h2>Golden Ticker</h2>
            <p>
              Give your project a premium Golden Ticker: a glowing orange/gold name treatment and a
              standout 500× badge that helps your coin feel impossible to miss while the boost is
              active.
            </p>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
