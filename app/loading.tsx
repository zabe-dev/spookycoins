import { SiteHeader } from '@/components/layout/site-header';

export default function Loading() {
  return (
    <main className="market-page">
      <SiteHeader active="none" />
      <section className="container system-state-shell">
        <div className="system-state-card system-state-loading" aria-label="Loading page">
          <div />
          <div />
          <div />
          <div />
        </div>
      </section>
    </main>
  );
}
