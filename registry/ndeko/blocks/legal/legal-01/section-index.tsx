'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import type { LegalSection } from './data';
import { currentSectionOf, sectionDomIdOf } from './legal-model';

const ROW_HEIGHT_PX = 28;

function scrollBehaviorOf(shouldReduceMotion: boolean | null): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function linkToneOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'text-foreground';
  }
  return 'text-muted-foreground hover:text-foreground';
}

function ariaCurrentOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'location';
  }
  return undefined;
}

/** Follows the window scroll once per frame and names the section being read. */
export function useCurrentSection(
  documentId: string,
  sections: LegalSection[]
) {
  const [currentId, setCurrentId] = useState(sections[0].id);

  useEffect(() => {
    let frame = 0;

    function measure() {
      frame = 0;
      const next = currentSectionOf(documentId, sections);
      setCurrentId(next);
    }

    function schedule() {
      if (frame !== 0) {
        return;
      }
      frame = window.requestAnimationFrame(measure);
    }

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [documentId, sections]);

  return currentId;
}

type SectionIndexProps = {
  documentId: string;
  sections: LegalSection[];
  currentId: string;
};

/** The sections of the open document, with a marker that travels to the one being read. */
export function SectionIndex({
  documentId,
  sections,
  currentId,
}: SectionIndexProps) {
  const shouldReduceMotion = useReducedMotion();
  const currentIndex = sections.findIndex(
    (section) => section.id === currentId
  );
  const markerIndex = Math.max(currentIndex, 0);
  const markerOffset = markerIndex * ROW_HEIGHT_PX;
  const markerStyle = {
    height: ROW_HEIGHT_PX,
    transform: `translateY(${markerOffset}px)`,
  };

  function jumpTo(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const domId = sectionDomIdOf(documentId, id);
    const heading = document.getElementById(domId);
    if (!heading) {
      return;
    }
    event.preventDefault();
    const behavior = scrollBehaviorOf(shouldReduceMotion);
    heading.scrollIntoView({ behavior, block: 'start' });
    heading.focus({ preventScroll: true });
  }

  return (
    <nav aria-label='On this page' className='flex flex-col gap-2'>
      <p className='text-muted-foreground text-xs'>On this page</p>
      <div className='relative'>
        <span
          aria-hidden='true'
          className='hairline-l border-border absolute inset-y-0 start-0'
        />
        <span
          aria-hidden='true'
          style={markerStyle}
          className='absolute start-0 top-0 flex w-0.5 py-1.5 transition-transform duration-300 ease-(--ease-out-strong)'
        >
          <span className='bg-primary w-full rounded-full' />
        </span>
        <ul className='flex flex-col'>
          {sections.map((section) => {
            const isCurrent = section.id === currentId;
            const domId = sectionDomIdOf(documentId, section.id);

            return (
              <li key={section.id}>
                <a
                  href={`#${domId}`}
                  aria-current={ariaCurrentOf(isCurrent)}
                  onClick={(event) => jumpTo(event, section.id)}
                  className={cn(
                    'focus-visible:ring-ring/25 flex h-7 items-center truncate rounded-sm ps-3.5 text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]',
                    linkToneOf(isCurrent)
                  )}
                >
                  {section.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
