'use client';

import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs/legacy';
import { Brand } from '@/components/ui/brand';
import { AuthProviderButtons } from './auth-provider-buttons';

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');

    if (!email || !password) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        if (!signInLoaded || !signIn) throw new Error('Authentication is still loading.');
        const result = await signIn.create({ identifier: email, password });
        if (result.status === 'complete' && result.createdSessionId) {
          await setSignInActive({ session: result.createdSessionId });
          onClose();
          return;
        }
        setStatus('Extra verification is required to finish logging in.');
        return;
      }

      if (!signUpLoaded || !signUp) throw new Error('Authentication is still loading.');
      const result = await signUp.create({ emailAddress: email, password });
      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        onClose();
        return;
      }

      if (result.unverifiedFields.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStatus('Check your email for the verification code. Code entry UI is coming next.');
        return;
      }

      setStatus('Your account needs one more verification step before it can finish.');
    } catch (caught) {
      setError(getAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    await continueWithRedirect('oauth_google');
  }

  async function continueWithRedirect(strategy: 'oauth_google') {
    const loaded = mode === 'login' ? signInLoaded : signUpLoaded;
    if (!loaded) return;
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        if (!signIn) throw new Error('Authentication is still loading.');
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: '/sso-callback',
          redirectUrlComplete: window.location.href,
        });
      } else {
        if (!signUp) throw new Error('Authentication is still loading.');
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: '/sso-callback',
          redirectUrlComplete: window.location.href,
        });
      }
    } catch (caught) {
      setError(getAuthError(caught));
      setLoading(false);
    }
  }

  async function continueWithWallet(provider: 'metamask' | 'coinbase') {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const result = mode === 'login' ? await signInWallet(provider) : await signUpWallet(provider);

      if (result?.status === 'complete' && result.createdSessionId) {
        const setActive = mode === 'login' ? setSignInActive : setSignUpActive;
        if (!setActive) throw new Error('Authentication is still loading.');
        await setActive({ session: result.createdSessionId });
        onClose();
        return;
      }

      setStatus('Wallet verification started. Follow the wallet prompt to finish.');
    } catch (caught) {
      setError(getAuthError(caught));
    } finally {
      setLoading(false);
    }
  }

  async function signInWallet(provider: 'metamask' | 'coinbase') {
    if (!signInLoaded || !signIn) throw new Error('Authentication is still loading.');
    return provider === 'metamask'
      ? signIn.authenticateWithMetamask()
      : signIn.authenticateWithCoinbaseWallet();
  }

  async function signUpWallet(provider: 'metamask' | 'coinbase') {
    if (!signUpLoaded || !signUp) throw new Error('Authentication is still loading.');
    return provider === 'metamask'
      ? signUp.authenticateWithMetamask()
      : signUp.authenticateWithCoinbaseWallet();
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
          <p>Vote, build your watchlist, and follow coins you care about.</p>
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

        <AuthProviderButtons
          disabled={loading}
          onGoogle={continueWithGoogle}
          onMetaMask={() => continueWithWallet('metamask')}
          onCoinbase={() => continueWithWallet('coinbase')}
        />

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
          {error && <p className="auth-message error">{error}</p>}
          {status && <p className="auth-message">{status}</p>}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Working…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <p className="auth-terms">
          By continuing, you agree to the Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function getAuthError(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors)
  ) {
    const [first] = (error as { errors: Array<{ longMessage?: string; message?: string }> }).errors;
    return first?.longMessage || first?.message || 'Authentication failed.';
  }

  if (error instanceof Error) return error.message;
  return 'Authentication failed. Please try again.';
}
