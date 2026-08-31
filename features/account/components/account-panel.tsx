'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { CircleHelp, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { useState } from 'react';

export type AccountSubmission = {
  id: string;
  coinId: number | null;
  status: string;
  submissionType: string;
  createdAt: string;
  coinData: { name?: string; symbol?: string; chain?: string };
};

export type AccountWatchedCoin = {
  coinId: number;
  name: string;
  symbol: string;
  chain: string | null;
  chainIcon: string | null;
  logoUrl: string | null;
  createdAt: string;
};

export function AccountPanel({
  email,
  userId,
  watchedCoins,
  submissions,
}: {
  email: string;
  userId: string;
  watchedCoins: AccountWatchedCoin[];
  submissions: AccountSubmission[];
}) {
  const [notice, setNotice] = useState('');
  const watchlistPath = `/watchlist/${userId}`;

  async function copyWatchlistUrl() {
    const watchlistUrl = `${window.location.origin}${watchlistPath}`;
    await navigator.clipboard.writeText(watchlistUrl);
    setNotice('Watchlist link copied.');
  }

  return (
    <section className="container settings-shell account-shell">
      <header className="account-heading">
        <p className="eyebrow">
          <span>●</span> User area
        </p>
        <h1>Dashboard</h1>
        <p>
          Hello, {email}. Your watched coins and submitted projects will live here as the account
          area grows.
        </p>
      </header>

      {notice && (
        <div className="settings-notice account-notice" role="status">
          {notice}
        </div>
      )}

      <section className="settings-card submissions-card">
        <div className="settings-card-title">
          <div>
            <small>Watchlist</small>
            <h2>Watched coins</h2>
          </div>
          <div className="settings-card-actions">
            <button type="button" onClick={() => void copyWatchlistUrl()}>
              <Copy aria-hidden="true" />
              Copy public link
            </button>
            <span>{watchedCoins.length}</span>
          </div>
        </div>
        {watchedCoins.length ? (
          <div className="watchlist-table-wrap">
            <table className="watchlist-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Chain</th>
                  <th>Saved</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {watchedCoins.map((coin) => (
                  <WatchedCoinRow key={coin.coinId} coin={coin} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="settings-empty">
            <strong>No watched coins yet</strong>
            <p>Coins you add to your watchlist will appear here.</p>
          </div>
        )}
      </section>

      <section className="settings-card submissions-card">
        <div className="settings-card-title">
          <div>
            <small>Listings</small>
            <h2>Coins you submitted</h2>
          </div>
          <span>{submissions.length}</span>
        </div>
        {submissions.length ? (
          <div className="submission-list">
            {submissions.map((submission) => (
              <SubmissionRow key={submission.id} submission={submission} onNotice={setNotice} />
            ))}
          </div>
        ) : (
          <div className="settings-empty">
            <strong>No coin submissions yet</strong>
            <p>Your submitted coins will appear here.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function WatchedCoinRow({ coin }: { coin: AccountWatchedCoin }) {
  const initials =
    (coin.symbol || coin.name)
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 2)
      .toUpperCase() || 'SC';

  return (
    <tr>
      <td>
        <div className="submission-coin">
          <span>{coin.logoUrl ? <img src={coin.logoUrl} alt="" /> : initials}</span>
          <div>
            <strong>{coin.name}</strong>
            <small>{coin.symbol || '—'}</small>
          </div>
        </div>
      </td>
      <td>
        <span className="watchlist-chain-logo" title={coin.chain || 'Chain not set'}>
          {coin.chainIcon ? <img src={coin.chainIcon} alt="" /> : <CircleHelp aria-hidden="true" />}
        </span>
      </td>
      <td>{new Date(coin.createdAt).toLocaleDateString()}</td>
      <td>
        <Link
          className="submission-icon-action"
          href={`/coin/${coin.coinId}`}
          aria-label={`View ${coin.name}`}
          title={`View ${coin.name}`}
        >
          <ExternalLink aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}

export function PublicWatchlistTable({ coins }: { coins: AccountWatchedCoin[] }) {
  return (
    <div className="watchlist-table-wrap">
      <table className="watchlist-table">
        <thead>
          <tr>
            <th>Coin</th>
            <th>Chain</th>
            <th>Saved</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <WatchedCoinRow key={coin.coinId} coin={coin} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubmissionRow({
  submission,
  onNotice,
}: {
  submission: AccountSubmission;
  onNotice: (message: string) => void;
}) {
  const name = submission.coinData.name || `Submission ${submission.id.slice(0, 8)}`;

  async function requestDelete() {
    if (
      !window.confirm(
        `Request deletion of ${name}? The coin will be suspended now and scheduled for deletion in 24 hours.`,
      )
    )
      return;
    onNotice('Sending request…');
    const response = await fetch(`/api/coin-submissions/${submission.id}/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'delete' }),
    });
    const body = await response.json().catch(() => ({}));
    onNotice(
      response.ok
        ? 'Deletion request sent. The coin is now suspended and scheduled for deletion in 24 hours.'
        : body.message || body.errorMessage || 'Could not send the request.',
    );
  }

  return (
    <article className="submission-row">
      <div className="submission-coin">
        <span>{(submission.coinData.symbol || name).slice(0, 2).toUpperCase()}</span>
        <div>
          <strong>{name}</strong>
          <small>
            {submission.coinData.symbol || '—'} · {submission.coinData.chain || 'Chain not set'} ·{' '}
            {new Date(submission.createdAt).toLocaleDateString()}
          </small>
        </div>
      </div>
      <span className={`submission-status status-${submission.status}`}>{submission.status}</span>
      <div className="submission-actions">
        {submission.coinId && (
          <Link
            className="submission-icon-action"
            href={`/coin/${submission.coinId}`}
            aria-label={`View ${name}`}
            title={`View ${name}`}
          >
            <ExternalLink aria-hidden="true" />
          </Link>
        )}
        <button
          className="delete-request submission-icon-action"
          type="button"
          onClick={() => void requestDelete()}
          aria-label={`Request deletion for ${name}`}
          title={`Request deletion for ${name}`}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
