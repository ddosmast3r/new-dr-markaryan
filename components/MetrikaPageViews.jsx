'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackMetrikaPageView } from '@/lib/metrika';

export default function MetrikaPageViews() {
  const pathname = usePathname();
  useEffect(() => { trackMetrikaPageView(pathname); }, [pathname]);
  return null;
}
