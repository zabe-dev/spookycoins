import { SiteHeader } from '@/components/layout/site-header';
import { SettingsPanel } from '@/features/settings/components/settings-panel';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { accounts, coinSubmissions } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');

  const [signInMethods, submissions] = await Promise.all([
    db
      .select({ providerId: accounts.providerId })
      .from(accounts)
      .where(eq(accounts.userId, session.user.id)),
    db
      .select({
        id: coinSubmissions.id,
        coinId: coinSubmissions.coinId,
        status: coinSubmissions.status,
        submissionType: coinSubmissions.submissionType,
        coinData: coinSubmissions.coinData,
        createdAt: coinSubmissions.createdAt,
      })
      .from(coinSubmissions)
      .where(
        and(
          eq(coinSubmissions.requesterEmail, session.user.email),
          eq(coinSubmissions.submissionType, 'new-coin'),
        ),
      )
      .orderBy(desc(coinSubmissions.createdAt)),
  ]);

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <SettingsPanel
        user={{ name: session.user.name, email: session.user.email }}
        providers={[...new Set(signInMethods.map((method) => method.providerId))]}
        submissions={submissions.map((submission) => ({
          ...submission,
          createdAt: submission.createdAt.toISOString(),
          coinData: readCoinData(submission.coinData),
        }))}
      />
    </main>
  );
}

function readCoinData(value: unknown) {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  return {
    name: typeof record.name === 'string' ? record.name : undefined,
    symbol: typeof record.symbol === 'string' ? record.symbol : undefined,
    chain: typeof record.chain === 'string' ? record.chain : undefined,
  };
}
