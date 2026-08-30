'use client';

import { Brand } from '@/components/ui/brand';
import Link from 'next/link';

type SiteFooterProps = {
  id?: string;
  variant?: 'default' | 'home';
};

export function SiteFooter({ id, variant = 'default' }: SiteFooterProps) {
  return (
    <footer className={`site-footer ${variant === 'home' ? 'site-footer--home' : ''}`} id={id}>
      <div className="container site-footer-inner">
        <Brand />
        <p>Community-powered crypto discovery.</p>
        <div>
          <Link href="/#leaderboard">Methodology</Link>
          <Link href="/advertise">Advertise</Link>
          <Link href="/partners">Partners</Link>
        </div>
      </div>
    </footer>
  );
}
