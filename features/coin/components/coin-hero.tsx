'use client';
/* eslint-disable @next/next/no-img-element -- Project logos can come from submitted URLs later. */

import { BoltIcon } from '@/features/coins/components';
import type { CoinDetailView } from '../types';
import { CoinSocialActions } from './coin-social-actions';

export function CoinHero({
  coin,
  contractAddress,
  contractCopied,
  onCopyContract,
}: {
  coin: CoinDetailView;
  contractAddress: string;
  contractCopied: boolean;
  onCopyContract: () => void;
}) {
  return (
    <section className="container coin-hero">
      <div className="coin-heading-main">
        <div className="coin-identity">
          <div className={`detail-logo ${coin.color}`}>
            {coin.image ? <img src={coin.image} alt="" /> : coin.logo}
            <span>{coin.chain}</span>
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
              <div className="contract-line">
                <code title={contractAddress}>{contractAddress}</code>
                {coin.contractAddress && (
                  <button onClick={onCopyContract} aria-label="Copy contract address">
                    {contractCopied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <span>{coin.chain}</span>
              <span>{coin.category}</span>
            </div>
            <CoinSocialActions buyUrl={coin.buyUrl} />
          </div>
        </div>
        <div className="coin-heading-trade">
          <div className="coin-price-block">
            <small>PRICE USD</small>
            <div>
              <strong>{coin.price}</strong>
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
    </section>
  );
}
