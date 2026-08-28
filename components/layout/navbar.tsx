'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { AuthModal } from '@/components/auth/auth-modal';

export function Navbar({ active = 'discover' }: { active?: 'discover' | 'none' }) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <div className="nav-band">
        <div className="container navbar">
          <Brand />
          <nav>
            <Link className={active === 'discover' ? 'active' : ''} href="/#leaderboard">
              Discover
            </Link>
            <Link href="/#promoted">Promoted</Link>
            <Link href="/#partners">Partners</Link>
            <Link href="/#footer">Advertise</Link>
          </nav>
          <div className="nav-actions">
            <button className="submit-coin-btn">＋ Submit coin</button>
            <button className="wallet-btn" onClick={() => setAuthOpen(true)}>
              Sign in
            </button>
          </div>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
