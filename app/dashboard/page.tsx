import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AccountPanel } from '@/features/account/components/account-panel';
import { processExpiredCoinDeletionRequests } from '@/features/coins/server/delete-requests';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import { coinSubmissions } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import '../market.css';
import '../scroll-fix.css';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');

  await processExpiredCoinDeletionRequests();

  const submissions = await db
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
    .orderBy(desc(coinSubmissions.createdAt));

  const deletionRequests = await db
    .select({
      coinId: coinSubmissions.coinId,
      coinData: coinSubmissions.coinData,
    })
    .from(coinSubmissions)
    .where(
      and(
        eq(coinSubmissions.requesterEmail, session.user.email),
        eq(coinSubmissions.submissionType, 'delete-request'),
        eq(coinSubmissions.status, 'pending'),
      ),
    )
    .orderBy(desc(coinSubmissions.createdAt));

  const pendingDeletionBySubmissionId = new Map<string, string>();
  const pendingDeletionByCoinId = new Map<number, string>();
  deletionRequests.forEach((request) => {
    const data = readDeleteRequestData(request.coinData);
    if (!data.scheduledDeleteAt) return;
    if (data.sourceSubmissionId) {
      pendingDeletionBySubmissionId.set(data.sourceSubmissionId, data.scheduledDeleteAt);
    }
    if (typeof request.coinId === 'number') {
      pendingDeletionByCoinId.set(request.coinId, data.scheduledDeleteAt);
    }
  });

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <AccountPanel
        submissions={submissions.map((submission) => ({
          ...submission,
          baseStatus: submission.status,
          status:
            pendingDeletionBySubmissionId.has(submission.id) ||
            (typeof submission.coinId === 'number' &&
              pendingDeletionByCoinId.has(submission.coinId))
              ? 'suspended'
              : submission.status,
          createdAt: submission.createdAt.toISOString(),
          coinData: readCoinData(submission.coinData),
          scheduledDeleteAt:
            pendingDeletionBySubmissionId.get(submission.id) ||
            (typeof submission.coinId === 'number'
              ? pendingDeletionByCoinId.get(submission.coinId)
              : undefined),
        }))}
      />
      <SiteFooter />
    </main>
  );
}

function readCoinData(value: unknown) {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const basic = isRecord(record.basic) ? record.basic : null;
  const market = isRecord(record.market) ? record.market : null;

  return {
    name: readString(basic?.name) || readString(record.name),
    symbol: readString(basic?.symbol) || readString(record.symbol),
    chain: readString(market?.primaryChain) || readString(record.chain),
  };
}

function readDeleteRequestData(value: unknown) {
  if (!isRecord(value)) return {};
  return {
    sourceSubmissionId: readString(value.sourceSubmissionId),
    scheduledDeleteAt: readString(value.scheduledDeleteAt),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}
