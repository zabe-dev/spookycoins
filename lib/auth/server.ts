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
    text: buildAuthCodeEmailText({ otp, requestDetails }),
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
    requireEmailVerification: false,
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
  const city =
    decodeHeader(headers?.get('x-vercel-ip-city')) || decodeHeader(headers?.get('cf-ipcity')) || '';
  const country = formatCountry(
    decodeHeader(headers?.get('x-vercel-ip-country')) ||
      decodeHeader(headers?.get('cf-ipcountry')) ||
      decodeHeader(headers?.get('x-country')) ||
      '',
  );
  const now = new Date();

  return {
    ip,
    location: formatLocation(city, country),
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

function formatCountry(value: string) {
  const country = value.trim();
  if (!country) return '';
  if (/^[A-Z]{2}$/i.test(country)) {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(country.toUpperCase()) || country;
    } catch {
      return country.toUpperCase();
    }
  }
  return country;
}

function formatLocation(city: string, country: string) {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  if (city) return city;
  return 'Unknown location';
}

function buildAuthCodeEmailText({
  otp,
  requestDetails,
}: {
  otp: string;
  requestDetails: ReturnType<typeof getAuthRequestDetails>;
}) {
  return [
    'Verification code',
    '',
    'Enter the following verification code when prompted:',
    '',
    otp,
    '',
    'To protect your account, do not share this code.',
    '',
    "Didn't request this?",
    '',
    `This code was requested from ${requestDetails.ip}, ${requestDetails.location} at ${requestDetails.date}, ${requestDetails.time}. If you didn't make this request, you can safely ignore this email.`,
  ].join('\n');
}
