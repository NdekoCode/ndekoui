'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import {
  DIVISIONS,
  DIVISIONS_ANCHOR,
  DIVISIONS_SECTION,
  type Division,
} from './data';
import { Reveal } from './reveal';

const TOUR_STEP_MS = 2600;

const TOUR_DIVISIONS = [...DIVISIONS.slice(1), DIVISIONS[0]];

function rowToneOf(isActive: boolean) {
  if (isActive) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

function arrowToneOf(isActive: boolean) {
  if (isActive) {
    return 'translate-x-0 translate-y-0 opacity-100';
  }
  return '-translate-x-2 translate-y-2 opacity-0';
}

function indexLabelOf(index: number) {
  const position = index + 1;
  return String(position).padStart(2, '0');
}

type DivisionRowProps = {
  division: Division;
  index: number;
  isActive: boolean;
  onActivate: (id: string) => void;
};

function DivisionRow({
  division,
  index,
  isActive,
  onActivate,
}: DivisionRowProps) {
  function activate() {
    onActivate(division.id);
  }

  return (
    <li className='hairline-b border-border last:border-b-0'>
      <a
        href='#'
        onPointerEnter={activate}
        onFocus={activate}
        className={cn(
          'focus-visible:ring-ring/25 flex items-baseline gap-4 rounded-md py-5 transition-colors duration-200 outline-none focus-visible:ring-[3px]',
          rowToneOf(isActive)
        )}
      >
        <span className='text-muted-foreground w-8 shrink-0 text-xs tabular-nums'>
          {indexLabelOf(index)}
        </span>
        <span className='text-3xl font-semibold text-balance @2xl:text-5xl'>
          {division.name}
        </span>
        <ArrowUpRightIcon
          className={cn(
            'ms-auto size-6 shrink-0 self-center transition-[translate,opacity] duration-300 ease-(--ease-out-strong)',
            arrowToneOf(isActive)
          )}
        />
      </a>
      <Fold open={isActive}>
        <div className='text-muted-foreground flex flex-col gap-1 ps-12 pb-5 text-[13px]'>
          <p>{division.line}</p>
          <p>{division.where}</p>
        </div>
      </Fold>
    </li>
  );
}

export function Divisions() {
  const [activeId, setActiveId] = useState(DIVISIONS[0].id);
  const [isHovered, setIsHovered] = useState(false);
  const tourSteps = TOUR_DIVISIONS.map((division) => ({
    after: TOUR_STEP_MS,
    run: () => setActiveId(division.id),
  }));
  const { ref } = useAutoplay<HTMLUListElement>(tourSteps, {
    loopAfter: TOUR_STEP_MS,
    isEnabled: !isHovered,
  });

  function hover() {
    setIsHovered(true);
  }

  function leave() {
    setIsHovered(false);
  }

  return (
    <section
      id={DIVISIONS_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-10'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-3xl font-semibold text-balance @2xl:text-4xl'>
            {DIVISIONS_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {DIVISIONS_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <ul
            ref={ref}
            onPointerEnter={hover}
            onPointerLeave={leave}
            className='border-border hairline-t'
          >
            {DIVISIONS.map((division, index) => (
              <DivisionRow
                key={division.id}
                division={division}
                index={index}
                isActive={division.id === activeId}
                onActivate={setActiveId}
              />
            ))}
          </ul>
        </SettleItem>
      </Reveal>
    </section>
  );
}
