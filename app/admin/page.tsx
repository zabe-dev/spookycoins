import { SiteHeader } from '@/components/layout/site-header';
import { getUserRole } from '@/lib/auth/roles';
import { currentUser } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

export default async function AdminPage() {
  const user = await currentUser();

  if (!user) redirect('/');

  const role = getUserRole([user.publicMetadata, user.privateMetadata]);
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
