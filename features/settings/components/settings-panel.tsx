'use client';

import { authClient } from '@/lib/auth/client';
import { useState, type FormEvent } from 'react';

export function SettingsPanel({ user }: { user: { name: string; email: string } }) {
  const [notice, setNotice] = useState('');

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('Saving…');
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const profile = await authClient.updateUser({ name });
    setNotice(
      profile.error
        ? profile.error.message || 'Could not update your name.'
        : 'Your information was updated.',
    );
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('Updating password…');
    const data = new FormData(event.currentTarget);
    const currentPassword = String(data.get('currentPassword') || '');
    const newPassword = String(data.get('newPassword') || '');
    const confirmPassword = String(data.get('confirmPassword') || '');

    if (newPassword !== confirmPassword) {
      setNotice('New password and confirm password must match.');
      return;
    }

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
        <p>Manage your profile and password.</p>
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
              <input
                name="email"
                type="email"
                value={user.email}
                aria-describedby="locked-email-help"
                readOnly
              />
              <small id="locked-email-help">Email changes are disabled for now.</small>
            </label>
            <button type="submit">Save changes</button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-card-title">
            <div>
              <small>Security</small>
              <h2>Change password</h2>
            </div>
          </div>
          <form className="settings-form password-form" onSubmit={changePassword}>
            <label>
              Current password
              <PasswordField name="currentPassword" autoComplete="current-password" />
            </label>
            <label>
              New password
              <PasswordField name="newPassword" autoComplete="new-password" />
            </label>
            <label>
              Confirm new password
              <PasswordField name="confirmPassword" autoComplete="new-password" />
            </label>
            <button type="submit">Update password</button>
          </form>
        </section>
      </div>

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

function PasswordField({ name, autoComplete }: { name: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="settings-password-wrap">
      <input
        name={name}
        type={visible ? 'text' : 'password'}
        minLength={8}
        autoComplete={autoComplete}
        required
      />
      <button
        className="settings-password-toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>
    </span>
  );
}

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5.2c5.7 0 9.4 5.6 9.6 5.8.4.6.4 1.4 0 2-.2.2-3.9 5.8-9.6 5.8S2.6 13.2 2.4 13c-.4-.6-.4-1.4 0-2 .2-.2 3.9-5.8 9.6-5.8Zm0 2C7.6 7.2 4.5 11.4 4 12c.5.6 3.6 4.8 8 4.8s7.5-4.2 8-4.8c-.5-.6-3.6-4.8-8-4.8Zm0 1.6a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Zm0 2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.3 3.1 21 19.8l-1.4 1.4-3-3A11.4 11.4 0 0 1 12 19c-5.7 0-9.4-5.6-9.6-5.8-.4-.6-.4-1.4 0-2a17.4 17.4 0 0 1 4-3.9L2.9 4.5l1.4-1.4Zm3.5 5.6A15.4 15.4 0 0 0 4 12c.5.6 3.6 4.8 8 4.8 1 0 2-.2 2.8-.5l-1.7-1.7A3.2 3.2 0 0 1 9.4 11L7.8 8.7Zm3.4 3.4 1.7 1.7a1.2 1.2 0 0 0-1.7-1.7ZM12 5.2c5.7 0 9.4 5.6 9.6 5.8.4.6.4 1.4 0 2a15 15 0 0 1-2.5 2.8l-1.4-1.4A13.7 13.7 0 0 0 20 12c-.5-.6-3.6-4.8-8-4.8-.7 0-1.4.1-2 .3L8.4 5.9c1.1-.5 2.3-.7 3.6-.7Z" />
    </svg>
  );
}
