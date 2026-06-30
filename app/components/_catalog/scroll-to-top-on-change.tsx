'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

function scrollBehaviorOf(prefersReducedMotion: boolean): ScrollBehavior {
  if (prefersReducedMotion) {
    return 'auto';
  }
  return 'smooth';
}

/** Brings the page back to the top with a smooth scroll when another category opens. */
export function ScrollToTopOnChange() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const hasChanged = previousPathname.current !== pathname;
    previousPathname.current = pathname;
    if (!hasChanged) {
      return;
    }
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    window.scrollTo({ top: 0, behavior: scrollBehaviorOf(query.matches) });
  }, [pathname]);

  return null;
}
