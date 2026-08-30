'use client';

import { Clock3, Heart, Rocket, Sparkles, Zap } from 'lucide-react';

export function BoltIcon() {
  return <Zap className="bolt-icon" aria-hidden="true" />;
}

export function DiscoveryIcon({ type }: { type: 'new' | 'presale' | 'watch' }) {
  if (type === 'new') {
    return <Sparkles className="discovery-icon new-icon" aria-hidden="true" />;
  }

  if (type === 'presale') {
    return <Rocket className="discovery-icon trend-icon" aria-hidden="true" />;
  }

  return <Heart className="discovery-icon watch-icon" aria-hidden="true" />;
}

export function AddedMetricIcon() {
  return <Clock3 aria-hidden="true" />;
}
