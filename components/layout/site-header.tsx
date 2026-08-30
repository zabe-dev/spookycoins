'use client';

import { Navbar } from '@/components/layout/navbar';
import { Topbar } from '@/components/layout/topbar';

export function SiteHeader({ active = 'discover' }: { active?: 'discover' | 'none' }) {
  return (
    <>
      <Topbar />
      <Navbar active={active} />
    </>
  );
}
