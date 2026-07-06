'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { type NavLink } from './data';

const HIGHLIGHT_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};

const INSTANT_LAYOUT: Transition = {
  layout: { duration: 0 },
  opacity: { duration: 0.15 },
};

function highlightTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_LAYOUT;
  }
  return HIGHLIGHT_TRANSITION;
}

type NavLinksProps = {
  links: NavLink[];
};

export function NavLinks({ links }: NavLinksProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const highlightTransition = highlightTransitionOf(shouldReduceMotion);

  function clearHover() {
    setHoveredId(null);
  }

  return (
    <nav aria-label='Main'>
      <ul className='flex items-center' onPointerLeave={clearHover}>
        {links.map((link) => {
          const isHovered = hoveredId === link.id;

          function highlight() {
            setHoveredId(link.id);
          }

          return (
            <li key={link.id}>
              <a
                href={link.href}
                onPointerEnter={highlight}
                onFocus={highlight}
                onBlur={clearHover}
                className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 relative inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-[3px]'
              >
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      layoutId='marketing-12-nav-highlight'
                      aria-hidden='true'
                      className='bg-foreground/5 absolute inset-0 rounded-full'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={highlightTransition}
                    />
                  )}
                </AnimatePresence>
                <span className='relative'>{link.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
