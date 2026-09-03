'use client';

import { Brand } from '@/components/ui/brand';
import Link from 'next/link';

type SiteFooterProps = {
  id?: string;
  variant?: 'default' | 'home';
};

function getCurrentYear() {
  return new Date().getFullYear();
}

export function SiteFooter({ id, variant = 'default' }: SiteFooterProps) {
  return (
    <footer className={`site-footer ${variant === 'home' ? 'site-footer--home' : ''}`} id={id}>
      <div className="container site-footer-inner">
        <Brand />
        <p>
          <Link href="https://spookycoins.com">www.spookycoins.com</Link> © {getCurrentYear()} ·
          Community-powered crypto discovery.
        </p>
        <div>
          <Link href="/#leaderboard">Discover</Link>
          <Link href="/#promoted">Promoted</Link>
          <Link href="/partners">Partners</Link>
          <Link href="/advertise">Advertise</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
