'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { FEED_ANCHOR, FEED_SECTION, GROUP_CARDS, type FeedEvent } from './data';
import {
  SESSION,
  shownEventsOf,
  spentCentsOf,
  yourShareCentsOf,
} from './feed-session';
import { CENTS_FORMAT, moneyOf } from './money';
import { PopShape } from './pop-shape';
import { Reveal } from './reveal';

const LISBON = GROUP_CARDS[0];

function shareCentsOf(event: FeedEvent) {
  return Math.round(event.amountCents / event.ways);
}

type FeedRowProps = {
  event: FeedEvent;
  isOpen: boolean;
  onToggle: (id: string) => void;
};

function FeedRow({ event, isOpen, onToggle }: FeedRowProps) {
  const panelId = useId();
  const shareCents = shareCentsOf(event);

  function toggle() {
    onToggle(event.id);
  }

  return (
    <div className='flex flex-col'>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggle}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex w-full items-center gap-3 rounded-xl p-3 text-start transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
      >
        <Avatar
          seed={event.payer}
          role='img'
          aria-label={event.payer}
          className='size-8'
        />
        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='truncate text-[13px] font-medium'>
            {event.payer} paid
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {event.place}
          </span>
        </span>
        <span className='flex shrink-0 flex-col items-end gap-0.5'>
          <span className='text-[13px] font-medium tabular-nums'>
            {moneyOf(event.amountCents)}
          </span>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {event.ways} ways
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <Fold open={isOpen} id={panelId}>
        <ul className='flex flex-wrap gap-2 px-3 ps-14 pb-3'>
          {event.owing.map((name) => (
            <li
              key={name}
              className='bg-foreground/[0.05] flex items-center gap-1.5 rounded-full py-1 ps-1 pe-2.5 text-xs'
            >
              <Avatar
                seed={name}
                role='img'
                aria-label={name}
                className='size-5'
              />
              <span>{name.split(' ')[0]}</span>
              <Badge variant='warning'>owes {moneyOf(shareCents)}</Badge>
            </li>
          ))}
        </ul>
      </Fold>
    </div>
  );
}

export function Feed() {
  const { ref, state, act } = useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);
  const events = shownEventsOf(state);
  const spentCents = spentCentsOf(state);
  const shareCents = yourShareCentsOf(state);
  useKeptHeight(ref);

  function toggleRow(id: string) {
    act({ type: 'toggled', id });
  }

  return (
    <section
      id={FEED_ANCHOR}
      className='relative overflow-x-clip px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <PopShape
        kind='square'
        series={3}
        className='top-12 right-6 size-10 -rotate-6 @3xl:top-20 @3xl:right-24 @3xl:size-14'
      />
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {FEED_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {FEED_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='bg-foreground/[0.03] grid min-h-[34rem] gap-2 rounded-2xl p-2 @3xl:min-h-[26rem] @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-3 @3xl:p-3'
          >
            <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col justify-between gap-6 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <div className='flex flex-col gap-1'>
                <p className='text-muted-foreground text-xs'>
                  {LISBON.name}, {FEED_SECTION.totalLabel.toLowerCase()}
                </p>
                <p className='text-4xl font-semibold tabular-nums'>
                  <MotionNumber
                    value={spentCents / 100}
                    prefix='$'
                    format={CENTS_FORMAT}
                  />
                </p>
              </div>
              <div className='flex items-end justify-between gap-3'>
                <div className='flex flex-col gap-1'>
                  <p className='text-muted-foreground text-xs'>
                    {FEED_SECTION.yourShareLabel}
                  </p>
                  <p className='text-xl font-medium tabular-nums'>
                    <MotionNumber
                      value={shareCents / 100}
                      prefix='$'
                      format={CENTS_FORMAT}
                    />
                  </p>
                </div>
                <div className='flex -space-x-1.5'>
                  {LISBON.members.map((member) => (
                    <Avatar
                      key={member}
                      seed={member}
                      role='img'
                      aria-label={member}
                      className='ring-card size-7 ring-2'
                    />
                  ))}
                </div>
              </div>
              <p className='text-muted-foreground text-xs'>
                {FEED_SECTION.note}
              </p>
            </div>
            <ul className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <AnimatePresence initial={false}>
                {events.map((event) => (
                  <motion.li
                    key={event.id}
                    initial={presence.initial}
                    animate={presence.animate}
                    exit={presence.exit}
                    transition={presence.transition}
                    className='overflow-hidden'
                  >
                    <FeedRow
                      event={event}
                      isOpen={state.openId === event.id}
                      onToggle={toggleRow}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
