'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Compass,
  Handshake,
  LogOut,
  Megaphone,
  Package,
  Plus,
  Settings,
  Shield,
  Star,
  UserRound,
  Zap,
} from 'lucide-react';
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
            <Link href="/partners" onClick={closeMenu}>
              <MenuIcon type="partners" /> Partners
            </Link>
            <Link href="/advertise" onClick={closeMenu}>
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
                  <Link href="/settings" onClick={closeMenu}>
                    <MenuIcon type="settings" /> Settings
                  </Link>
                  <button className="menu-disabled" disabled>
                    <MenuIcon type="orders" /> Orders <small>Soon</small>
                  </button>
                  {session?.user.role === 'admin' && (
                    <Link href="/admin/dashboard" onClick={closeMenu}>
                      <MenuIcon type="admin" /> Admin panel
                    </Link>
                  )}
                  <button className="logout-action" onClick={() => void logout()}>
                    <MenuIcon type="logout" /> Logout
                  </button>
                </>
              ) : (
                <button className="mobile-login-action" onClick={openAuth}>
                  <UserIcon /> Login or signup
                </button>
              )}
            </div>
          </nav>
          <div className="nav-actions">
            {isSignedIn ? (
              <>
                <Link className="submit-coin-btn" href="/submit">
                  <Plus aria-hidden="true" /> Submit coin
                </Link>
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
                      <Link href="/settings" onClick={() => setUserMenuOpen(false)}>
                        <MenuIcon type="settings" /> Settings
                      </Link>
                      <button className="menu-disabled" disabled>
                        <MenuIcon type="orders" /> Orders <small>Soon</small>
                      </button>
                      {session?.user.role === 'admin' && (
                        <Link href="/admin/dashboard" onClick={() => setUserMenuOpen(false)}>
                          <MenuIcon type="admin" /> Admin panel
                        </Link>
                      )}
                      <button className="logout-action" onClick={() => void logout()}>
                        <MenuIcon type="logout" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                className="wallet-btn auth-login-btn"
                onClick={openAuth}
                aria-label="Open login or signup"
              >
                <UserIcon />
                <span>Login or signup</span>
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
  return <UserRound aria-hidden="true" />;
}

function ChevronDownIcon() {
  return <ChevronDown className="user-avatar-cue" aria-hidden="true" />;
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
    | 'admin'
    | 'logout';
}) {
  const icons = {
    discover: Compass,
    promoted: Zap,
    partners: Handshake,
    advertise: Megaphone,
    watchlist: Star,
    orders: Package,
    settings: Settings,
    admin: Shield,
    logout: LogOut,
  };
  const Icon = icons[type];

  return <Icon className="menu-item-icon" aria-hidden="true" />;
}
