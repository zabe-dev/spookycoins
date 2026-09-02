import Image from 'next/image';
import Link from 'next/link';

export function Brand({ beta = false }: { beta?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="SpookyCoins home">
      <span className="brand-mark">
        <Image src="/spookycoins-logo.png" alt="SpookyCoins logo" width={40} height={40} />
      </span>
      <span>spookycoins</span>
      {beta && <em>beta</em>}
    </Link>
  );
}
