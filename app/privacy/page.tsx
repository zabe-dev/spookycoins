import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import type { Metadata } from 'next';
import '../market.css';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for SpookyCoins.',
  alternates: {
    canonical: '/privacy',
  },
};

const lastUpdated = 'September 4, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container legal-shell">
        <header className="legal-hero">
          <small>LEGAL</small>
          <h1>Privacy Policy</h1>
          <p>
            This page explains what SpookyCoins collects, why we collect it, and how we use it to
            keep the site useful, fair, and safer for crypto investors and project owners.
          </p>
          <span>Last updated: {lastUpdated}</span>
        </header>

        <div className="legal-card">
          <LegalSection title="Who we are">
            <p>
              SpookyCoins is a crypto discovery platform operated as <strong>spookycoins</strong>.
              For privacy questions, contact us at{' '}
              <a href="mailto:legal@spookycoins.com">legal@spookycoins.com</a>.
            </p>
            <p>
              <strong>Jurisdiction placeholder:</strong> replace this with the country/state where
              SpookyCoins is operated before launch.
            </p>
          </LegalSection>

          <LegalSection title="Information we collect">
            <p>We may collect information you give us directly, including:</p>
            <ul>
              <li>Account details such as name, email address, and login information.</li>
              <li>Coin submissions, logos, links, descriptions, contract details, and contacts.</li>
              <li>
                Mailing list emails submitted for updates, announcements, and campaign targeting.
              </li>
              <li>Votes, watchlists, reports, change requests, and other actions you take.</li>
              <li>Payment or order information for ads, boosts, and promoted placements.</li>
            </ul>
            <p>
              We may also collect technical information such as IP address, device/browser data,
              session activity, security events, and anti-spam verification results.
            </p>
          </LegalSection>

          <LegalSection title="How we use information">
            <p>We use information to operate SpookyCoins, including to:</p>
            <ul>
              <li>Create accounts and keep voting/watchlists working.</li>
              <li>Review submissions, reports, advertisements, boosts, and promoted coins.</li>
              <li>Send email updates, launch alerts, promotions, and SpookyCoins announcements.</li>
              <li>Display approved public project information on the site.</li>
              <li>Prevent spam, abuse, fake votes, fraud, and unsafe listings.</li>
              <li>Improve site performance, rankings, market data, and user experience.</li>
            </ul>
          </LegalSection>

          <LegalSection title="Public project information">
            <p>
              Approved coin pages may publicly show project details you submit, including logos,
              descriptions, categories, links, chain information, contract addresses, launch or
              presale details, KYC/audit links, votes, watchlist counts, and market data.
            </p>
          </LegalSection>

          <LegalSection title="Third-party services">
            <p>
              SpookyCoins may use third-party services for authentication, hosting, storage,
              databases, bot protection, market data, analytics, payments, and infrastructure.
            </p>
            <p>
              <strong>Service list placeholder:</strong> confirm the final providers before launch,
              such as Neon, Cloudflare R2, Mobula, Binance/proxy services, Cloudflare, Better Auth,
              analytics, and payment processors.
            </p>
          </LegalSection>

          <LegalSection title="How long we keep information">
            <p>
              We keep information as long as needed to operate the platform, keep records, prevent
              abuse, resolve disputes, comply with legal obligations, and maintain admin review
              history. You can contact us to request account or data deletion.
            </p>
          </LegalSection>

          <LegalSection title="Your choices">
            <p>
              You may request access, correction, or deletion of your personal information by
              emailing <a href="mailto:legal@spookycoins.com">legal@spookycoins.com</a>. Some
              information may need to be retained for security, legal, or platform integrity
              reasons.
            </p>
          </LegalSection>

          <LegalSection title="Age requirement">
            <p>
              SpookyCoins is intended only for users who are at least 18 years old. Do not use the
              site if you are under 18.
            </p>
          </LegalSection>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function LegalSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
