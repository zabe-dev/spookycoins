'use client';

import { authClient } from '@/lib/auth/client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

type Submission = {
  id: string;
  coinId: number | null;
  status: string;
  submissionType: string;
  createdAt: string;
  coinData: { name?: string; symbol?: string; chain?: string };
};

export function SettingsPanel({
  user,
  providers,
  submissions,
}: {
  user: { name: string; email: string };
  providers: string[];
  submissions: Submission[];
}) {
  const [notice, setNotice] = useState('');
  const hasPassword = providers.includes('credential');
  const hasGoogle = providers.includes('google');

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('Saving…');
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const profile = await authClient.updateUser({ name });
    if (profile.error) return setNotice(profile.error.message || 'Could not update your name.');
    if (email !== user.email) {
      const changed = await authClient.changeEmail({ newEmail: email, callbackURL: '/settings' });
      if (changed.error) return setNotice(changed.error.message || 'Could not update your email.');
      setNotice('Check your new email address to confirm the change.');
      return;
    }
    setNotice('Your information was updated.');
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('Updating password…');
    const data = new FormData(event.currentTarget);
    const currentPassword = String(data.get('currentPassword') || '');
    const newPassword = String(data.get('newPassword') || '');
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setNotice(
      result.error
        ? result.error.message || 'Could not update your password.'
        : 'Password updated. Other sessions were signed out.',
    );
    if (!result.error) event.currentTarget.reset();
  }

  async function deleteAccount() {
    if (!window.confirm('Permanently delete your account? This cannot be undone.')) return;
    setNotice('Deleting account…');
    const result = await authClient.deleteUser({ callbackURL: '/' });
    if (result.error) setNotice(result.error.message || 'Could not delete your account.');
  }

  return (
    <section className="container settings-shell">
      <header className="settings-heading">
        <p className="eyebrow">
          <span>●</span> Account
        </p>
        <h1>Settings</h1>
        <p>Manage your profile, sign-in methods, and submitted coins.</p>
      </header>

      {notice && (
        <div className="settings-notice" role="status">
          {notice}
        </div>
      )}

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-title">
            <div>
              <small>Profile</small>
              <h2>User information</h2>
            </div>
            <span>Personal</span>
          </div>
          <form className="settings-form" onSubmit={updateProfile}>
            <label>
              Name
              <input name="name" defaultValue={user.name} required />
            </label>
            <label>
              Email address
              <input name="email" type="email" defaultValue={user.email} required />
            </label>
            <button type="submit">Save changes</button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-card-title">
            <div>
              <small>Security</small>
              <h2>Sign-in methods</h2>
            </div>
          </div>
          <div className="connection-row">
            <span className="google-mark">G</span>
            <div>
              <strong>Google / Gmail</strong>
              <small>{hasGoogle ? 'Connected to this account' : 'Not connected'}</small>
            </div>
            <b className={hasGoogle ? 'connected' : ''}>
              {hasGoogle ? 'Connected' : 'Not connected'}
            </b>
          </div>
          <div className="connection-row">
            <span className="email-mark">@</span>
            <div>
              <strong>Email and password</strong>
              <small>
                {hasPassword ? 'Available for sign in' : 'This account uses a social sign-in'}
              </small>
            </div>
            <b className={hasPassword ? 'connected' : ''}>
              {hasPassword ? 'Enabled' : 'Unavailable'}
            </b>
          </div>
          {hasPassword && (
            <form className="settings-form password-form" onSubmit={changePassword}>
              <h3>Change password</h3>
              <label>
                Current password
                <input name="currentPassword" type="password" minLength={8} required />
              </label>
              <label>
                New password
                <input name="newPassword" type="password" minLength={8} required />
              </label>
              <button type="submit">Update password</button>
            </form>
          )}
        </section>
      </div>

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

      <section className="settings-card danger-card">
        <div>
          <small>Danger zone</small>
          <h2>Delete account</h2>
          <p>Permanently remove your profile and sign-in data. This action cannot be undone.</p>
        </div>
        <button type="button" onClick={() => void deleteAccount()}>
          Delete my account
        </button>
      </section>
    </section>
  );
}

function SubmissionRow({
  submission,
  onNotice,
}: {
  submission: Submission;
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
