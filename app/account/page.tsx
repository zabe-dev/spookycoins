import { SiteHeader } from '@/components/layout/site-header';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const user = await currentUser();

  if (!user) redirect('/');

  const email = user.primaryEmailAddress?.emailAddress || 'signed-in user';
  const role = String(user.publicMetadata.role || 'user');

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
