import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SettingsPanel } from '@/features/settings/components/settings-panel';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <SettingsPanel user={{ name: session.user.name, email: session.user.email }} />
      <SiteFooter />
    </main>
  );
}
