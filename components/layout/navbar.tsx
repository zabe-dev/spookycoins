import Link from 'next/link';
import { Brand } from '@/components/brand';

export function Navbar({ active = 'discover' }: { active?: 'discover' | 'none' }) {
  return (
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
          <button className="wallet-btn">Sign in</button>
        </div>
      </div>
    </div>
  );
}
