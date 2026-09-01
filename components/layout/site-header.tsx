import { Suspense } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Topbar, TopbarFallback } from '@/components/layout/topbar';

export function SiteHeader({ active = 'discover' }: { active?: 'discover' | 'none' }) {
  return (
    <>
      <Suspense fallback={<TopbarFallback />}>
        <Topbar />
      </Suspense>
      <Navbar active={active} />
    </>
  );
}
