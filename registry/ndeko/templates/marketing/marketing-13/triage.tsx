'use client';

import { LayoutGroup, motion, type Transition } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  CircleDashedIcon,
  UndoIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import {
  HERO_LOOKS,
  LANES,
  TRIAGE_ANCHOR,
  TRIAGE_SECTION,
  TRIAGE_TAKES,
  type Lane,
  type TriageTake,
} from './data';
import { Reveal } from './reveal';
import { SubjectScene, TakeFrame } from './scenes';
import {
  SESSION,
  sortPressKeyOf,
  takesIn,
  unsortedOf,
  type TriageState,
} from './triage-session';

type Decision = {
  lane: Lane;
  label: string;
  icon: Icon;
};

const DECISIONS: Decision[] = [
  { lane: 'keep', label: 'Keep', icon: CheckIcon },
  { lane: 'maybe', label: 'Maybe', icon: CircleDashedIcon },
  { lane: 'drop', label: 'Drop', icon: XIcon },
];

const LANE_KEYS: Record<string, Lane> = {
  k: 'keep',
  m: 'maybe',
  d: 'drop',
};

const LANE_DOT: Record<Lane, string> = {
  keep: 'bg-success',
  maybe: 'bg-warning',
  drop: 'bg-muted-foreground/50',
};

const CARD_WIDTH = 'w-[5.25rem] @2xl/triage:w-28';

const MUG_LOOK = HERO_LOOKS[0];

const SLIDE: Transition = { type: 'spring', bounce: 0, duration: 0.4 };

const INSTANT: Transition = { duration: 0 };

function slideOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SLIDE;
}

function layoutKeyOf(state: TriageState) {
  const keep = state.lanes.keep.join(',');
  const maybe = state.lanes.maybe.join(',');
  const drop = state.lanes.drop.join(',');
  return `${keep}|${maybe}|${drop}`;
}

type DecisionButtonsProps = {
  take: TriageTake;
  pressed: string | null;
  onSort: (take: TriageTake, lane: Lane) => void;
};

function DecisionButtons({ take, pressed, onSort }: DecisionButtonsProps) {
  return DECISIONS.map((decision) => {
    const DecisionIcon = decision.icon;
    const pressKey = sortPressKeyOf(take.id, decision.lane);
    const isPressed = pressed === pressKey;

    function sort() {
      onSort(take, decision.lane);
    }

    return (
      <Button
        key={decision.lane}
        variant='ghost'
        size='icon-sm'
        aria-label={`${decision.label}: ${take.title}`}
        onClick={sort}
        className={cn(
          'text-muted-foreground size-6',
          pressedQuietOf(isPressed)
        )}
      >
        <DecisionIcon className='size-3.5' />
      </Button>
    );
  });
}

type TriageCardProps = {
  take: TriageTake;
  lane: Lane | null;
  pressed: string | null;
  layoutKey: string;
  transition: Transition;
  onSort: (take: TriageTake, lane: Lane) => void;
  onReturn: (take: TriageTake) => void;
};

function TriageCard({
  take,
  lane,
  pressed,
  layoutKey,
  transition,
  onSort,
  onReturn,
}: TriageCardProps) {
  function back() {
    onReturn(take);
  }

  return (
    <motion.li
      layout='position'
      layoutId={take.id}
      layoutDependency={layoutKey}
      transition={transition}
      className={cn('flex flex-col gap-1.5', CARD_WIDTH)}
    >
      <TakeFrame state='ready'>
        <SubjectScene id={take.id} mugLook={MUG_LOOK} />
      </TakeFrame>
      <p className='truncate text-xs font-medium'>{take.title}</p>
      <div className='flex h-6 items-center gap-0.5'>
        {lane === null && (
          <DecisionButtons take={take} pressed={pressed} onSort={onSort} />
        )}
        {lane !== null && (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Move back to unsorted: ${take.title}`}
            onClick={back}
            className='text-muted-foreground size-6'
          >
            <UndoIcon className='size-3.5' />
          </Button>
        )}
      </div>
    </motion.li>
  );
}

type LaneColumnProps = {
  lane: Lane;
  label: string;
  takes: TriageTake[];
  cardProps: Omit<TriageCardProps, 'take' | 'lane'>;
};

function LaneColumn({ lane, label, takes, cardProps }: LaneColumnProps) {
  const isEmpty = takes.length === 0;

  return (
    <section
      aria-label={label}
      className='bg-foreground/[0.04] flex min-h-44 flex-col gap-2 rounded-xl p-2'
    >
      <header className='flex items-center gap-2 px-1'>
        <span
          aria-hidden='true'
          className={cn('size-2 shrink-0 rounded-full', LANE_DOT[lane])}
        />
        <h3 className='text-[13px] font-medium'>{label}</h3>
        <span className='text-muted-foreground ms-auto text-xs tabular-nums'>
          <MotionNumber value={takes.length} />
        </span>
      </header>
      <ul className='flex flex-wrap gap-2'>
        {takes.map((take) => (
          <TriageCard key={take.id} take={take} lane={lane} {...cardProps} />
        ))}
      </ul>
      {isEmpty && (
        <p className='text-muted-foreground px-1 text-xs'>Nothing here yet</p>
      )}
    </section>
  );
}

export function Triage() {
  const { ref, isAutoplaying, state, act, pressed } = useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const groupId = useId();
  const unsorted = unsortedOf(state);
  const layoutKey = layoutKeyOf(state);
  const message = spokenUnless(isAutoplaying, state.lastMove);
  const hasSorted = unsorted.length < TRIAGE_TAKES.length;
  useKeptHeight(ref);

  function sort(take: TriageTake, lane: Lane) {
    act({ type: 'sorted', id: take.id, lane });
  }

  function returnTake(take: TriageTake) {
    act({ type: 'returned', id: take.id });
  }

  function startOver() {
    act({ type: 'cleared' });
  }

  function sortFirstWithKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
    if (hasModifier) {
      return;
    }
    const lane = LANE_KEYS[event.key.toLowerCase()];
    const first = unsorted[0];
    if (!lane || !first) {
      return;
    }
    sort(first, lane);
  }

  const cardProps = {
    pressed,
    layoutKey,
    transition: slideOf(shouldReduceMotion),
    onSort: sort,
    onReturn: returnTake,
  };

  return (
    <section
      id={TRIAGE_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {TRIAGE_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {TRIAGE_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <LayoutGroup id={groupId}>
            <div
              ref={ref}
              role='group'
              aria-label='Takes to sort'
              onKeyDown={sortFirstWithKey}
              className='bg-foreground/[0.03] @container/triage flex min-h-[44rem] flex-col gap-2 rounded-2xl p-2 @3xl/triage:min-h-[36rem] @3xl/triage:p-3'
            >
              <section
                aria-label='Unsorted takes'
                className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex min-h-44 flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
              >
                <header className='flex flex-wrap items-center gap-2'>
                  <h3 className='text-[13px] font-medium'>Unsorted</h3>
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    <MotionNumber value={unsorted.length} /> left
                  </span>
                  <p className='text-muted-foreground ms-auto hidden items-center gap-1.5 text-xs @lg/triage:flex'>
                    <Kbd>K</Kbd> Keep <Kbd>M</Kbd> Maybe <Kbd>D</Kbd> Drop
                  </p>
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={!hasSorted}
                    onClick={startOver}
                  >
                    Start over
                  </Button>
                </header>
                <ul className='flex flex-wrap gap-2'>
                  {unsorted.map((take) => (
                    <TriageCard
                      key={take.id}
                      take={take}
                      lane={null}
                      {...cardProps}
                    />
                  ))}
                </ul>
                {unsorted.length === 0 && (
                  <p className='text-muted-foreground text-xs'>
                    Every take has a lane
                  </p>
                )}
              </section>
              <div className='grid grid-cols-3 gap-2'>
                {LANES.map((lane) => (
                  <LaneColumn
                    key={lane.id}
                    lane={lane.id}
                    label={lane.label}
                    takes={takesIn(state, lane.id)}
                    cardProps={cardProps}
                  />
                ))}
              </div>
              <LiveRegion message={message} />
            </div>
          </LayoutGroup>
        </SettleItem>
      </Reveal>
    </section>
  );
}
