import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin, emailOTP } from 'better-auth/plugins';
import { Resend } from 'resend';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;
const authEmailFrom = process.env.AUTH_EMAIL_FROM || 'SpookyCoins <onboarding@resend.dev>';
const isVercel = Boolean(process.env.VERCEL);
const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  (isVercel ? undefined : 'spookycoins-local-dev-secret-change-me');
const authUrl = process.env.BETTER_AUTH_URL || (isVercel ? undefined : 'http://localhost:3000');
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type AuthEmailType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

async function sendAuthCodeEmail({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: AuthEmailType;
}) {
  const isPasswordReset = type === 'forget-password';
  const subject = isPasswordReset
    ? 'Your SpookyCoins password reset code'
    : 'Your SpookyCoins verification code';
  const purpose = isPasswordReset
    ? 'Use this code to reset your SpookyCoins password.'
    : 'Use this code to verify your SpookyCoins account.';
  const preview = isPasswordReset
    ? 'Your password reset code expires in 10 minutes.'
    : 'Your verification code expires in 10 minutes.';

  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[SpookyCoins auth] ${type} OTP for ${email}: ${otp}`);
      return;
    }

    console.error('[SpookyCoins auth] RESEND_API_KEY is missing; auth email was not sent.');
    throw new Error('AUTH_EMAIL_SEND_FAILED');
  }

  const { error } = await resend.emails.send({
    from: authEmailFrom,
    to: email,
    subject,
    text: `${purpose}\n\nCode: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div style="margin:0;background:#0d0f14;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#f7f7fb;">
        <div style="margin:0 auto;max-width:520px;border:1px solid rgba(255,255,255,0.12);border-radius:24px;background:#151821;padding:28px;">
          <p style="margin:0 0 10px;color:#f6b21a;font-size:13px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">SpookyCoins</p>
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;">${subject}</h1>
          <p style="margin:0 0 20px;color:#b8bfcc;font-size:15px;line-height:1.6;">${purpose}</p>
          <div style="margin:22px 0;border-radius:18px;background:#0d0f14;padding:20px;text-align:center;">
            <div style="font-size:36px;font-weight:900;letter-spacing:0.22em;color:#ffffff;">${otp}</div>
          </div>
          <p style="margin:0;color:#8f98aa;font-size:13px;line-height:1.6;">${preview} If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('[SpookyCoins auth] Failed to send auth email with Resend.', {
      type,
      name: error.name,
      message: error.message,
    });
    throw new Error('AUTH_EMAIL_SEND_FAILED');
  }
}

export const auth = betterAuth({
  appName: 'SpookyCoins',
  secret: authSecret,
  baseURL: authUrl,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : undefined,
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 10 * 60,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendAuthCodeEmail({ email, otp, type });
      },
    }),
    nextCookies(),
  ],
});
