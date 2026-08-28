'use client';

import { Brand } from '@/components/ui/brand';
import { useSignIn, useSignUp } from '@clerk/nextjs/legacy';
import {
  useEffect,
  useCallback,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { z } from 'zod';
import { AuthProviderButtons } from './auth-provider-buttons';

const emailPasswordSchema = z.object({
  email: z.string().trim().email('Use a real email address, like you@example.com.'),
  password: z.string().min(8, 'Password needs at least 8 characters.'),
});

const emailSchema = z.object({
  email: z.string().trim().email('Use a real email address so we can send the reset code.'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'New password needs at least 8 characters.'),
});

type AuthMode = 'login' | 'signup' | 'reset';
type AuthStep = 'credentials' | 'verify-signup' | 'reset-code' | 'new-password';

type AuthFeedback = {
  tone: 'info' | 'success' | 'error';
  title: string;
  message: string;
} | null;

const emptyCode = ['', '', '', '', '', ''];

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<AuthStep>('credentials');
  const [feedback, setFeedback] = useState<AuthFeedback>(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState(emptyCode);
  const [loading, setLoading] = useState(false);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const isCodeStep = step === 'verify-signup' || step === 'reset-code';

  const resetFlow = useCallback(
    (nextMode = mode) => {
      setMode(nextMode);
      setStep('credentials');
      setFeedback(null);
      setVerificationEmail('');
      setCodeDigits(emptyCode);
      setLoading(false);
    },
    [mode],
  );

  const closeModal = useCallback(() => {
    resetFlow('login');
    onClose();
  }, [onClose, resetFlow]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('modal-open');
    };
  }, [open, closeModal]);

  useEffect(() => {
    if (!isCodeStep) return;
    codeRefs.current[0]?.focus();
  }, [isCodeStep]);

  if (!open) return null;

  function stopPanelClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  function updateMode(nextMode: AuthMode) {
    resetFlow(nextMode);
  }

  function updateCodeDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setCodeDigits((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? digit : item)),
    );
    if (digit && index < 5) codeRefs.current[index + 1]?.focus();
  }

  function handleCodeKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const nextDigits = emptyCode.map((_, index) => pasted[index] || '');
    setCodeDigits(nextDigits);
    codeRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (step === 'verify-signup') {
      await verifySignupCode();
      return;
    }

    if (step === 'reset-code') {
      await verifyResetCode();
      return;
    }

    const form = new FormData(event.currentTarget);

    if (step === 'new-password') {
      await finishPasswordReset(String(form.get('password') || ''));
      return;
    }

    if (mode === 'reset') {
      await startPasswordReset(String(form.get('email') || ''));
      return;
    }

    await submitEmailPassword(form);
  }

  async function submitEmailPassword(form: FormData) {
    const parsedCredentials = emailPasswordSchema.safeParse({
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
    });

    if (!parsedCredentials.success) {
      showValidationError(parsedCredentials.error.issues[0]?.message);
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
          closeModal();
          return;
        }
        setFeedback({
          tone: 'info',
          title: 'Extra security check',
          message: 'This account needs another verification step before it can log in.',
        });
        return;
      }

      if (!signUpLoaded || !signUp) throw new Error('Authentication is still loading.');
      const result = await signUp.create({ emailAddress: email, password });
      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        closeModal();
        return;
      }

      if (result.unverifiedFields.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setVerificationEmail(email);
        setStep('verify-signup');
        setCodeDigits(emptyCode);
        setFeedback({
          tone: 'success',
          title: 'Code sent',
          message: `We sent a 6-digit code to ${email}. Enter it below to finish creating your account.`,
        });
        return;
      }

      setFeedback({
        tone: 'info',
        title: 'One more step',
        message: 'This signup needs another verification step before it can finish.',
      });
    } catch (caught) {
      setFeedback({ tone: 'error', title: 'Could not continue', message: getAuthError(caught) });
    } finally {
      setLoading(false);
    }
  }

  async function verifySignupCode() {
    const code = readVerificationCode();
    if (!code) return;

    setLoading(true);
    try {
      if (!signUpLoaded || !signUp) throw new Error('Authentication is still loading.');
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        closeModal();
        return;
      }

      setFeedback({
        tone: 'info',
        title: 'Almost there',
        message: 'The code was accepted, but Clerk still needs one more account step.',
      });
    } catch (caught) {
      setFeedback({
        tone: 'error',
        title: 'Wrong or expired code',
        message: getAuthError(caught),
      });
    } finally {
      setLoading(false);
    }
  }

  async function startPasswordReset(email: string) {
    const parsedEmail = emailSchema.safeParse({ email });
    if (!parsedEmail.success) {
      showValidationError(parsedEmail.error.issues[0]?.message);
      return;
    }

    setLoading(true);
    try {
      if (!signInLoaded || !signIn) throw new Error('Authentication is still loading.');
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: parsedEmail.data.email,
      });
      setVerificationEmail(parsedEmail.data.email);
      setStep('reset-code');
      setCodeDigits(emptyCode);
      setFeedback({
        tone: 'success',
        title: 'Reset code sent',
        message: `We sent a 6-digit password reset code to ${parsedEmail.data.email}.`,
      });
    } catch (caught) {
      setFeedback({
        tone: 'error',
        title: 'Could not send reset code',
        message: getAuthError(caught),
      });
    } finally {
      setLoading(false);
    }
  }

  async function verifyResetCode() {
    const code = readVerificationCode();
    if (!code) return;

    setLoading(true);
    try {
      if (!signInLoaded || !signIn) throw new Error('Authentication is still loading.');
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });

      if (result.status === 'needs_new_password') {
        setStep('new-password');
        setCodeDigits(emptyCode);
        setFeedback({
          tone: 'success',
          title: 'Code confirmed',
          message: 'Now choose a new password for your account.',
        });
        return;
      }

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId });
        closeModal();
        return;
      }

      setFeedback({
        tone: 'info',
        title: 'One more step',
        message: 'The reset code was accepted, but the account still needs another step.',
      });
    } catch (caught) {
      setFeedback({ tone: 'error', title: 'Invalid reset code', message: getAuthError(caught) });
    } finally {
      setLoading(false);
    }
  }

  async function finishPasswordReset(password: string) {
    const parsedPassword = resetPasswordSchema.safeParse({ password });
    if (!parsedPassword.success) {
      showValidationError(parsedPassword.error.issues[0]?.message);
      return;
    }

    setLoading(true);
    try {
      if (!signInLoaded || !signIn) throw new Error('Authentication is still loading.');
      const result = await signIn.resetPassword({ password: parsedPassword.data.password });

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId });
        closeModal();
        return;
      }

      setFeedback({
        tone: 'success',
        title: 'Password updated',
        message: 'Your password was updated. Try logging in with it now.',
      });
      resetFlow('login');
    } catch (caught) {
      setFeedback({
        tone: 'error',
        title: 'Could not update password',
        message: getAuthError(caught),
      });
    } finally {
      setLoading(false);
    }
  }

  function readVerificationCode() {
    const code = codeDigits.join('');
    const parsedCode = z.string().length(6, 'Enter all 6 digits from the email.').safeParse(code);

    if (!parsedCode.success) {
      setFeedback({
        tone: 'error',
        title: 'Enter the full code',
        message: parsedCode.error.issues[0]?.message || 'Enter the verification code.',
      });
      return null;
    }

    return parsedCode.data;
  }

  function showValidationError(message?: string) {
    setFeedback({
      tone: 'error',
      title: 'Check your details',
      message: message || 'Fix the highlighted details and try again.',
    });
  }

  async function continueWithGoogle() {
    const loaded = mode === 'login' || mode === 'reset' ? signInLoaded : signUpLoaded;
    if (!loaded) return;
    setFeedback(null);
    setLoading(true);
    try {
      if (mode === 'login' || mode === 'reset') {
        if (!signIn) throw new Error('Authentication is still loading.');
        await signIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: window.location.href,
        });
      } else {
        if (!signUp) throw new Error('Authentication is still loading.');
        await signUp.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: window.location.href,
        });
      }
    } catch (caught) {
      setFeedback({ tone: 'error', title: 'Google login failed', message: getAuthError(caught) });
      setLoading(false);
    }
  }

  const title =
    mode === 'reset'
      ? 'Reset your password'
      : mode === 'login'
        ? 'Welcome back'
        : step === 'verify-signup'
          ? 'Verify your email'
          : 'Create your account';

  const submitLabel = loading
    ? 'Working…'
    : step === 'verify-signup'
      ? 'Verify email'
      : step === 'reset-code'
        ? 'Verify reset code'
        : step === 'new-password'
          ? 'Update password'
          : mode === 'reset'
            ? 'Send reset code'
            : mode === 'login'
              ? 'Log in'
              : 'Create account';

  return (
    <div className="auth-overlay" role="presentation" onMouseDown={closeModal}>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={stopPanelClick}
      >
        <button className="auth-close" onClick={closeModal} aria-label="Close authentication modal">
          ×
        </button>
        <Brand />
        <div className="auth-heading">
          <h2 id="auth-title">{title}</h2>
          <p>
            {mode === 'reset'
              ? 'Enter your email and we’ll send a reset code.'
              : 'Vote, build your watchlist, and follow coins you care about.'}
          </p>
        </div>

        {!isCodeStep && step !== 'new-password' && (
          <>
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

            {mode !== 'reset' && (
              <>
                <AuthProviderButtons disabled={loading} onGoogle={continueWithGoogle} />
                <div className="auth-divider">
                  <span>or continue with email</span>
                </div>
              </>
            )}
          </>
        )}

        {feedback && <AuthFeedbackMessage feedback={feedback} />}

        <form className="auth-form" onSubmit={submit}>
          {isCodeStep ? (
            <>
              <label>
                {step === 'reset-code' ? 'Password reset code' : 'Verification code'}
                <span className="auth-code-grid">
                  {codeDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(node) => {
                        codeRefs.current[index] = node;
                      }}
                      type="text"
                      value={digit}
                      aria-label={`Code digit ${index + 1}`}
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      onChange={(event) => updateCodeDigit(index, event.target.value)}
                      onKeyDown={(event) => handleCodeKeyDown(index, event)}
                      onPaste={handleCodePaste}
                    />
                  ))}
                </span>
              </label>
              {verificationEmail && (
                <button
                  className="auth-secondary-action"
                  type="button"
                  onClick={() => resetFlow(mode)}
                >
                  Use a different email
                </button>
              )}
            </>
          ) : step === 'new-password' ? (
            <label>
              New password
              <input
                type="password"
                name="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          ) : mode === 'reset' ? (
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
            {submitLabel}
          </button>
        </form>

        {mode === 'login' && step === 'credentials' && (
          <button className="auth-link-action" type="button" onClick={() => updateMode('reset')}>
            Forgot password?
          </button>
        )}
        {mode === 'reset' && (
          <button className="auth-link-action" type="button" onClick={() => updateMode('login')}>
            Back to log in
          </button>
        )}

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
    Array.isArray(
      (error as { errors?: Array<{ longMessage?: string; message?: string; code?: string }> })
        .errors,
    )
  ) {
    const [first] = (
      error as { errors: Array<{ longMessage?: string; message?: string; code?: string }> }
    ).errors;
    if (first?.code === 'form_password_incorrect')
      return 'That password does not match this account.';
    if (first?.code === 'form_identifier_not_found') return 'No account was found with that email.';
    if (first?.code === 'verification_failed')
      return 'That code is wrong or expired. Check the email and try again.';
    if (first?.code === 'form_password_pwned')
      return 'Use a stronger password that has not appeared in a data leak.';
    return first?.longMessage || first?.message || 'Authentication failed.';
  }

  if (error instanceof Error) return error.message;
  return 'Authentication failed. Please try again.';
}
