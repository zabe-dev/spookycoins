'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { Brand } from '@/components/ui/brand';
import { AuthModal } from '@/features/auth/components/auth-modal';

export function Navbar({ active = 'discover' }: { active?: 'discover' | 'none' }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();
  const closeMenu = () => setMenuOpen(false);
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const userInitials = getEmailInitials(email);

  function openAuth() {
    closeMenu();
    setAuthOpen(true);
  }

  async function logout() {
    setUserMenuOpen(false);
    closeMenu();
    await signOut();
    router.push('/');
    router.refresh();
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
          </nav>
          <div className="nav-actions">
            <button className="submit-coin-btn">＋ Submit coin</button>
            {isSignedIn ? (
              <div className="user-menu-wrap">
                <button
                  className="user-avatar-btn"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  aria-expanded={userMenuOpen}
                  aria-label="Open user menu"
                >
                  {userInitials}
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <p>{email}</p>
                    <Link href="/account" onClick={() => setUserMenuOpen(false)}>
                      Watchlists
                    </Link>
                    <button className="logout-action" onClick={() => void logout()}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="wallet-btn auth-icon-btn"
                onClick={openAuth}
                aria-label="Open login or signup"
              >
                <UserIcon />
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

function getEmailInitials(email: string) {
  const letters = email
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 2)
    .toUpperCase();
  return letters || 'SC';
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M20 21a8 8 0 0 0-16 0m8-9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
      />
    </svg>
  );
}
