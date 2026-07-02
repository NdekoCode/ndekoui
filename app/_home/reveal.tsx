'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

type RevealTag = 'div' | 'li' | 'p';

type RevealProps = {
  as?: RevealTag;
  /** Milliseconds after the block enters the screen, for a short stagger between neighbours. */
  delay?: number;
  /** Large blocks skip the blur and only fade and rise. */
  isLarge?: boolean;
  className?: string;
  children: ReactNode;
};

/** The block counts as entered once it is a little inside the screen, not at its very edge. */
const ENTER_MARGIN = '0px 0px -12% 0px';

function revealClassOf(isLarge: boolean) {
  if (isLarge) {
    return 'reveal-plain';
  }
  return 'reveal';
}

function delayStyleOf(delay: number) {
  return { '--reveal-delay': `${delay}ms` } as CSSProperties;
}

function hasCrossed(entries: IntersectionObserverEntry[]) {
  return entries.some((entry) => entry.isIntersecting);
}

/** True from the first time the element is inside the screen, and for good. */
function useEnteredOnce(element: HTMLElement | null) {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (!element) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!hasCrossed(entries)) {
          return;
        }
        setHasEntered(true);
        observer.disconnect();
      },
      { rootMargin: ENTER_MARGIN }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return hasEntered;
}

/** Sharpens and rises its content into place the first time it scrolls into view (`reveal` in globals.css). */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  isLarge = false,
  className,
  children,
}: RevealProps) {
  const [block, setBlock] = useState<HTMLElement | null>(null);
  const hasEntered = useEnteredOnce(block);

  return (
    <Tag
      ref={setBlock}
      data-inview={hasEntered}
      style={delayStyleOf(delay)}
      className={cn(revealClassOf(isLarge), className)}
    >
      {children}
    </Tag>
  );
}
