import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import {
  addPromotedCoin,
  grantCoinBoost,
  removeCoinBoost,
  removePromotedCoin,
  updateAdminCoin,
  updateAdminSubmission,
  updateAdminUser,
} from '@/app/admin/dashboard/actions';
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
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

const coinStatusOptions = ['active', 'hidden', 'suspended', 'rejected'];
const roleOptions = ['user', 'admin'];
const submissionStatusOptions = ['pending', 'in-review', 'needs-changes', 'approved', 'rejected'];
const boostPackages = [
  { value: 10, label: '10x package · votes ×2 · 24h' },
  { value: 30, label: '30x package · votes ×2 · 72h' },
  { value: 50, label: '50x package · votes ×3 · 24h' },
  { value: 100, label: '100x package · votes ×3 · 72h' },
  { value: 500, label: '500x package · votes ×5 · 168h' },
];
const promotedDurations = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');
  if (!hasAdminAccess(session.user.role)) notFound();

  const now = new Date();
  const [
    userRows,
    coinRows,
    pendingSubmissionRows,
    sessionRows,
    activeBoostRows,
    activePromotionRows,
    pendingSubmissionCount,
  ] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(50),
    db.select().from(coins).orderBy(desc(coins.updatedAt)).limit(50),
    db
      .select()
      .from(coinSubmissions)
      .where(
        and(eq(coinSubmissions.submissionType, 'new-coin'), eq(coinSubmissions.status, 'pending')),
      )
      .orderBy(desc(coinSubmissions.createdAt))
      .limit(50),
    db.select().from(sessions).orderBy(desc(sessions.updatedAt)).limit(500),
    db
      .select()
      .from(coinBoosts)
      .where(and(eq(coinBoosts.status, 'active'), gt(coinBoosts.expiresAt, now)))
      .orderBy(desc(coinBoosts.expiresAt)),
    db
      .select()
      .from(coinPromotions)
      .where(and(eq(coinPromotions.status, 'active'), gt(coinPromotions.expiresAt, now)))
      .orderBy(desc(coinPromotions.expiresAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(coinSubmissions)
      .where(eq(coinSubmissions.status, 'pending')),
  ]);

  const activeBoostByCoin = new Map(activeBoostRows.map((boost) => [boost.coinId, boost]));
  const activePromotionByCoin = new Map(
    activePromotionRows.map((promotion) => [promotion.coinId, promotion]),
  );
  const latestSessionByUser = new Map<string, (typeof sessionRows)[number]>();
  sessionRows.forEach((row) => {
    if (!latestSessionByUser.has(row.userId)) latestSessionByUser.set(row.userId, row);
  });

  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container admin-dashboard" aria-label="Admin dashboard">
        <header className="admin-dashboard-head">
          <p className="eyebrow">
            <span>●</span> Admin
          </p>
          <h1>Admin dashboard</h1>
          <p>Review incoming submissions, manage listed coins, and control promotion visibility.</p>
        </header>

        <div className="admin-dashboard-grid" aria-label="Admin summary">
          <SummaryCard label="Users" value={userRows.length} />
          <SummaryCard label="Coins" value={coinRows.length} />
          <SummaryCard label="Active boosts" value={activeBoostRows.length} />
          <SummaryCard label="Promoted coins" value={activePromotionRows.length} />
          <SummaryCard label="Pending submissions" value={pendingSubmissionCount[0]?.count || 0} />
        </div>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <div>
              <small>Review queue</small>
              <h2>Pending submissions</h2>
            </div>
            <span>{pendingSubmissionRows.length} pending</span>
          </div>
          <p className="admin-panel-note">
            These are submitted projects waiting for review. They are not public coins yet.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Chain</th>
                  <th>Submitted by</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingSubmissionRows.length ? (
                  pendingSubmissionRows.map((submission) => {
                    const data = readSubmissionData(submission.coinData);

                    return (
                      <tr key={submission.id}>
                        <td>
                          <strong>
                            {data.name} <em>{data.symbol ? `$${data.symbol}` : ''}</em>
                          </strong>
                          <span>{submission.id}</span>
                        </td>
                        <td>{data.isPresale ? 'Presale' : 'Launched'}</td>
                        <td>{data.chain || '—'}</td>
                        <td>
                          <strong>{submission.requesterTelegram || '—'}</strong>
                          <span>{submission.requesterEmail}</span>
                        </td>
                        <td>{formatDate(submission.createdAt)}</td>
                        <td>
                          <form action={updateAdminSubmission} className="admin-inline-form">
                            <input type="hidden" name="submissionId" value={submission.id} />
                            <select name="status" defaultValue={submission.status}>
                              {submissionStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <button type="submit">Update</button>
                          </form>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <span>No pending submissions right now.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <div>
              <small>Users</small>
              <h2>User management</h2>
            </div>
            <span>{userRows.length} latest</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last active</th>
                  <th>Last IP</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userRows.map((user) => {
                  const latestSession = latestSessionByUser.get(user.id);

                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </td>
                      <td>
                        <StatusPill tone={user.role === 'admin' ? 'lime' : 'neutral'}>
                          {user.role || 'user'}
                        </StatusPill>
                      </td>
                      <td>
                        <StatusPill tone={user.banned ? 'danger' : 'lime'}>
                          {user.banned ? 'Banned' : 'Active'}
                        </StatusPill>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{latestSession ? formatDateTime(latestSession.updatedAt) : '—'}</td>
                      <td>{latestSession?.ipAddress || '—'}</td>
                      <td>
                        <form
                          action={updateAdminUser}
                          className="admin-inline-form admin-user-form"
                        >
                          <input type="hidden" name="userId" value={user.id} />
                          <select name="role" defaultValue={user.role || 'user'}>
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <label className="admin-checkbox">
                            <input
                              name="banned"
                              type="checkbox"
                              defaultChecked={Boolean(user.banned)}
                            />
                            <span>Ban</span>
                          </label>
                          <input
                            name="banReason"
                            placeholder="Reason"
                            defaultValue={user.banReason || ''}
                          />
                          <button type="submit">Save</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-title">
            <div>
              <small>Coins</small>
              <h2>Listed coins</h2>
            </div>
            <span>{coinRows.length} latest</span>
          </div>
          <p className="admin-panel-note">
            These are public/listed coins. Use this area for status changes, boosts, and promoted
            placement.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Chain</th>
                  <th>Status</th>
                  <th>Promotion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coinRows.map((coin) => {
                  const activeBoost = activeBoostByCoin.get(coin.id);
                  const activePromotion = activePromotionByCoin.get(coin.id);

                  return (
                    <tr key={coin.id}>
                      <td>
                        <strong>
                          {coin.name} <em>${coin.symbol}</em>
                        </strong>
                        <span>#{coin.id}</span>
                      </td>
                      <td>{coin.chain || '—'}</td>
                      <td>
                        <StatusPill tone={coin.listingStatus === 'active' ? 'lime' : 'warning'}>
                          {coin.listingStatus}
                        </StatusPill>
                      </td>
                      <td>
                        <span>
                          Boost:{' '}
                          {activeBoost
                            ? `${formatBoostPackage(activeBoost.multiplier)} until ${formatDate(
                                activeBoost.expiresAt,
                              )}`
                            : 'none'}
                        </span>
                        <span>
                          Promoted:{' '}
                          {activePromotion
                            ? `priority ${activePromotion.priority} until ${formatDate(
                                activePromotion.expiresAt,
                              )}`
                            : 'none'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions-stack">
                          <form action={updateAdminCoin} className="admin-inline-form">
                            <input type="hidden" name="coinId" value={coin.id} />
                            <select name="listingStatus" defaultValue={coin.listingStatus}>
                              {coinStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <input
                              name="category"
                              placeholder="Category"
                              defaultValue={coin.category}
                            />
                            <button type="submit">Save coin</button>
                          </form>

                          <form action={grantCoinBoost} className="admin-inline-form">
                            <input type="hidden" name="coinId" value={coin.id} />
                            <select name="multiplier" defaultValue={50}>
                              {boostPackages.map((boost) => (
                                <option key={boost.value} value={boost.value}>
                                  {boost.label}
                                </option>
                              ))}
                            </select>
                            <input name="notes" placeholder="Boost notes" />
                            <button type="submit">Give boost</button>
                          </form>

                          <form action={addPromotedCoin} className="admin-inline-form">
                            <input type="hidden" name="coinId" value={coin.id} />
                            <select name="durationDays" defaultValue={7}>
                              {promotedDurations.map((duration) => (
                                <option key={duration.value} value={duration.value}>
                                  {duration.label}
                                </option>
                              ))}
                            </select>
                            <input
                              name="priority"
                              type="number"
                              min={1}
                              max={999}
                              defaultValue={1}
                              aria-label="Promoted priority"
                            />
                            <input name="notes" placeholder="Promoted notes" />
                            <button type="submit">Promote</button>
                          </form>

                          <div className="admin-remove-actions">
                            <form action={removeCoinBoost}>
                              <input type="hidden" name="coinId" value={coin.id} />
                              <button type="submit" disabled={!activeBoost}>
                                Remove boost
                              </button>
                            </form>
                            <form action={removePromotedCoin}>
                              <input type="hidden" name="coinId" value={coin.id} />
                              <button type="submit" disabled={!activePromotion}>
                                Remove promoted
                              </button>
                            </form>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'lime' | 'warning' | 'danger';
}) {
  return <span className={`admin-status-pill ${tone}`}>{children}</span>;
}

function readSubmissionData(value: unknown) {
  if (!isRecord(value)) {
    return {
      name: 'Untitled project',
      symbol: '',
      chain: '',
      isPresale: false,
    };
  }

  const basic = isRecord(value.basic) ? value.basic : null;
  const market = isRecord(value.market) ? value.market : null;

  return {
    name: readString(basic?.name) || readString(value.name) || 'Untitled project',
    symbol: readString(basic?.symbol) || readString(value.symbol) || '',
    chain: readString(market?.primaryChain) || readString(value.chain) || '',
    isPresale: readBoolean(basic?.isPresale) ?? readBoolean(value.isPresale) ?? false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function readBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
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

function formatBoostPackage(value: number) {
  const boost = boostPackages.find((item) => item.value === value);
  return boost?.label.split(' · ')[0] || `${value}x package`;
}
