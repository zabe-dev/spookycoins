'use client';

import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs/legacy';
import { z } from 'zod';
import { Brand } from '@/components/ui/brand';
import { AuthProviderButtons } from './auth-provider-buttons';

const emailPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

const verificationSchema = z.object({
  code: z.string().trim().min(6, 'Enter the verification code from your email.'),
});

type AuthFeedback = {
  tone: 'info' | 'success' | 'error';
  title: string;
  message: string;
} | null;

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [feedback, setFeedback] = useState<AuthFeedback>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
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

  function updateMode(nextMode: 'login' | 'signup') {
    setMode(nextMode);
    setFeedback(null);
    setPendingVerification(false);
    setVerificationEmail('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const form = new FormData(event.currentTarget);

    if (pendingVerification) {
      const parsedCode = verificationSchema.safeParse({
        code: String(form.get('code') || ''),
      });

      if (!parsedCode.success) {
        setFeedback({
          tone: 'error',
          title: 'Code needed',
          message: parsedCode.error.issues[0]?.message || 'Enter the verification code.',
        });
        return;
      }

      setLoading(true);
      try {
        if (!signUpLoaded || !signUp) throw new Error('Authentication is still loading.');
        const result = await signUp.attemptEmailAddressVerification({
          code: parsedCode.data.code,
        });

        if (result.status === 'complete' && result.createdSessionId) {
          await setSignUpActive({ session: result.createdSessionId });
          onClose();
          return;
        }

        setFeedback({
          tone: 'info',
          title: 'Almost there',
          message: 'Clerk needs one more step before this account can be activated.',
        });
      } catch (caught) {
        setFeedback({ tone: 'error', title: 'Verification failed', message: getAuthError(caught) });
      } finally {
        setLoading(false);
      }
      return;
    }

    const parsedCredentials = emailPasswordSchema.safeParse({
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
    });

    if (!parsedCredentials.success) {
      setFeedback({
        tone: 'error',
        title: 'Check your details',
        message: parsedCredentials.error.issues[0]?.message || 'Enter a valid email and password.',
      });
      return;
    }

    const { email, password } = parsedCredentials.data;

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
        setFeedback({
          tone: 'info',
          title: 'Extra verification needed',
          message: 'Complete the extra security step to finish logging in.',
        });
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
        setVerificationEmail(email);
        setPendingVerification(true);
        setFeedback({
          tone: 'success',
          title: 'Check your email',
          message: `We sent a verification code to ${email}. Enter it below to finish signing up.`,
        });
        return;
      }

      setFeedback({
        tone: 'info',
        title: 'Almost there',
        message: 'Your account needs one more verification step before it can finish.',
      });
    } catch (caught) {
      setFeedback({ tone: 'error', title: 'Authentication failed', message: getAuthError(caught) });
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
    setFeedback(null);
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
      setFeedback({ tone: 'error', title: 'Google login failed', message: getAuthError(caught) });
      setLoading(false);
    }
  }

  async function continueWithWallet(provider: 'metamask' | 'coinbase') {
    setFeedback(null);
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

      setFeedback({
        tone: 'info',
        title: 'Wallet verification started',
        message: 'Follow the wallet prompt to finish connecting.',
      });
    } catch (caught) {
      setFeedback({
        tone: 'error',
        title: 'Wallet connection failed',
        message: getAuthError(caught),
      });
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
            onClick={() => updateMode('login')}
            role="tab"
            aria-selected={mode === 'login'}
          >
            Log in
          </button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => updateMode('signup')}
            role="tab"
            aria-selected={mode === 'signup'}
          >
            Sign up
          </button>
        </div>

        {!pendingVerification && (
          <>
            <AuthProviderButtons
              disabled={loading}
              onGoogle={continueWithGoogle}
              onMetaMask={() => continueWithWallet('metamask')}
              onCoinbase={() => continueWithWallet('coinbase')}
            />

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>
          </>
        )}

        {feedback && <AuthFeedbackMessage feedback={feedback} />}

        <form className="auth-form" onSubmit={submit}>
          {pendingVerification ? (
            <>
              <label>
                Verification code
                <input
                  type="text"
                  name="code"
                  placeholder="Enter email code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  required
                />
              </label>
              {verificationEmail && (
                <button
                  className="auth-secondary-action"
                  type="button"
                  onClick={() => {
                    setPendingVerification(false);
                    setVerificationEmail('');
                    setFeedback(null);
                  }}
                >
                  Use a different email
                </button>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? 'Working…'
              : pendingVerification
                ? 'Verify email'
                : mode === 'login'
                  ? 'Log in'
                  : 'Create account'}
          </button>
        </form>
        <p className="auth-terms">
          By continuing, you agree to the Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function AuthFeedbackMessage({ feedback }: { feedback: NonNullable<AuthFeedback> }) {
  return (
    <div
      className={`auth-message ${feedback.tone}`}
      role={feedback.tone === 'error' ? 'alert' : 'status'}
    >
      <span className="auth-message-icon" aria-hidden="true">
        {feedback.tone === 'error' ? '!' : feedback.tone === 'success' ? '✓' : 'i'}
      </span>
      <span>
        <strong>{feedback.title}</strong>
        {feedback.message}
      </span>
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
