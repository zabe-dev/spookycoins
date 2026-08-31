import { AdminDashboardClient } from '@/app/admin/dashboard/admin-dashboard-client';
import type {
  AdminCoinRow,
  AdminSubmissionRow,
  AdminSummary,
  AdminUserRow,
} from '@/app/admin/dashboard/admin-dashboard-client';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { NETWORKS } from '@/features/coins/networks';
import { processExpiredCoinDeletionRequests } from '@/features/coins/server/delete-requests';
import { hasAdminAccess } from '@/lib/auth/roles';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db/client';
import {
  coinBoosts,
  coinPromotions,
  coins,
  coinSubmissions,
  sessions,
  users,
} from '@/lib/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');
  if (!hasAdminAccess(session.user.role)) notFound();

  await processExpiredCoinDeletionRequests();

  const now = new Date();
  const nowIso = now.toISOString();
  const [
    userRows,
    coinRows,
    submissionRows,
    sessionRows,
    activeBoostRows,
    activePromotionRows,
    userCountRows,
    coinCountRows,
    activeBoostCoinCountRows,
    activePromotionCoinCountRows,
    pendingSubmissionCount,
  ] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(200),
    db.select().from(coins).orderBy(desc(coins.submittedAt)).limit(200),
    db.select().from(coinSubmissions).orderBy(desc(coinSubmissions.createdAt)).limit(500),
    db.select().from(sessions).orderBy(desc(sessions.updatedAt)).limit(1000),
    db
      .select()
      .from(coinBoosts)
      .where(
        and(eq(coinBoosts.status, 'active'), sql`${coinBoosts.expiresAt} > ${nowIso}::timestamptz`),
      )
      .orderBy(desc(coinBoosts.expiresAt)),
    db
      .select()
      .from(coinPromotions)
      .where(
        and(
          eq(coinPromotions.status, 'active'),
          sql`${coinPromotions.expiresAt} > ${nowIso}::timestamptz`,
        ),
      )
      .orderBy(desc(coinPromotions.expiresAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(coins),
    db
      .select({ count: sql<number>`count(distinct ${coinBoosts.coinId})::int` })
      .from(coinBoosts)
      .where(
        and(eq(coinBoosts.status, 'active'), sql`${coinBoosts.expiresAt} > ${nowIso}::timestamptz`),
      ),
    db
      .select({ count: sql<number>`count(distinct ${coinPromotions.coinId})::int` })
      .from(coinPromotions)
      .where(
        and(
          eq(coinPromotions.status, 'active'),
          sql`${coinPromotions.expiresAt} > ${nowIso}::timestamptz`,
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(coinSubmissions)
      .where(
        and(eq(coinSubmissions.submissionType, 'new-coin'), eq(coinSubmissions.status, 'pending')),
      ),
  ]);

  const userById = new Map(userRows.map((user) => [user.id, user]));
  const latestSessionByUser = new Map<string, (typeof sessionRows)[number]>();
  sessionRows.forEach((row) => {
    if (!latestSessionByUser.has(row.userId)) latestSessionByUser.set(row.userId, row);
  });

  const submissionsByCoinId = new Map<number, (typeof submissionRows)[number]>();
  submissionRows.forEach((submission) => {
    if (submission.coinId && !submissionsByCoinId.has(submission.coinId)) {
      submissionsByCoinId.set(submission.coinId, submission);
    }
  });

  const submittedCountsByUser = new Map<string, number>();
  submissionRows.forEach((submission) => {
    if (!submission.submittedByUserId) return;
    submittedCountsByUser.set(
      submission.submittedByUserId,
      (submittedCountsByUser.get(submission.submittedByUserId) || 0) + 1,
    );
  });

  const activeBoostByCoin = new Map(activeBoostRows.map((boost) => [boost.coinId, boost]));
  const activePromotionByCoin = new Map(
    activePromotionRows.map((promotion) => [promotion.coinId, promotion]),
  );

  const pendingSubmissions: AdminSubmissionRow[] = submissionRows
    .filter(
      (submission) => submission.submissionType === 'new-coin' && submission.status === 'pending',
    )
    .map((submission) => {
      const data = readSubmissionData(submission.coinData);
      const submitter = submission.submittedByUserId
        ? userById.get(submission.submittedByUserId)
        : null;

      return {
        id: submission.id,
        logoUrl: data.logoUrl,
        name: data.name,
        symbol: data.symbol,
        chain: formatChain(data.chain),
        submittedBy: submitter?.name || submitter?.email || submission.requesterEmail,
        contactEmail: submission.requesterEmail,
        contactTelegram: submission.requesterTelegram || data.contactTelegram,
        submittedAt: formatDateTime(submission.createdAt),
        status: submission.status,
        flag: buildSubmissionFlag(data),
      };
    });

  const listedCoins: AdminCoinRow[] = coinRows.map((coin) => {
    const submission = submissionsByCoinId.get(coin.id);
    const submissionData = submission ? readSubmissionData(submission.coinData) : null;
    const submitter = submission?.submittedByUserId
      ? userById.get(submission.submittedByUserId)
      : null;
    const boost = activeBoostByCoin.get(coin.id);
    const promotion = activePromotionByCoin.get(coin.id);

    return {
      id: coin.id,
      logoUrl: coin.logoUrl || submissionData?.logoUrl || null,
      name: coin.name,
      symbol: coin.symbol,
      chain: formatChain(coin.chain || submissionData?.chain || ''),
      submittedBy: submitter?.name || submitter?.email || submission?.requesterEmail || '—',
      contactEmail: submission?.requesterEmail || '—',
      contactTelegram: submission?.requesterTelegram || submissionData?.contactTelegram || '—',
      submittedAt: formatDateTime(coin.submittedAt),
      status: coin.listingStatus,
      category: coin.category,
      boost: boost
        ? {
            tier: boost.multiplier,
            status: 'Active',
            expiresAt: boost.expiresAt.toISOString(),
            remaining: formatTimeRemaining(boost.expiresAt, now),
          }
        : null,
      promotion: promotion
        ? {
            status: 'Active',
            priority: promotion.priority,
            expiresAt: promotion.expiresAt.toISOString(),
            remaining: formatTimeRemaining(promotion.expiresAt, now),
          }
        : null,
    };
  });

  const adminUsers: AdminUserRow[] = userRows.map((user) => {
    const latestSession = latestSessionByUser.get(user.id);

    return {
      id: user.id,
      avatar: emailInitials(user.email),
      avatarTone: emailTone(user.email),
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      status: user.banned ? 'suspended' : 'active',
      projectsSubmitted: submittedCountsByUser.get(user.id) || 0,
      joinedAt: formatDateTime(user.createdAt),
      lastActive: latestSession ? formatDateTime(latestSession.updatedAt) : '—',
      lastIp: latestSession?.ipAddress || '—',
    };
  });

  const summary: AdminSummary = {
    users: readCount(userCountRows),
    coins: readCount(coinCountRows),
    activeBoosts: readCount(activeBoostCoinCountRows),
    promotedCoins: readCount(activePromotionCoinCountRows),
    pendingSubmissions: readCount(pendingSubmissionCount),
  };

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container admin-dashboard" aria-label="Admin dashboard">
        <header className="admin-dashboard-head">
          <p className="eyebrow">
            <span>●</span> Admin
          </p>
          <h1>Admin dashboard</h1>
          <p>Review submissions, manage listed coins, and control boosts or promotions.</p>
        </header>

        <AdminDashboardClient
          summary={summary}
          pendingSubmissions={pendingSubmissions}
          listedCoins={listedCoins}
          users={adminUsers}
        />
      </section>
      <SiteFooter />
    </main>
  );
}

function readSubmissionData(value: unknown) {
  if (!isRecord(value)) {
    return {
      name: 'Untitled project',
      symbol: '',
      chain: '',
      logoUrl: null,
      contactTelegram: '',
      auditUrl: '',
    };
  }

  const basic = isRecord(value.basic) ? value.basic : null;
  const logo = isRecord(basic?.logo) ? basic.logo : null;
  const market = isRecord(value.market) ? value.market : null;
  const contact = isRecord(value.contact) ? value.contact : null;
  const security = isRecord(value.security) ? value.security : null;

  return {
    name: readString(basic?.name) || readString(value.name) || 'Untitled project',
    symbol: readString(basic?.symbol) || readString(value.symbol) || '',
    chain: readString(market?.primaryChain) || readString(value.chain) || '',
    logoUrl: readString(logo?.url) || readString(value.logoUrl) || null,
    contactTelegram: readString(contact?.telegram) || '',
    auditUrl: readString(security?.auditUrl) || '',
  };
}

function buildSubmissionFlag(data: ReturnType<typeof readSubmissionData>) {
  if (!data.auditUrl) return '';
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function readCount(rows: Array<{ count: number | string | bigint }>) {
  return Number(rows[0]?.count || 0);
}

function formatChain(value: string) {
  if (!value) return '';
  return NETWORKS[value as keyof typeof NETWORKS]?.shortName || value;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatTimeRemaining(expiresAt: Date, now: Date) {
  const milliseconds = Math.max(0, expiresAt.getTime() - now.getTime());
  const hours = Math.ceil(milliseconds / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainder = hours % 24;
  return remainder ? `${days}d ${remainder}h` : `${days}d`;
}

function emailInitials(email: string) {
  return (
    email
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 2)
      .toUpperCase() || 'SC'
  );
}

function emailTone(email: string) {
  const total = Array.from(email).reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  return (total % 6) + 1;
}
