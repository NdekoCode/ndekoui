'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { UsersIcon } from '@/registry/ndeko/lib/icons';

import { MEMBERS, SECTION } from './data';
import { MemberCard } from './member-card';
import { OpeningCard } from './opening-card';

/** From two columns on, this card sits in the last row, so opening its bio moves no other card. */
const SHOWN_ID = 'mei';

const RESTING_OPEN = [SHOWN_ID];

const NONE_OPEN: string[] = [];

/** `null` until someone opens a bio: closed while the demonstration plays, one open under reduced motion. */
type OpenIds = string[] | null;

function openIdsOf(state: OpenIds, shouldReduceMotion: boolean) {
  if (state !== null) {
    return state;
  }
  if (shouldReduceMotion) {
    return RESTING_OPEN;
  }
  return NONE_OPEN;
}

function withToggled(ids: readonly string[], id: string, isOpen: boolean) {
  const others = ids.filter((candidate) => candidate !== id);
  if (isOpen) {
    return [...others, id];
  }
  return others;
}

export default function TeamSections01() {
  const [state, setState] = useState<OpenIds>(null);
  const { pressed, press } = usePress<string>();
  const shouldReduceMotion = usePrefersReducedMotion();
  const openIds = openIdsOf(state, shouldReduceMotion);

  function setOpen(id: string, isOpen: boolean) {
    const next = withToggled(openIds, id, isOpen);
    setState(next);
  }

  function toggle(id: string) {
    const isOpen = openIds.includes(id);
    setOpen(id, !isOpen);
  }

  const steps = [
    { after: 2600, run: () => press(SHOWN_ID) },
    { after: PRESS_LEAD_MS, run: () => setOpen(SHOWN_ID, true) },
    { after: 4200, run: () => press(SHOWN_ID) },
    { after: PRESS_LEAD_MS, run: () => setOpen(SHOWN_ID, false) },
  ];
  const { ref } = useAutoplay<HTMLElement>(steps, {
    loopAfter: 2400,
    onReset: () => setState(null),
  });
  useKeptHeight(ref);

  return (
    <section ref={ref} className='@container min-h-[61rem]'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <header className='flex max-w-2xl flex-col gap-3'>
          <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
            <UsersIcon className='size-4' />
            {SECTION.label}
          </p>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.lead}
          </p>
        </header>
        <ul className='grid items-start gap-3 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4'>
          {MEMBERS.map((member) => (
            <li key={member.id}>
              <MemberCard
                member={member}
                isOpen={openIds.includes(member.id)}
                isPressed={pressed === member.id}
                onToggle={toggle}
              />
            </li>
          ))}
          <li>
            <OpeningCard />
          </li>
        </ul>
      </div>
    </section>
  );
}
