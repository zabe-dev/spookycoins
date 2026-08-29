import { SiteHeader } from '@/components/layout/site-header';
import { CoinSubmissionForm } from '@/features/submissions/components/coin-submission-form';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import '../market.css';
import './submit.css';

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
    </main>
  );
}
