'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import { Brand } from '@/components/ui/brand';
import { AuthModal } from '@/features/auth/components/auth-modal';

export function Navbar({ active = 'discover' }: { active?: 'discover' | 'none' }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
    window.location.replace('/?toast=signed-out');
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
              <MenuIcon type="discover" /> Discover
            </Link>
            <Link href="/#promoted" onClick={closeMenu}>
              <MenuIcon type="promoted" /> Promoted
            </Link>
            <Link href="/#partners" onClick={closeMenu}>
              <MenuIcon type="partners" /> Partners
            </Link>
            <Link href="/#footer" onClick={closeMenu}>
              <MenuIcon type="advertise" /> Advertise
            </Link>
            <div className="mobile-menu-account">
              {isSignedIn ? (
                <>
                  <div className="mobile-user-card">
                    <span className="user-avatar-btn">{userInitials}</span>
                    <span>
                      <b>{user?.firstName || 'Spooky user'}</b>
                      <small>{email}</small>
                    </span>
                  </div>
                  <Link href="/account" onClick={closeMenu}>
                    <MenuIcon type="watchlist" /> Watchlists
                  </Link>
                  <button className="logout-action" onClick={() => void logout()}>
                    <MenuIcon type="logout" /> Logout
                  </button>
                </>
              ) : (
                <button className="mobile-login-action" onClick={openAuth}>
                  <UserIcon /> Log in or sign up
                </button>
              )}
            </div>
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
                    <div className="desktop-user-card">
                      <span className="user-avatar-btn">{userInitials}</span>
                      <span>
                        <b>{user?.firstName || 'Spooky user'}</b>
                        <small>{email}</small>
                      </span>
                    </div>
                    <Link href="/account" onClick={() => setUserMenuOpen(false)}>
                      <MenuIcon type="watchlist" /> Watchlists
                    </Link>
                    <button className="logout-action" onClick={() => void logout()}>
                      <MenuIcon type="logout" /> Logout
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

function MenuIcon({
  type,
}: {
  type: 'discover' | 'promoted' | 'partners' | 'advertise' | 'watchlist' | 'logout';
}) {
  const paths = {
    discover: 'M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Zm8-4 2.2 4.2L10 14.4 12 8Z',
    promoted: 'M13 2 4 14h7l-1 8 10-13h-7l1-7Z',
    partners: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 10v-1a8 8 0 0 0-16 0v1m18-10a3 3 0 1 0 0-6',
    advertise: 'M4 7h3l9-3v16l-9-3H4V7Zm0 0v10m13-7 3 2-3 2',
    watchlist: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9',
  };

  return (
    <svg className="menu-item-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={paths[type]}
        fill={
          type === 'promoted' || type === 'discover' || type === 'watchlist'
            ? 'currentColor'
            : 'none'
        }
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
