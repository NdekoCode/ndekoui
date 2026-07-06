'use client';

import { useState } from 'react';

import {
  Globe,
  type GlobeLocation,
  type GlobeMarker,
} from '@/components/core/globe';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { OFFICES, OFFICES_ANCHOR, OFFICES_SECTION, type Office } from './data';
import { isOpenAt, localTimeOf } from './office-time';
import { Reveal } from './reveal';
import { useMinuteNow } from './use-minute-now';

const MARKERS: GlobeMarker[] = OFFICES.map((office) => ({
  location: office.location,
  label: `${office.city}, ${office.country}`,
}));

const TOUR_STEP_MS = 3600;

const TOUR_OFFICES = [...OFFICES.slice(1), OFFICES[0]];

function dotToneOf(isOpen: boolean) {
  if (isOpen) {
    return 'bg-success';
  }
  return 'bg-muted-foreground/40';
}

function rowToneOf(isActive: boolean) {
  if (isActive) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

type OfficeRowProps = {
  office: Office;
  now: number;
  isActive: boolean;
  onPick: (office: Office) => void;
};

function OfficeRow({ office, now, isActive, onPick }: OfficeRowProps) {
  function pick() {
    onPick(office);
  }

  return (
    <li className='hairline-b border-border last:border-b-0'>
      <button
        type='button'
        aria-pressed={isActive}
        onClick={pick}
        className={cn(
          'hover:text-foreground focus-visible:ring-ring/25 flex w-full items-baseline gap-3 rounded-md py-4 text-start transition-colors duration-200 outline-none focus-visible:ring-[3px]',
          rowToneOf(isActive)
        )}
      >
        <span className='text-2xl font-semibold @2xl:text-3xl'>
          {office.city}
        </span>
        <span className='text-muted-foreground text-xs'>{office.country}</span>
        <span className='ms-auto flex items-center gap-2 text-xs tabular-nums'>
          <span
            aria-hidden='true'
            className={cn(
              'size-1.5 rounded-full',
              dotToneOf(isOpenAt(now, office))
            )}
          />
          {localTimeOf(now, office)}
        </span>
      </button>
      <Fold open={isActive}>
        <p className='text-muted-foreground pb-4 text-[13px]'>
          {office.role}, {office.desk}
        </p>
      </Fold>
    </li>
  );
}

export function Offices() {
  const [activeId, setActiveId] = useState(OFFICES[0].id);
  const [focus, setFocus] = useState<GlobeLocation | null>(OFFICES[0].location);

  function pick(office: Office) {
    setActiveId(office.id);
    setFocus(office.location);
  }

  function letGoOfFocus() {
    setFocus(null);
  }

  const tourSteps = TOUR_OFFICES.map((office) => ({
    after: TOUR_STEP_MS,
    run: () => pick(office),
  }));
  const { ref, isInView } = useAutoplay(tourSteps, { loopAfter: TOUR_STEP_MS });
  const now = useMinuteNow(isInView);

  return (
    <section
      id={OFFICES_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-10'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-3xl font-semibold text-balance @2xl:text-4xl'>
            {OFFICES_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {OFFICES_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='grid items-center gap-8 @4xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] @4xl:gap-12'
          >
            <div
              onPointerDownCapture={letGoOfFocus}
              className='flex flex-col items-center gap-3 @4xl:order-last'
            >
              <Globe
                markers={MARKERS}
                focus={focus}
                autoRotate={false}
                label='Globe of the Quillfield offices'
                className='mx-auto max-w-[34rem]'
              />
              <p className='text-muted-foreground text-xs'>
                {OFFICES_SECTION.hint}
              </p>
            </div>
            <ul>
              {OFFICES.map((office) => (
                <OfficeRow
                  key={office.id}
                  office={office}
                  now={now}
                  isActive={office.id === activeId}
                  onPick={pick}
                />
              ))}
            </ul>
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
