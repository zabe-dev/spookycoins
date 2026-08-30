import Link from 'next/link';

export function CoinAd() {
  return (
    <div className="container coin-ad">
      <small>ADVERTISEMENT</small>
      <span>
        <b>Reach crypto&apos;s earliest coin hunters.</b> Premium inventory · Measured impressions
        and clicks
      </span>
      <Link href="/advertise">View ad packages ↗</Link>
    </div>
  );
}
