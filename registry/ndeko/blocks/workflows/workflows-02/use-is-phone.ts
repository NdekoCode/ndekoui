'use client';

import { useEffect, useState, type RefObject } from 'react';

const PHONE_BELOW = 640;

/**
 * Whether the editor itself is as narrow as a phone, whatever the window: the pipeline then reads
 * from top to bottom. Null until the element has been measured, so nothing is laid out for the
 * wrong width first.
 */
export function useIsPhone(ref: RefObject<HTMLElement | null>) {
  const [isPhone, setIsPhone] = useState<boolean | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setIsPhone(entry.contentRect.width < PHONE_BELOW);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return isPhone;
}
