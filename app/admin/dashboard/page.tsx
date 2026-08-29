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
      <section className="container admin-dashboard" aria-label="Admin dashboard">
        <p className="eyebrow">
          <span>●</span> Admin
        </p>
        <h1>Admin dashboard</h1>
        <p>
          Review queues, promotion orders, boosts, reports, and moderation tools will live here.
          RBAC is still being finalized, so this page is intentionally minimal for now.
        </p>
        <div className="admin-dashboard-grid">
          <div>
            <strong>Submissions</strong>
            <span>Pending review queue</span>
          </div>
          <div>
            <strong>Boosts</strong>
            <span>Payment and activation queue</span>
          </div>
          <div>
            <strong>Promoted coins</strong>
            <span>Scheduling and expirations</span>
          </div>
          <div>
            <strong>Reports</strong>
            <span>Abuse and safety triage</span>
          </div>
        </div>
      </section>
    </main>
  );
}
