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
  request,
}: {
  email: string;
  otp: string;
  type: AuthEmailType;
  request?: Request;
}) {
  const requestDetails = getAuthRequestDetails(request);
  const subject = `${otp} is your verification code`;

  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[SpookyCoins auth] ${type} OTP for ${email}: ${otp}`);
      return;
    }

    console.error('[SpookyCoins auth] RESEND_API_KEY is missing; auth email was not sent.');
    throw new Error('AUTH_EMAIL_SEND_FAILED');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[SpookyCoins auth] Sending ${type} OTP to ${email} with Resend.`);
  }

  const { error } = await resend.emails.send({
    from: authEmailFrom,
    to: email,
    subject,
    text: `spookycoins\n\nVerification code\n\nEnter the following verification code when prompted:\n\n${otp}\n\nTo protect your account, do not share this code.\n\nDidn't request this?\n\nThis code was requested from ${requestDetails.ip}, ${requestDetails.location} at ${requestDetails.date}, ${requestDetails.time}. If you didn't make this request, you can safely ignore this email.\n\n© 2026 spookycoins.com`,
    html: `
      <div style="margin:0;background:#0b0d11;padding:34px 16px;font-family:Inter,Arial,sans-serif;color:#f7f7fb;">
        <div style="margin:0 auto;max-width:540px;overflow:hidden;border:1px solid rgba(255,255,255,0.12);border-radius:26px;background:#141821;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
          <div style="border-bottom:1px solid rgba(255,255,255,0.08);padding:26px 28px;text-align:center;">
            <div style="margin:0 auto 12px;display:inline-block;border-radius:999px;background:linear-gradient(135deg,#ff7700,#f0b90b);padding:2px;">
              <div style="border-radius:999px;background:#141821;padding:10px 14px;color:#ffffff;font-size:18px;font-weight:900;">👻</div>
            </div>
            <div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.04em;text-transform:lowercase;">spookycoins</div>
          </div>
          <div style="padding:30px 28px 26px;">
            <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;line-height:1.2;">Verification code</h1>
            <p style="margin:0 0 22px;color:#aeb7c4;font-size:15px;line-height:1.6;">Enter the following verification code when prompted:</p>
            <div style="margin:0 0 24px;border-radius:20px;background:#0b0d11;padding:22px;text-align:center;">
              <div style="color:#ffffff;font-size:40px;font-weight:950;letter-spacing:0.24em;line-height:1;">${otp}</div>
            </div>
            <p style="margin:0 0 26px;color:#c6ccd6;font-size:14px;line-height:1.7;">To protect your account, do not share this code.</p>
            <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:22px;">
              <h2 style="margin:0 0 8px;color:#ffffff;font-size:16px;">Didn't request this?</h2>
              <p style="margin:0;color:#8f98aa;font-size:13px;line-height:1.7;">This code was requested from <strong style="color:#f7f7fb;">${escapeHtml(requestDetails.ip)}, ${escapeHtml(requestDetails.location)}</strong> at <strong style="color:#f7f7fb;">${escapeHtml(requestDetails.date)}, ${escapeHtml(requestDetails.time)}</strong>. If you didn't make this request, you can safely ignore this email.</p>
            </div>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.08);padding:18px 28px;text-align:center;color:#6f7886;font-size:12px;">© 2026 spookycoins.com</div>
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
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: false,
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
      async sendVerificationOTP({ email, otp, type }, ctx) {
        await sendAuthCodeEmail({ email, otp, type, request: ctx?.request });
      },
    }),
    nextCookies(),
  ],
});

function getAuthRequestDetails(request?: Request) {
  const headers = request?.headers;
  const forwardedFor = headers?.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || headers?.get('x-real-ip') || 'Unknown IP';
  const city = decodeHeader(headers?.get('x-vercel-ip-city')) || 'Unknown city';
  const country =
    decodeHeader(headers?.get('x-vercel-ip-country-region')) ||
    decodeHeader(headers?.get('x-vercel-ip-country')) ||
    'Unknown country';
  const now = new Date();

  return {
    ip,
    location: `${city}, ${country}`,
    date: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(now),
    time: `${new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }).format(now)} UTC`,
  };
}

function decodeHeader(value?: string | null) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
