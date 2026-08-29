import { SiteHeader } from '@/components/layout/site-header';
import { auth } from '@/lib/auth/server';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Watchlist',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/');

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container protected-shell">
        <p className="eyebrow">
          <span>●</span> Watchlist
        </p>
        <h1>Your watched coins</h1>
        <p>
          Hello, {session.user.email}. Your saved projects will appear here once watchlists are
          connected to the database.
        </p>
      </section>
    </main>
  );
}
