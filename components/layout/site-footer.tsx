import { Brand } from '@/components/ui/brand';
import Link from 'next/link';

export function SiteFooter({ id }: { id?: string }) {
  return (
    <footer className="container footer" id={id}>
      <Brand />
      <p>Community-powered crypto discovery.</p>
      <div>
        <Link href="/#leaderboard">Methodology</Link>
        <Link href="/advertise">Advertise</Link>
        <Link href="/partners">Partners</Link>
      </div>
    </footer>
  );
}
