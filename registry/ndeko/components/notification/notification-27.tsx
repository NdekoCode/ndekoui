'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  EclipseIcon,
  EyeIcon,
  MailIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { rowCollapseOf } from './_parts/collapse';
import { PEOPLE, type Person } from './_parts/people';
import { SenderAvatar, type NotificationKind } from './_parts/sender-avatar';
import { Swap } from './_parts/swap';
import { UnreadDot } from './_parts/unread-dot';

type StatusMeta = { label: string; color: string; glyph: Icon };

const IN_PROGRESS: StatusMeta = {
  label: 'In progress',
  color: 'var(--warning)',
  glyph: EclipseIcon,
};

const IN_REVIEW: StatusMeta = {
  label: 'In review',
  color: 'var(--primary)',
  glyph: EyeIcon,
};

type EarlierUpdate = {
  id: string;
  kind: NotificationKind;
  person: Person;
  text: string;
  quote?: string;
  age: string;
};

const EARLIER_UPDATES: EarlierUpdate[] = [
  {
    id: 'comment',
    kind: 'comment',
    person: PEOPLE.mei,
    text: 'commented',
    quote:
      'The empty week only shows on Safari when the month starts on a Sunday',
    age: 'Yesterday',
  },
  {
    id: 'assigned',
    kind: 'assigned',
    person: PEOPLE.sana,
    text: 'assigned it to you',
    age: 'Mon',
  },
];

function earlierLabelOf(count: number, isOpen: boolean) {
  if (isOpen) {
    return 'Hide earlier updates';
  }
  if (count === 1) {
    return 'Show 1 earlier update';
  }
  return `Show ${count} earlier updates`;
}

function readLabelOf(isUnread: boolean) {
  if (isUnread) {
    return 'Mark as read';
  }
  return 'Mark as unread';
}

function StatusChip({ status }: { status: StatusMeta }) {
  const Glyph = status.glyph;
  const chipStyle = { '--chip': status.color } as React.CSSProperties;

  return (
    <span
      style={chipStyle}
      className='chip-3d inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap'
    >
      <Glyph strokeWidth={2.25} className='size-3' />
      {status.label}
    </span>
  );
}

function TaskChip() {
  return (
    <a
      href='#'
      className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 -mx-1.5 flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 outline-none focus-visible:ring-[3px]'
    >
      <span
        role='img'
        aria-label='Bug'
        className='gem-plate inline-flex size-4 shrink-0 items-center justify-center rounded-[5px] [--gem:var(--destructive)]'
      >
        <CircleAlertIcon strokeWidth={2.5} className='size-2.5' />
      </span>
      <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
        FRN-148
      </span>
      <span className='truncate text-[13px] font-medium'>
        Booking calendar skips a week
      </span>
    </a>
  );
}

function EarlierRow({ update }: { update: EarlierUpdate }) {
  return (
    <li className='flex items-start gap-3'>
      <SenderAvatar person={update.person} kind={update.kind} />
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <p className='text-muted-foreground text-[13px] leading-5'>
          <span className='text-foreground font-medium'>
            {update.person.name}
          </span>{' '}
          {update.text}
          <span className='text-xs tabular-nums'> · {update.age}</span>
        </p>
        {update.quote && (
          <blockquote className='bg-foreground/[0.025] hairline-ring ring-border rounded-lg px-3 py-2 text-[13px] leading-5'>
            {update.quote}
          </blockquote>
        )}
      </div>
    </li>
  );
}

export default function Notification27() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const earlierId = useId();
  const [isUnread, setIsUnread] = useState(true);
  const [isEarlierOpen, setIsEarlierOpen] = useState(false);
  const readLabel = readLabelOf(isUnread);

  function toggleEarlier() {
    setIsEarlierOpen((current) => !current);
  }

  function toggleRead() {
    setIsUnread((current) => !current);
  }

  return (
    <article
      aria-label='Updates on FRN-148'
      className='bg-card hairline-ring ring-border relative flex w-full max-w-[26rem] flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex items-center gap-2'>
        <TaskChip />
        <span className='ms-auto flex shrink-0 items-center gap-2'>
          <span className='text-muted-foreground text-xs tabular-nums'>4m</span>
          <UnreadDot isUnread={isUnread} />
        </span>
      </div>
      <div className='flex items-start gap-3'>
        <SenderAvatar person={PEOPLE.leo} kind='status' />
        <div className='flex min-w-0 flex-col gap-1.5'>
          <p className='text-muted-foreground text-[13px] leading-5'>
            <span
              className={cn(
                'font-medium transition-colors duration-200',
                isUnread && 'text-foreground'
              )}
            >
              Léo Martin
            </span>{' '}
            changed the status
          </p>
          <p className='flex flex-wrap items-center gap-1.5'>
            <StatusChip status={IN_PROGRESS} />
            <ArrowRightIcon className='text-muted-foreground size-3.5' />
            <span className='sr-only'>to</span>
            <StatusChip status={IN_REVIEW} />
          </p>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isEarlierOpen && (
          <motion.div
            key='earlier'
            id={earlierId}
            variants={rowCollapseOf(shouldReduceMotion)}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='-mx-1 -mb-3 overflow-hidden px-1'
          >
            <ul
              aria-label='Earlier updates'
              className='flex flex-col gap-3 pb-3'
            >
              {EARLIER_UPDATES.map((update) => (
                <EarlierRow key={update.id} update={update} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <div className='-mx-1.5 flex items-center justify-between gap-2'>
        <Button
          variant='ghost'
          size='sm'
          aria-expanded={isEarlierOpen}
          aria-controls={earlierId}
          onClick={toggleEarlier}
          className='text-muted-foreground'
        >
          <ChevronDownIcon
            className={cn(
              'transition-transform duration-200 ease-(--ease-out-strong)',
              isEarlierOpen && 'rotate-180'
            )}
          />
          {earlierLabelOf(EARLIER_UPDATES.length, isEarlierOpen)}
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={toggleRead}
          className='text-muted-foreground'
        >
          <Swap swapKey={String(isUnread)}>
            {isUnread && <CheckIcon className='size-4' />}
            {!isUnread && <MailIcon className='size-4' />}
          </Swap>
          {readLabel}
        </Button>
      </div>
    </article>
  );
}
