'use client';

import { useMemo } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { type StudioSection } from './data';
import { useActiveSection } from './use-active-section';

type RailStyle = React.CSSProperties & { '--index': number };

function idOf(section: StudioSection): string {
  return section.id;
}

function currentAttributeOf(isActive: boolean) {
  if (isActive) {
    return 'true' as const;
  }
  return undefined;
}

function dotClassOf(isActive: boolean) {
  if (isActive) {
    return 'bg-primary scale-[1.35]';
  }
  return 'bg-foreground/30 group-hover/dot:bg-foreground/60';
}

type SectionRailProps = {
  sections: readonly StudioSection[];
};

export function SectionRail({ sections }: SectionRailProps) {
  const ids = useMemo(() => sections.map(idOf), [sections]);
  const activeId = useActiveSection(ids);
  const activeIndex = Math.max(0, ids.indexOf(activeId));
  const ringStyle: RailStyle = { '--index': activeIndex };

  return (
    <nav
      aria-label='Sections'
      className='fixed end-2 top-1/2 z-20 -translate-y-1/2 sm:end-4'
    >
      <ol className='relative flex flex-col'>
        <span
          aria-hidden='true'
          style={ringStyle}
          className='hairline-ring ring-primary/50 absolute start-0 top-0 size-6 translate-y-[calc(var(--index)*1.5rem)] rounded-full transition-[translate] duration-300 ease-(--ease-out-strong) motion-reduce:transition-none'
        />
        {sections.map((section) => {
          const isActive = section.id === activeId;

          return (
            <li key={section.id} className='group/dot relative'>
              <a
                href={`#${section.id}`}
                aria-label={`${section.number} ${section.name}`}
                aria-current={currentAttributeOf(isActive)}
                className='focus-visible:ring-ring/25 flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-[3px]'
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full transition-[background-color,scale] duration-200',
                    dotClassOf(isActive)
                  )}
                />
              </a>
              <span
                aria-hidden='true'
                className='surface-raised pointer-events-none absolute end-full top-1/2 me-2 -translate-y-1/2 rounded-md px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity duration-150 group-focus-within/dot:opacity-100 group-hover/dot:opacity-100'
              >
                <span className='text-muted-foreground tabular-nums'>
                  {section.number}
                </span>{' '}
                {section.name}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
