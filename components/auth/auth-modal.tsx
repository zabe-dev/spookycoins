'use client';

import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { Brand } from '@/components/brand';

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('modal-open');
    };
  }, [open, onClose]);

  if (!open) return null;

  function stopPanelClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="auth-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={stopPanelClick}
      >
        <button className="auth-close" onClick={onClose} aria-label="Close authentication modal">
          ×
        </button>
        <Brand />
        <div className="auth-heading">
          <h2 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p>Vote, build your watchlist, and follow projects you care about.</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
            role="tab"
            aria-selected={mode === 'login'}
          >
            Log in
          </button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
            role="tab"
            aria-selected={mode === 'signup'}
          >
            Sign up
          </button>
        </div>

        <div className="auth-providers">
          <button type="button">
            <GoogleIcon /> Continue with Google
          </button>
          <button type="button">
            <MetaMaskIcon /> Connect MetaMask
          </button>
        </div>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="At least 8 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
          </label>
          <button className="auth-submit" type="submit">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <p className="auth-terms">
          By continuing, you agree to the Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285f4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"
      />
      <path
        fill="#34a853"
        d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10 10 0 0 0 12 22Z"
      />
      <path fill="#fbbc05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.3L6.5 14Z" />
      <path
        fill="#ea4335"
        d="M12 6a5.4 5.4 0 0 1 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"
      />
    </svg>
  );
}

function MetaMaskIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#e2761b"
        d="m21.2 2.5-7.8 5.8 1.5-3.5 6.3-2.3ZM2.8 2.5l7.7 5.9-1.4-3.6-6.3-2.3Z"
      />
      <path
        fill="#e4761b"
        d="m18.4 15.8-2.1 3.3 4.5 1.2 1.3-4.4-3.7-.1ZM1.9 15.9l1.3 4.4 4.5-1.2-2.1-3.3-3.7.1Z"
      />
      <path
        fill="#f6851b"
        d="m7.4 10.3-1.3 2 4.5.2-.2-4.8-3 2.6Zm9.2 0-3.1-2.7-.1 4.9 4.5-.2-1.3-2Z"
      />
      <path fill="#c0ad9e" d="m7.7 19.1 2.7-1.3-2.3-1.8-.4 3.1Zm5.9-1.3 2.7 1.3-.4-3.1-2.3 1.8Z" />
      <path
        fill="#763d16"
        d="m16.3 19.1-2.7-1.3.2 1.8v.8l2.5-1.3Zm-8.6 0 2.5 1.3v-.8l.2-1.8-2.7 1.3Z"
      />
      <path fill="#f6851b" d="m10.3 14.8-2.2-.7 1.6-.8.6 1.5Zm3.4 0 .6-1.5 1.6.8-2.2.7Z" />
      <path fill="#e4751f" d="m7.7 19.1.4-3.3-2.5.1 2.1 3.2Zm8.2-3.3.4 3.3 2.1-3.2-2.5-.1Z" />
      <path
        fill="#f6851b"
        d="m17.9 12.3-4.5.2.4 2.3.6-1.5 1.6.8 1.9-1.8Zm-9.8 1.8 1.6-.8.6 1.5.3-2.3-4.5-.2 2 1.8Z"
      />
    </svg>
  );
}
