'use client';

import { useId, useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { UsersIcon } from '@/registry/ndeko/lib/icons';

import { GROUPS, SECTION, type Group } from './data';
import { MemberRow } from './member-row';

const FIRST_SHOWN_ID = 'ben';

const SECOND_SHOWN_ID = 'rosa';

const RESTING_OPEN = [FIRST_SHOWN_ID];

const NONE_OPEN: string[] = [];

const READ_MS = 3600;

/** `null` until someone opens a row: all closed while the demonstration plays, one open under reduced motion. */
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

function peopleWordOf(count: number) {
  if (count === 1) {
    return '1 person';
  }
  return `${count} people`;
}

type TeamGroupProps = {
  group: Group;
  openIds: readonly string[];
  pressed: string | null;
  onToggle: (memberId: string) => void;
};

function TeamGroup({ group, openIds, pressed, onToggle }: TeamGroupProps) {
  const headingId = useId();
  const count = group.members.length;

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-2'>
      <h3
        id={headingId}
        className='flex items-baseline gap-2 px-3 text-[13px] font-medium'
      >
        {group.name}
        <span className='text-muted-foreground text-xs font-normal tabular-nums'>
          {peopleWordOf(count)}
        </span>
      </h3>
      <ul className='flex flex-col gap-1'>
        {group.members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isOpen={openIds.includes(member.id)}
            isPressed={pressed === member.id}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </section>
  );
}

export default function TeamSections02() {
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
    { after: 2200, run: () => press(FIRST_SHOWN_ID) },
    { after: PRESS_LEAD_MS, run: () => setOpen(FIRST_SHOWN_ID, true) },
    { after: READ_MS, run: () => press(FIRST_SHOWN_ID) },
    { after: PRESS_LEAD_MS, run: () => setOpen(FIRST_SHOWN_ID, false) },
    { after: 1200, run: () => press(SECOND_SHOWN_ID) },
    { after: PRESS_LEAD_MS, run: () => setOpen(SECOND_SHOWN_ID, true) },
    { after: READ_MS, run: () => press(SECOND_SHOWN_ID) },
    { after: PRESS_LEAD_MS, run: () => setOpen(SECOND_SHOWN_ID, false) },
  ];
  const { ref } = useAutoplay<HTMLElement>(steps, {
    loopAfter: 2400,
    onReset: () => setState(null),
  });
  useKeptHeight(ref);

  return (
    <section ref={ref} className='@container min-h-[56rem]'>
      <div className='mx-auto grid max-w-6xl gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @4xl:gap-16 @5xl:px-8'>
        <header className='flex max-w-xl flex-col gap-3 self-start'>
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
        <div className='flex flex-col gap-8'>
          {GROUPS.map((group) => (
            <TeamGroup
              key={group.id}
              group={group}
              openIds={openIds}
              pressed={pressed}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
