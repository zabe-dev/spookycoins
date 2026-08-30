'use client';

import Link from 'next/link';
import { useState } from 'react';

export type AccountSubmission = {
  id: string;
  coinId: number | null;
  status: string;
  submissionType: string;
  createdAt: string;
  coinData: { name?: string; symbol?: string; chain?: string };
};

export function AccountPanel({
  email,
  submissions,
}: {
  email: string;
  submissions: AccountSubmission[];
}) {
  const [notice, setNotice] = useState('');

  return (
    <section className="container settings-shell account-shell">
      <header className="account-heading">
        <p className="eyebrow">
          <span>●</span> Account
        </p>
        <h1>Watchlist</h1>
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
          <span>Soon</span>
        </div>
        <div className="settings-empty">
          <strong>No watched coins yet</strong>
          <p>Coins you add to your watchlist will appear here once persistence is connected.</p>
        </div>
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

function SubmissionRow({
  submission,
  onNotice,
}: {
  submission: AccountSubmission;
  onNotice: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const name = submission.coinData.name || `Submission ${submission.id.slice(0, 8)}`;

  async function request(action: 'edit' | 'delete', details?: string) {
    if (action === 'delete' && !window.confirm(`Request deletion of ${name}?`)) return;
    onNotice('Sending request…');
    const response = await fetch(`/api/coin-submissions/${submission.id}/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, details }),
    });
    const body = await response.json().catch(() => ({}));
    onNotice(
      response.ok
        ? `${action === 'edit' ? 'Edit' : 'Deletion'} request sent for review.`
        : body.error || 'Could not send the request.',
    );
    if (response.ok) setEditing(false);
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
        {submission.coinId && <Link href={`/coin/${submission.coinId}`}>View</Link>}
        <button onClick={() => setEditing((value) => !value)}>Request edit</button>
        <button className="delete-request" onClick={() => void request('delete')}>
          Request delete
        </button>
      </div>
      {editing && (
        <form
          className="edit-request-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void request('edit', String(data.get('details') || ''));
          }}
        >
          <textarea name="details" required placeholder="Describe what needs to change…" />
          <button type="submit">Send edit request</button>
        </form>
      )}
    </article>
  );
}
