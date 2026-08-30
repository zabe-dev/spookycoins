'use client';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import type { LucideIcon } from 'lucide-react';
import { Home, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export type SystemStatePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  primaryLabel?: string;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
};

export function SystemStatePage({
  eyebrow,
  title,
  description,
  icon: Icon,
  primaryLabel = 'Back to home',
  secondaryLabel,
  onSecondaryClick,
}: SystemStatePageProps) {
  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container system-state-shell">
        <div className="system-state-card">
          <div className="system-state-icon">
            <Icon aria-hidden="true" />
          </div>
          <p className="eyebrow">
            <span>●</span> {eyebrow}
          </p>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="system-state-actions">
            <Link className="system-state-primary" href="/">
              <Home aria-hidden="true" />
              {primaryLabel}
            </Link>
            {secondaryLabel && onSecondaryClick && (
              <button className="system-state-secondary" type="button" onClick={onSecondaryClick}>
                <RotateCcw aria-hidden="true" />
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
