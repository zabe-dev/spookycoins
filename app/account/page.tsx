import { SiteHeader } from '@/components/layout/site-header';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/');

  const email = session.user.email || 'signed-in user';
  const role = session.user.role || 'user';

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container protected-shell">
        <p className="eyebrow">
          <span>●</span> Signed user page
        </p>
        <h1>Hello, {email}</h1>
        <p>Your current role is {role}. This page is protected for signed-in users only.</p>
      </section>
    </main>
  );
}
