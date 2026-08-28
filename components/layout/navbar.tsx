'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { AuthModal } from '@/features/auth/components/auth-modal';

export function Navbar({ active = 'discover' }: { active?: 'discover' | 'none' }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="nav-band">
        <div className="container navbar">
          <Brand />
          <nav className={menuOpen ? 'open' : ''}>
            <Link
              className={active === 'discover' ? 'active' : ''}
              href="/#leaderboard"
              onClick={closeMenu}
            >
              Discover
            </Link>
            <Link href="/#promoted" onClick={closeMenu}>
              Promoted
            </Link>
            <Link href="/#partners" onClick={closeMenu}>
              Partners
            </Link>
            <Link href="/#footer" onClick={closeMenu}>
              Advertise
            </Link>
            <button
              className="mobile-nav-auth"
              onClick={() => {
                closeMenu();
                setAuthOpen(true);
              }}
            >
              Sign in
            </button>
          </nav>
          <div className="nav-actions">
            <button className="submit-coin-btn">＋ Submit coin</button>
            <button className="wallet-btn" onClick={() => setAuthOpen(true)}>
              Sign in
            </button>
            <button
              className={`mobile-menu-btn ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
