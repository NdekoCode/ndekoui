'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

export type WaitlistPerson = {
  id: string;
  name: string;
};

export type StackEntry = WaitlistPerson & {
  /** Slides in from the left when it appears, as someone who just joined. */
  isArrival?: boolean;
  /** What a screen reader says in place of the name, for someone whose name is an address. */
  label?: string;
};

type StackItem = {
  entry: StackEntry;
  slot: number;
  isHidden: boolean;
};

type StackStyle = React.CSSProperties & {
  '--step': string;
  '--visible': number;
};

type SlotStyle = React.CSSProperties & {
  '--at': string;
  '--born': string;
};

/** How many avatars the stack shows before the counter takes over. */
export const VISIBLE_AVATARS = 4;

/** Someone who leaves the stack goes back the way they came: out at the left, where a new one slides in. */
const LEAVER_SLOT = -1;

/** The nearer to the left, the higher: a new avatar lies over its neighbour and the one that tucks away lies under the counter. */
const FRONT_LAYER = 20;

const AVATAR_CLASS =
  'ring-card absolute top-0 left-0 size-8 translate-x-(--at) ring-2 transition-[translate,opacity] duration-500 ease-(--ease-out-strong) data-[hidden=true]:opacity-0';

const ARRIVAL_CLASS = 'starting:translate-x-(--born) starting:opacity-0';

const COUNTER_CLASS =
  'bg-muted text-muted-foreground ring-card relative z-30 ms-[calc(var(--step)*var(--visible))] flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-xs font-medium ring-2 transition-[margin] duration-500 ease-(--ease-out-strong)';

function stackStyleOf(visible: number): StackStyle {
  return { '--step': '1.5rem', '--visible': visible };
}

function itemsOf(
  entries: readonly StackEntry[],
  leaver: WaitlistPerson | null
) {
  const shown = entries.slice(0, VISIBLE_AVATARS + 1);
  const items: StackItem[] = shown.map((entry, slot) => ({
    entry,
    slot,
    isHidden: slot >= VISIBLE_AVATARS,
  }));
  if (leaver) {
    items.push({ entry: leaver, slot: LEAVER_SLOT, isHidden: true });
  }
  return items;
}

function slotStyleOf(slot: number): SlotStyle {
  return {
    '--at': `calc(var(--step) * ${slot})`,
    '--born': `calc(var(--step) * ${LEAVER_SLOT})`,
    zIndex: FRONT_LAYER - slot,
  };
}

function arrivalClassOf(entry: StackEntry) {
  if (entry.isArrival) {
    return ARRIVAL_CLASS;
  }
  return undefined;
}

function unseenIf(isHidden: boolean) {
  if (isHidden) {
    return true;
  }
  return undefined;
}

function StackAvatar({ item }: { item: StackItem }) {
  const { entry, slot, isHidden } = item;

  return (
    <Avatar
      seed={entry.name}
      role='img'
      aria-label={entry.label ?? entry.name}
      aria-hidden={unseenIf(isHidden)}
      data-hidden={isHidden}
      style={slotStyleOf(slot)}
      className={cn(AVATAR_CLASS, arrivalClassOf(entry))}
    />
  );
}

export type WaitlistStackProps = {
  /** The people on the list, the latest first. The stack shows the first few. */
  entries: readonly StackEntry[];
  /** Someone who is on their way out of the stack, still drawn while they fade. */
  leaver: WaitlistPerson | null;
  /** How many people are on the list in all, the ones in the stack included. The counter says how many the stack does not show. */
  count: number;
  caption: string;
};

/**
 * Avatars that overlap in a row, the latest on the left. A new one slides in at the left while the
 * others shift one place to the right and the last one tucks under the counter, which rolls to its
 * new figure. Every avatar keeps its own element, so each move is a transition of `translate` and
 * `opacity` and nothing runs between two changes.
 */
export function WaitlistStack({
  entries,
  leaver,
  count,
  caption,
}: WaitlistStackProps) {
  const items = itemsOf(entries, leaver);
  const visible = Math.min(VISIBLE_AVATARS, entries.length);
  const others = Math.max(0, count - visible);

  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
      <div
        role='group'
        aria-label='People on the waitlist'
        style={stackStyleOf(visible)}
        className='relative flex h-8 items-center'
      >
        {items.map((item) => (
          <StackAvatar key={item.entry.id} item={item} />
        ))}
        <span className={COUNTER_CLASS}>
          <MotionNumber value={others} prefix='+' />
          <span className='sr-only'> others</span>
        </span>
      </div>
      <p className='text-muted-foreground text-xs'>{caption}</p>
    </div>
  );
}
