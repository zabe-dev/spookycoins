import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CoinSubmissionForm } from '@/features/submissions/components/coin-submission-form';
import { auth } from '@/lib/auth/server';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import '../market.css';
import './submit.css';

export const metadata: Metadata = {
  title: 'Submit a Crypto Project',
  description:
    'Submit a crypto project, token, or presale to SpookyCoins for review and future community voting.',
  alternates: {
    canonical: '/submit',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SubmitCoinPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/');

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <div className="container submission-shell">
        <CoinSubmissionForm userEmail={session.user.email || ''} />
      </div>
      <SiteFooter />
    </main>
  );
}
