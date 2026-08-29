import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin, emailOTP } from 'better-auth/plugins';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isVercel = Boolean(process.env.VERCEL);
const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  (isVercel ? undefined : 'spookycoins-local-dev-secret-change-me');
const authUrl = process.env.BETTER_AUTH_URL || (isVercel ? undefined : 'http://localhost:3000');

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
        if (process.env.NODE_ENV !== 'production') {
          console.info(`[SpookyCoins auth] ${type} OTP for ${email}: ${otp}`);
        }
      },
    }),
    nextCookies(),
  ],
});
