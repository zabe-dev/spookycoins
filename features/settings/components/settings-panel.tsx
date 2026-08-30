'use client';

import { PasswordField } from '@/components/ui/password-field';
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
