'use client';

import { useId, useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { ChevronDownIcon, QuoteIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Wash } from '@/registry/ndeko/ui/wash';

import { FEATURE, QUOTE, SECTION } from './data';
import { FeatureNote } from './feature-note';

/** `rest` is closed while the demonstration plays and open under reduced motion, where nothing plays. */
type NoteState = 'rest' | 'open' | 'closed';

const OPEN_AFTER_MS = 2400;

const READ_MS = 4600;

const LOOP_AFTER_MS = 2800;

function isNoteOpen(state: NoteState, shouldReduceMotion: boolean) {
  if (state === 'rest') {
    return shouldReduceMotion;
  }
  return state === 'open';
}

function toggledOf(isOpen: boolean): NoteState {
  if (isOpen) {
    return 'closed';
  }
  return 'open';
}

function spokenOf(state: NoteState) {
  if (state === 'open') {
    return `${FEATURE.name} opened under the quote`;
  }
  return `${FEATURE.name} closed`;
}

function phraseToneOf(isOpen: boolean) {
  if (isOpen) {
    return 'bg-primary/10';
  }
  return 'hover:bg-primary/[0.06]';
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

export default function Testimonials03() {
  const [noteState, setNoteState] = useState<NoteState>('rest');
  const [message, setMessage] = useState('');
  const { pressed, press } = usePress<'phrase'>();
  const noteId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isOpen = isNoteOpen(noteState, shouldReduceMotion);
  const { person } = QUOTE;

  const steps = [
    { after: OPEN_AFTER_MS, run: () => press('phrase') },
    { after: PRESS_LEAD_MS, run: () => setNoteState('open') },
    { after: READ_MS, run: () => press('phrase') },
    { after: PRESS_LEAD_MS, run: () => setNoteState('closed') },
  ];
  const { ref } = useAutoplay<HTMLElement>(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: () => setNoteState('rest'),
  });
  useKeptHeight(ref);

  function toggleNote() {
    const next = toggledOf(isOpen);
    setNoteState(next);
    setMessage(spokenOf(next));
  }

  return (
    <section ref={ref} className='@container min-h-[42rem]'>
      <div className='mx-auto max-w-5xl px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <figure className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] relative isolate flex flex-col rounded-2xl p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @2xl:p-10 @4xl:p-14'>
          <Wash />
          <div className='mb-8 flex flex-wrap items-center justify-between gap-3'>
            <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
              <QuoteIcon className='size-4' />
              {SECTION.label}
            </p>
            <Badge variant='secondary'>Sample quote</Badge>
          </div>
          <blockquote className='text-2xl leading-snug font-medium text-pretty @3xl:text-[2.5rem] @3xl:leading-[1.2]'>
            <p>
              {QUOTE.before}
              <button
                type='button'
                aria-expanded={isOpen}
                aria-controls={noteId}
                onClick={toggleNote}
                className={cn(
                  'text-primary-ink decoration-primary/35 focus-visible:ring-ring/25 -mx-1 cursor-pointer rounded-md px-1 text-start underline decoration-2 underline-offset-[0.18em] transition-[background-color,color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px]',
                  phraseToneOf(isOpen),
                  pressedQuietOf(pressed === 'phrase')
                )}
              >
                {QUOTE.phrase}
                <ChevronDownIcon
                  className={cn(
                    'ms-1 inline size-[0.6em] align-[-0.02em] transition-[rotate] duration-200 ease-(--ease-out-strong)',
                    chevronTurnOf(isOpen)
                  )}
                />
              </button>
              {QUOTE.after}
            </p>
          </blockquote>
          <FeatureNote id={noteId} isOpen={isOpen} />
          <figcaption className='mt-10 flex flex-wrap items-center gap-x-4 gap-y-3'>
            <Avatar seed={person.name} className='size-12' />
            <span className='flex min-w-0 flex-col'>
              <span className='text-base font-medium'>{person.name}</span>
              <span className='text-muted-foreground text-sm'>
                {person.role}
              </span>
            </span>
            <span className='text-muted-foreground flex items-center gap-2 text-sm @xl:ms-auto'>
              <CompanyMark seed={person.company} size='lg' />
              {person.company}
            </span>
          </figcaption>
        </figure>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
