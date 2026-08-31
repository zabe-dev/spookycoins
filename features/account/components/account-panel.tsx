'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import {
  CircleHelp,
  Clock3,
  Copy,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export type AccountSubmission = {
  id: string;
  coinId: number | null;
  status: string;
  baseStatus?: string;
  submissionType: string;
  createdAt: string;
  coinData: { name?: string; symbol?: string; chain?: string };
  scheduledDeleteAt?: string;
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
  const [deleteModal, setDeleteModal] = useState<AccountSubmission | null>(null);
  const [deletionOverrides, setDeletionOverrides] = useState<Record<string, string | null>>({});
  const watchlistPath = `/watchlist/${userId}`;
  const listingRows = submissions.map((submission) => {
    if (!(submission.id in deletionOverrides)) return submission;
    const scheduledDeleteAt = deletionOverrides[submission.id];
    return scheduledDeleteAt
      ? { ...submission, status: 'suspended', scheduledDeleteAt }
      : {
          ...submission,
          status: submission.baseStatus || 'approved',
          scheduledDeleteAt: undefined,
        };
  });

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
            {listingRows.map((submission) => (
              <SubmissionRow
                key={submission.id}
                submission={submission}
                onRequestDelete={setDeleteModal}
              />
            ))}
          </div>
        ) : (
          <div className="settings-empty">
            <strong>No coin submissions yet</strong>
            <p>Your submitted coins will appear here.</p>
          </div>
        )}
      </section>
      {deleteModal && (
        <DeleteSubmissionModal
          submission={deleteModal}
          onClose={() => setDeleteModal(null)}
          onNotice={setNotice}
          onScheduled={(scheduledDeleteAt) => {
            setDeletionOverrides((current) => ({
              ...current,
              [deleteModal.id]: scheduledDeleteAt,
            }));
            setDeleteModal((current) =>
              current ? { ...current, status: 'suspended', scheduledDeleteAt } : current,
            );
          }}
          onCancelled={() => {
            setDeletionOverrides((current) => ({ ...current, [deleteModal.id]: null }));
            setDeleteModal(null);
            setNotice('Deletion request cancelled. The coin is active again.');
          }}
        />
      )}
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
  onRequestDelete,
}: {
  submission: AccountSubmission;
  onRequestDelete: (submission: AccountSubmission) => void;
}) {
  const name = submission.coinData.name || `Submission ${submission.id.slice(0, 8)}`;
  const deleteRequested = Boolean(submission.scheduledDeleteAt);

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
          onClick={() => onRequestDelete(submission)}
          aria-label={
            deleteRequested ? `View deletion countdown for ${name}` : `Request deletion for ${name}`
          }
          title={
            deleteRequested ? `View deletion countdown for ${name}` : `Request deletion for ${name}`
          }
        >
          {deleteRequested ? <Clock3 aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
        </button>
      </div>
    </article>
  );
}

function DeleteSubmissionModal({
  submission,
  onClose,
  onNotice,
  onScheduled,
  onCancelled,
}: {
  submission: AccountSubmission;
  onClose: () => void;
  onNotice: (message: string) => void;
  onScheduled: (scheduledDeleteAt: string) => void;
  onCancelled: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const scheduledDeleteAt = submission.scheduledDeleteAt || '';
  const countdown = useCountdown(scheduledDeleteAt);
  const name = submission.coinData.name || `Submission ${submission.id.slice(0, 8)}`;
  const alreadyScheduled = Boolean(scheduledDeleteAt);

  async function requestDelete() {
    onNotice('Sending request…');
    setDeleting(true);
    const response = await fetch(`/api/coin-submissions/${submission.id}/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'delete' }),
    });
    const body = await response.json().catch(() => ({}));
    setDeleting(false);

    if (response.ok) {
      const nextScheduledDeleteAt =
        body.data?.scheduledDeleteAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      onScheduled(nextScheduledDeleteAt);
      onNotice('Deletion request sent. The coin is suspended and will be deleted in 24 hours.');
      return;
    }

    onNotice(body.message || body.errorMessage || 'Could not send the deletion request.');
  }

  async function cancelDelete() {
    onNotice('Cancelling deletion…');
    setCancelling(true);
    const response = await fetch(`/api/coin-submissions/${submission.id}/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'cancel-delete' }),
    });
    const body = await response.json().catch(() => ({}));
    setCancelling(false);

    if (response.ok) {
      onCancelled();
      return;
    }

    onNotice(body.message || body.errorMessage || 'Could not cancel the deletion request.');
  }

  return (
    <div className="account-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="account-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-submission-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="account-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close deletion request"
        >
          <X aria-hidden="true" />
        </button>
        <div className="account-modal-icon danger">
          <Trash2 aria-hidden="true" />
        </div>
        <h2 id="delete-submission-title">Delete this submitted coin?</h2>
        <p>
          {alreadyScheduled
            ? `${name} is already suspended and queued for permanent deletion.`
            : `${name} will be suspended right away, then permanently deleted after 24 hours.`}
        </p>
        <div className="account-countdown-card">
          <span>{alreadyScheduled ? 'Time before deletion' : 'Deletion window'}</span>
          <strong>{alreadyScheduled ? countdown : '24 hours'}</strong>
        </div>
        <div className="account-modal-actions">
          <button type="button" className="account-secondary-action" onClick={onClose}>
            Close
          </button>
          {!alreadyScheduled && (
            <button
              type="button"
              className="account-danger-action"
              onClick={() => void requestDelete()}
              disabled={deleting}
            >
              {deleting && <LoaderCircle className="account-action-spinner" aria-hidden="true" />}
              {deleting ? 'Scheduling…' : 'Suspend and delete'}
            </button>
          )}
          {alreadyScheduled && (
            <button
              type="button"
              className="account-restore-action"
              onClick={() => void cancelDelete()}
              disabled={cancelling}
            >
              {cancelling ? (
                <LoaderCircle className="account-action-spinner" aria-hidden="true" />
              ) : (
                <RotateCcw aria-hidden="true" />
              )}
              {cancelling ? 'Cancelling…' : 'Cancel deletion'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function useCountdown(deadline: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (!deadline) return '24 hours';
  const remaining = Math.max(0, new Date(deadline).getTime() - now);
  if (!remaining) return 'Deleting soon';

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}
