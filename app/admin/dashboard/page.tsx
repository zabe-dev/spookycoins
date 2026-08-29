import { SiteHeader } from '@/components/layout/site-header';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');
  if (session.user.role !== 'admin') notFound();

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container admin-dashboard" aria-label="Admin dashboard" />
    </main>
  );
}
