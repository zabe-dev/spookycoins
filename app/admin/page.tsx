import { SiteHeader } from '@/components/layout/site-header';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/');

  const role = session.user.role || 'user';
  if (role !== 'admin') notFound();

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container protected-shell">
        <p className="eyebrow">
          <span>●</span> Admin page
        </p>
        <h1>Hello, admin</h1>
        <p>This page is protected for signed-in users with the admin role.</p>
      </section>
    </main>
  );
}
