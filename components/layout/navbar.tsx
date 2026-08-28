'use client';
/* eslint-disable @next/next/no-img-element -- Clerk avatars are tiny navbar images. */

import { useState } from 'react';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import { Brand } from '@/components/ui/brand';
import { AuthModal } from '@/features/auth/components/auth-modal';

export function Navbar({ active = 'discover' }: { active?: 'discover' | 'none' }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();
  const closeMenu = () => setMenuOpen(false);
  const displayName = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress;

  function openAuth() {
    closeMenu();
    setAuthOpen(true);
  }

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
            {isSignedIn ? (
              <button className="mobile-nav-auth" onClick={() => void signOut()}>
                Sign out
              </button>
            ) : (
              <button className="mobile-nav-auth" onClick={openAuth}>
                Sign in
              </button>
            )}
          </nav>
          <div className="nav-actions">
            <button className="submit-coin-btn">＋ Submit coin</button>
            {isSignedIn ? (
              <button className="wallet-btn user-pill" onClick={() => void signOut()}>
                {user?.imageUrl && <img src={user.imageUrl} alt="" />}
                {displayName ? `Hi, ${displayName}` : 'Sign out'}
              </button>
            ) : (
              <button className="wallet-btn" onClick={openAuth}>
                Sign in
              </button>
            )}
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
