'use client';

import { motion, type Transition } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { INSTANT, SPRING } from '@/registry/ndeko/lib/motion-presets';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';

import type { Section } from './pages';

function travelOf(shouldReduceMotion: boolean): Transition {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SPRING;
}

function currentOf(isActive: boolean): 'location' | undefined {
  if (isActive) {
    return 'location';
  }
  return undefined;
}

type OnThisPageProps = {
  sections: Section[];
  activeId: string;
  headingIdOf: (headingId: string) => string;
  onJump: (headingId: string) => void;
};

export function OnThisPage({
  sections,
  activeId,
  headingIdOf,
  onJump,
}: OnThisPageProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const markerId = useId();

  return (
    <nav aria-label='On this page' className='flex flex-col gap-3'>
      <p className='text-muted-foreground text-xs font-medium'>On this page</p>
      <ol className='hairline-l border-border flex flex-col'>
        {sections.map((section) => {
          const isActive = section.id === activeId;

          function jump(event: React.MouseEvent<HTMLAnchorElement>) {
            event.preventDefault();
            onJump(section.id);
          }

          return (
            <li key={section.id} className='relative'>
              {isActive && (
                <motion.span
                  layoutId={markerId}
                  transition={travelOf(shouldReduceMotion)}
                  className='bg-primary absolute inset-y-1.5 -start-px w-0.5 rounded-full'
                />
              )}
              <a
                href={`#${headingIdOf(section.id)}`}
                aria-current={currentOf(isActive)}
                onClick={jump}
                className={cn(
                  'text-muted-foreground hover:text-foreground block rounded-sm py-1.5 ps-3 text-[13px] transition-colors duration-150',
                  isActive && 'text-foreground',
                  FOCUS_RING
                )}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
