import Link from 'next/link';

export function CoinAd() {
  return (
    <div className="container wide-banner">
      <small>FULL-WIDTH ADVERTISEMENT</small>
      <div>
        <b>Reach crypto&apos;s earliest coin hunters.</b>
        <span>Premium inventory · Measured impressions and clicks</span>
      </div>
      <Link href="/advertise">View ad packages ↗</Link>
    </div>
  );
}
