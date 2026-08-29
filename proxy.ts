import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(
  () => {
    // Keep Clerk middleware active while protected pages perform resource-level checks.
  },
  { debug: process.env.NODE_ENV === 'development' },
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
