'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { Brand } from '@/components/ui/brand';
import { AuthModal } from '@/features/auth/components/auth-modal';

export function Navbar({ active = 'discover' }: { active?: 'discover' | 'none' }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const closeMenu = () => setMenuOpen(false);
  const isSignedIn = Boolean(session?.user);
  const email = session?.user.email || '';
  const userInitials = getEmailInitials(email);
  const accountLabel = getAccountLabel(session?.user.name, email);

  function openAuth() {
    closeMenu();
    setAuthOpen(true);
  }

  async function logout() {
    setUserMenuOpen(false);
    closeMenu();
    await authClient.signOut();
    window.location.replace('/');
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
                      <b>{accountLabel}</b>
                      <small>{email}</small>
                    </span>
                  </div>
                  <Link href="/account" onClick={closeMenu}>
                    <MenuIcon type="watchlist" /> Watchlist
                  </Link>
                  <Link href="/account?section=orders" onClick={closeMenu}>
                    <MenuIcon type="orders" /> Orders
                  </Link>
                  <Link href="/account?section=settings" onClick={closeMenu}>
                    <MenuIcon type="settings" /> Settings
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
            <Link className="submit-coin-btn" href="/submit">
              ＋ Submit coin
            </Link>
            {isSignedIn ? (
              <div
                className="user-menu-wrap"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
                onFocus={() => setUserMenuOpen(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setUserMenuOpen(false);
                  }
                }}
              >
                <button
                  className="user-avatar-btn"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  aria-expanded={userMenuOpen}
                  aria-label="Open user menu"
                >
                  <span>{userInitials}</span>
                  <ChevronDownIcon />
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="desktop-user-card">
                      <span className="user-avatar-btn">{userInitials}</span>
                      <span>
                        <b>{accountLabel}</b>
                        <small>{email}</small>
                      </span>
                    </div>
                    <Link href="/account" onClick={() => setUserMenuOpen(false)}>
                      <MenuIcon type="watchlist" /> Watchlist
                    </Link>
                    <Link href="/account?section=orders" onClick={() => setUserMenuOpen(false)}>
                      <MenuIcon type="orders" /> Orders
                    </Link>
                    <Link href="/account?section=settings" onClick={() => setUserMenuOpen(false)}>
                      <MenuIcon type="settings" /> Settings
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

function getAccountLabel(name?: string | null, email?: string) {
  return name || email?.split('@')[0] || 'Account';
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

function ChevronDownIcon() {
  return (
    <svg className="user-avatar-cue" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.1 6.2a.8.8 0 0 1 1.1 0L8 8.9l2.8-2.7a.8.8 0 1 1 1.1 1.1L8.6 10.5a.9.9 0 0 1-1.2 0L4.1 7.3a.8.8 0 0 1 0-1.1Z" />
    </svg>
  );
}

function MenuIcon({
  type,
}: {
  type:
    | 'discover'
    | 'promoted'
    | 'partners'
    | 'advertise'
    | 'watchlist'
    | 'orders'
    | 'settings'
    | 'logout';
}) {
  const paths = {
    discover: 'M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Zm8-4 2.2 4.2L10 14.4 12 8Z',
    promoted: 'M13 2 4 14h7l-1 8 10-13h-7l1-7Z',
    partners: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 10v-1a8 8 0 0 0-16 0v1m18-10a3 3 0 1 0 0-6',
    advertise: 'M4 7h3l9-3v16l-9-3H4V7Zm0 0v10m13-7 3 2-3 2',
    watchlist: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z',
    orders: 'M6 3h12l1 4H5l1-4Zm-1 4h14l-1 14H6L5 7Zm4 4h6m-6 4h5',
    settings: 'M5 7h14M5 17h14M8 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm5 10a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z',
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
