'use client';
/* eslint-disable @next/next/no-img-element -- Project logos can come from submitted URLs later. */

import { BoltIcon } from '@/features/coins/components';
import { FormattedPrice } from '@/features/coins/components/formatted-price';
import { Copy } from 'lucide-react';
import type { CoinDetailView } from '../types';
import { CoinSocialActions } from './coin-social-actions';

function shortenContract(address: string) {
  if (!address || address === '—') return '—';
  if (address.length <= 18) return address;

  return `${address.slice(0, 10)}......${address.slice(-6)}`;
}

export function CoinHero({
  coin,
  contractAddress,
  contractCopied,
  onCopyContract,
  onShare,
  onReport,
}: {
  coin: CoinDetailView;
  contractAddress: string;
  contractCopied: boolean;
  onCopyContract: () => void;
  onShare: () => void;
  onReport: () => void;
}) {
  const hasContract = Boolean(coin.contractAddress && contractAddress && contractAddress !== '—');

  return (
    <section className="container coin-hero">
      <div className="coin-heading-main">
        <div className="coin-identity">
          <div className={`detail-logo ${coin.color}`}>
            {coin.image ? <img src={coin.image} alt="" /> : coin.logo}
          </div>
          <div className="coin-title-copy">
            <div className="coin-name-line">
              <h1
                className={coin.boost === 500 ? 'gold-name gold-name-animated' : ''}
                title={coin.name}
              >
                {coin.name}
              </h1>
              {coin.boost && (
                <span className={`boost-badge boost-${coin.boost}`}>
                  <BoltIcon />
                  {coin.boost}×
                </span>
              )}
            </div>
            <div className="coin-meta-row">
              <span className="coin-symbol">${coin.symbol}</span>
              <span className="coin-meta-chain">
                <ChainIcon coin={coin} />
                {coin.networkName}
              </span>
              <span>{coin.category}</span>
            </div>
          </div>
        </div>
        <div className="coin-heading-trade">
          <div className="coin-hero-stat contract-stat">
            <span className="contract-box-label">
              {contractCopied ? 'Copied' : 'Contract address'}
            </span>
            <button
              className="contract-box"
              type="button"
              onClick={onCopyContract}
              disabled={!hasContract}
              title={hasContract ? `Copy ${contractAddress}` : 'No contract address available'}
            >
              <span className="contract-box-value">
                <ChainIcon coin={coin} />
                <code>{shortenContract(contractAddress)}</code>
                {hasContract && <Copy aria-hidden="true" />}
              </span>
            </button>
          </div>
          <SecurityChip label="KYC" url={coin.security.kycUrl} />
          <SecurityChip label="Audit" url={coin.security.auditUrl} />
          <div className="coin-hero-stat coin-price-block">
            <small>PRICE USD</small>
            <div>
              <strong>
                <FormattedPrice value={coin.price} />
              </strong>
              {coin.price !== '—' && (
                <span className={coin.change >= 0 ? 'positive' : 'negative'}>
                  {coin.change >= 0 ? '+' : ''}
                  {coin.change}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="coin-heading-actions">
        <CoinSocialActions links={coin.links} onShare={onShare} onReport={onReport} />
      </div>
    </section>
  );
}

function SecurityChip({ label, url }: { label: 'KYC' | 'Audit'; url: string | null }) {
  const content = (
    <>
      <span>{label}</span>
      <b>{url ? 'Verified' : '-'}</b>
    </>
  );

  if (!url) return <span className="coin-security-chip muted">{content}</span>;

  return (
    <a className="coin-security-chip" href={url} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
}

function ChainIcon({ coin }: { coin: CoinDetailView }) {
  return (
    <span className="contract-chain-icon" title={coin.networkName}>
      {coin.chainIcon ? <img src={coin.chainIcon} alt="" /> : coin.chain[0]}
    </span>
  );
}
