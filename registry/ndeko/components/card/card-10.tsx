'use client';

import { useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { FileTextIcon, PinIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { PEOPLE } from './_parts/people';
import { pressedShapeOf } from './_parts/pressed-shape';
import { useCardDemo } from './_parts/use-card-demo';
import { useHover, usePeek } from './_parts/use-peek';

export type PaperFile = {
  name: string;
  /** The kind and the size as they read: "PDF", "2.4 MB". */
  kind: string;
  size: string;
  /** When it last changed, as the card shows it: "Edited 2h ago". */
  edited: string;
};

export type PaperPerson = {
  id: string;
  name: string;
  role: string;
};

type GemStyle = React.CSSProperties & { '--gem': string };

const FILE_GEM: GemStyle = { '--gem': 'var(--primary)' };

const STACK = [
  'group/stack @container relative block h-60 w-full cursor-pointer rounded-xl text-start outline-none',
  'transition-[scale] duration-150 ease-(--ease-out-strong) active:scale-[0.98]',
  'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-4',
].join(' ');

/** A piece rises first and turns a moment later: the second delay is the one of its rotation. */
const MOVING = [
  'origin-bottom transition-[translate,rotate] duration-300 ease-(--ease-out-strong)',
  '[transition-delay:0ms,70ms]',
].join(' ');

const SHEET = cn(
  'bg-card hairline-ring ring-border absolute inset-x-14 bottom-4 flex h-32 flex-col gap-2 rounded-lg p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
  MOVING
);

/** Two profile cards fan out side by side, so they narrow under 20rem to keep the names in the clear. */
const PROFILE = cn(
  'bg-card hairline-ring ring-border absolute bottom-24 flex h-14 w-36 items-center gap-2 rounded-lg p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @max-xs:w-32',
  MOVING
);

/** Each sheet rests behind the card with its top showing, and has its own place in the fan. */
const SHEETS = [
  {
    id: 'left',
    pose: '-translate-y-3 -rotate-2 group-data-[fanned=true]/stack:-translate-x-6 group-data-[fanned=true]/stack:-translate-y-16 group-data-[fanned=true]/stack:rotate-[-8deg]',
  },
  {
    id: 'right',
    pose: '-translate-y-3 rotate-2 group-data-[fanned=true]/stack:translate-x-6 group-data-[fanned=true]/stack:-translate-y-16 group-data-[fanned=true]/stack:rotate-[8deg]',
  },
  {
    id: 'middle',
    pose: '-translate-y-5 group-data-[fanned=true]/stack:-translate-y-20',
  },
];

const PROFILE_POSES = [
  'start-7 -rotate-6 group-data-[fanned=true]/stack:-translate-x-5 group-data-[fanned=true]/stack:-translate-y-12 group-data-[fanned=true]/stack:rotate-[-10deg] @max-3xs:start-5',
  'end-7 rotate-6 group-data-[fanned=true]/stack:translate-x-5 group-data-[fanned=true]/stack:-translate-y-12 group-data-[fanned=true]/stack:rotate-[10deg] @max-3xs:end-5',
];

function Sheet({ pose }: { pose: string }) {
  return (
    <span aria-hidden='true' className={cn(SHEET, pose)}>
      <span className='bg-foreground/10 h-1 w-2/3 rounded-full' />
      <span className='bg-foreground/10 h-1 rounded-full' />
      <span className='bg-foreground/10 h-1 w-5/6 rounded-full' />
    </span>
  );
}

function ProfileCard({ person, pose }: { person: PaperPerson; pose: string }) {
  return (
    <span aria-hidden='true' className={cn(PROFILE, pose)}>
      <Avatar seed={person.name} className='size-7 @max-xs:size-6' />
      <span className='min-w-0'>
        <span className='block truncate text-xs font-medium'>
          {person.name}
        </span>
        <span className='text-muted-foreground block truncate text-xs'>
          {person.role}
        </span>
      </span>
    </span>
  );
}

function sharedWithOf(people: PaperPerson[]) {
  if (people.length === 0) {
    return 'not shared yet';
  }
  const names = people.map((person) => person.name);
  const list = names.join(' and ');
  return `shared with ${list}`;
}

export type PaperStackProps = {
  file: PaperFile;
  /** The people the file is shared with. The first two have their card behind it. */
  people: PaperPerson[];
  /** Whether the stack stays fanned out once the pointer has left. */
  isPinned: boolean;
  onPinnedChange: (isPinned: boolean) => void;
  /** Fans the stack out with no pointer on it, for a demonstration. */
  isFanned?: boolean;
  /** Shows the stack held down, for a demonstration that presses it. */
  isPressed?: boolean;
  className?: string;
};

export function PaperStack({
  file,
  people,
  isPinned,
  onPinnedChange,
  isFanned = false,
  isPressed = false,
  className,
}: PaperStackProps) {
  const { isPeeking, peekHandlers } = usePeek();
  const isHeldOpen = isFanned || isPinned;
  const showsFan = isPeeking || isHeldOpen;
  const shownPeople = people.slice(0, PROFILE_POSES.length);
  const sharedWith = sharedWithOf(people);
  const label = `${file.name}, ${sharedWith}. Keep the papers fanned out`;

  function togglePinned() {
    onPinnedChange(!isPinned);
  }

  return (
    <button
      type='button'
      aria-pressed={isPinned}
      aria-label={label}
      data-fanned={showsFan}
      onClick={togglePinned}
      className={cn(STACK, pressedShapeOf(isPressed), className)}
      {...peekHandlers}
    >
      {SHEETS.map((sheet) => (
        <Sheet key={sheet.id} pose={sheet.pose} />
      ))}
      {shownPeople.map((person, index) => (
        <ProfileCard
          key={person.id}
          person={person}
          pose={PROFILE_POSES[index]}
        />
      ))}
      <span className='bg-card hairline-ring ring-border absolute inset-x-10 bottom-0 flex h-36 flex-col justify-between rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @max-xs:inset-x-4'>
        <span className='flex items-start gap-3'>
          <span
            style={FILE_GEM}
            className='gem-plate flex size-9 shrink-0 items-center justify-center rounded-lg'
          >
            <FileTextIcon className='size-4' />
          </span>
          <span className='min-w-0 flex-1'>
            <span className='line-clamp-2 text-[13px] font-medium'>
              {file.name}
            </span>
            <span className='text-muted-foreground block truncate text-xs tabular-nums'>
              {file.kind} · {file.size}
            </span>
          </span>
          <Swap swapKey={String(isPinned)} className='mt-0.5'>
            {isPinned && (
              <PinIcon
                fill='currentColor'
                className='text-primary-ink size-4'
              />
            )}
            {!isPinned && <PinIcon className='text-muted-foreground size-4' />}
          </Swap>
        </span>
        <span className='flex items-center justify-between gap-2'>
          <span className='flex items-center'>
            {people.map((person) => (
              <Avatar
                key={person.id}
                seed={person.name}
                className='ring-card -ms-1.5 size-5 ring-2 first:ms-0'
              />
            ))}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {file.edited}
          </span>
        </span>
      </span>
    </button>
  );
}

const FILE: PaperFile = {
  name: 'Board report, third quarter.pdf',
  kind: 'PDF',
  size: '2.4 MB',
  edited: 'Edited 2h ago',
};

const SHARED_WITH: PaperPerson[] = [PEOPLE.amara, PEOPLE.jonas];

function announcementOf(isPinned: boolean) {
  if (isPinned) {
    return 'The papers stay fanned out';
  }
  return 'The papers are back behind the card';
}

export default function Card10() {
  const [isPinned, setIsPinned] = useState(false);
  const [isFanned, setIsFanned] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const { pressed, press } = usePress<'stack'>();
  const { isHovered, hoverHandlers } = useHover();

  function startOver() {
    setIsPinned(false);
    setIsFanned(false);
  }

  /** Only a person's press is said: a pointer resting on the stack pauses the demonstration, and that pause must stay silent. */
  function pinFromStack(nextIsPinned: boolean) {
    setIsPinned(nextIsPinned);
    setAnnouncement(announcementOf(nextIsPinned));
  }

  const steps: AutoplayStep[] = [
    { after: 1500, run: () => setIsFanned(true) },
    { after: 1700, run: () => press('stack') },
    { after: PRESS_LEAD_MS, run: () => setIsPinned(true) },
    { after: 500, run: () => setIsFanned(false) },
    { after: 1900, run: () => press('stack') },
    { after: PRESS_LEAD_MS, run: () => setIsPinned(false) },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 1400,
    onReset: startOver,
    isEnabled: !isHovered,
  });
  /** A pointer on the piece only pauses the demonstration: its fan holds then, and lets go once a person took over. */
  const holdsDemoPose = isAutoplaying || isHovered;
  const isDemoFanned = isFanned && holdsDemoPose;

  return (
    <div ref={ref} className='min-h-60 w-full max-w-[20rem]' {...hoverHandlers}>
      <PaperStack
        file={FILE}
        people={SHARED_WITH}
        isPinned={isPinned}
        onPinnedChange={pinFromStack}
        isFanned={isDemoFanned}
        isPressed={pressed === 'stack'}
      />
      <LiveRegion message={announcement} />
    </div>
  );
}
