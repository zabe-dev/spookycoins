import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { InfoBand } from '@/components/layout/info-band';
import { SettingsPanel } from '@/features/settings/components/settings-panel';
import { auth } from '@/lib/auth/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import '../market.css';

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <SettingsPanel user={{ name: session.user.name, email: session.user.email }} />
      <InfoBand />
      <SiteFooter />
    </main>
  );
}
