'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  TextQuoteIcon,
} from '@/registry/ndeko/lib/icons';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { wrapIndex } from './_parts/deck';
import { isKeyboardArrival, isOnControl, sideStepOf } from './_parts/keys';
import { PEOPLE } from './_parts/people';
import { SampleNote } from './_parts/sample-note';

export type StoryQuote = {
  id: string;
  text: string;
  author: string;
  role: string;
  company: string;
};

const DEFAULT_DURATION_MS = 6000;

const FILL_KEYFRAMES = [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }];

const EMPTY: CSSProperties = { transform: 'scaleX(0)' };

const FILL = 'bg-foreground block h-full origin-left rounded-full';

const SIDE_HINT = [
  'text-muted-foreground pointer-events-none absolute inset-y-0 flex items-center opacity-0',
  'transition-opacity duration-150 group-hover/story:opacity-100 group-focus-visible/story:opacity-100',
].join(' ');

type ActiveFillProps = {
  durationMs: number;
  isRunning: boolean;
  onDone: () => void;
};

/**
 * The segment of the quote on screen. The browser fills it by itself, so the clock of the story
 * costs no render: it is paused and resumed where it stopped, and it says when it is full.
 */
function ActiveFill({ durationMs, isRunning, onDone }: ActiveFillProps) {
  const barRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<Animation | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) {
      return;
    }
    const fill = bar.animate(FILL_KEYFRAMES, {
      duration: durationMs,
      easing: 'linear',
      fill: 'forwards',
    });
    fill.pause();
    fill.onfinish = () => onDoneRef.current();
    fillRef.current = fill;
    return () => {
      fill.cancel();
      fillRef.current = null;
    };
  }, [durationMs]);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) {
      return;
    }
    if (isRunning) {
      fill.play();
      return;
    }
    fill.pause();
  }, [isRunning, durationMs]);

  return <span ref={barRef} style={EMPTY} className={FILL} />;
}

type StorySegmentProps = {
  position: number;
  activePosition: number;
  /** Nothing fills by itself: the segment of the quote on screen is drawn full. */
  isStill: boolean;
  durationMs: number;
  isRunning: boolean;
  onDone: () => void;
};

function StorySegment({
  position,
  activePosition,
  isStill,
  durationMs,
  isRunning,
  onDone,
}: StorySegmentProps) {
  const isActive = position === activePosition;
  const isPast = position < activePosition;
  const isHeldFull = isActive && isStill;
  const isFull = isPast || isHeldFull;
  const isFilling = isActive && !isStill;

  return (
    <span className='bg-foreground/10 block h-1 flex-1 overflow-hidden rounded-full'>
      {isFull && <span className={FILL} />}
      {isFilling && (
        <ActiveFill
          durationMs={durationMs}
          isRunning={isRunning}
          onDone={onDone}
        />
      )}
    </span>
  );
}

function pauseLabelOf(isPaused: boolean) {
  if (isPaused) {
    return 'Play the quotes';
  }
  return 'Pause the quotes';
}

function pausedMessageOf(isPaused: boolean) {
  if (isPaused) {
    return 'Quotes paused';
  }
  return 'Quotes playing';
}

function keysHintOf(canPlay: boolean) {
  if (canPlay) {
    return 'Left and Right arrows step between the quotes, Space plays or pauses them';
  }
  return 'Left and Right arrows step between the quotes';
}

function spokenQuoteOf(quote: StoryQuote, position: number, count: number) {
  return `Quote ${position} of ${count}. ${quote.text} ${quote.author}, ${quote.role} at ${quote.company}`;
}

export type StoryQuotesProps = {
  quotes: StoryQuote[];
  /** How long each quote stays before the next one, in milliseconds. */
  durationMs?: number;
  /** Says the quotes are made up. Leave it out for real ones. */
  note?: string;
  label?: string;
  className?: string;
};

export function StoryQuotes({
  quotes,
  durationMs = DEFAULT_DURATION_MS,
  note,
  label = 'Quotes',
  className,
}: StoryQuotesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const isInView = useInView(rootRef, { amount: 0.3 });
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = usePrefersReducedMotion();
  const count = quotes.length;
  const activeIndex = wrapIndex(index, count);
  const quote = quotes[activeIndex];
  const isOnScreen = isInView && isVisible;
  const isRunning = isOnScreen && !isPaused;
  const canPlay = !shouldReduceMotion;
  const keysHint = keysHintOf(canPlay);
  const rise = risePresenceOf(shouldReduceMotion);

  function advance() {
    const stepped = activeIndex + 1;
    const nextIndex = wrapIndex(stepped, count);
    setIndex(nextIndex);
  }

  /** A person who steps is reading at their own pace: the story holds until they play it again. */
  function step(direction: 1 | -1) {
    const stepped = activeIndex + direction;
    const nextIndex = wrapIndex(stepped, count);
    const nextQuote = quotes[nextIndex];
    const nextPosition = nextIndex + 1;
    setIndex(nextIndex);
    setIsPaused(true);
    if (nextQuote) {
      setAnnouncement(spokenQuoteOf(nextQuote, nextPosition, count));
    }
  }

  /** Nothing changes under a keyboard that has just arrived: the story holds, and Space plays it. Focus that moves inside the card changes nothing. */
  function holdOnKeyboardFocus(event: React.FocusEvent<HTMLDivElement>) {
    if (isKeyboardArrival(event)) {
      setIsPaused(true);
    }
  }

  function togglePause() {
    const willPause = !isPaused;
    setIsPaused(willPause);
    setAnnouncement(pausedMessageOf(willPause));
  }

  function stepFromSide(event: React.MouseEvent<HTMLDivElement>) {
    if (isOnControl(event.target)) {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    const half = box.width / 2;
    const middle = box.left + half;
    if (event.clientX < middle) {
      step(-1);
      return;
    }
    step(1);
  }

  function actOnKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const direction = sideStepOf(event.key);
    if (direction !== 0) {
      event.preventDefault();
      step(direction);
      return;
    }
    const isSpace = event.key === ' ';
    const isOnCard = !isOnControl(event.target);
    const canPause = isSpace && isOnCard && canPlay;
    if (canPause) {
      event.preventDefault();
      togglePause();
    }
  }

  if (!quote) {
    return (
      <p className='hairline-border border-foreground/20 text-muted-foreground flex h-40 w-full items-center justify-center rounded-xl border-dashed text-[13px]'>
        No quotes yet
      </p>
    );
  }

  return (
    <div
      ref={rootRef}
      role='group'
      aria-roledescription='carousel'
      aria-label={label}
      aria-describedby={hintId}
      tabIndex={0}
      onClick={stepFromSide}
      onKeyDown={actOnKeys}
      onFocus={holdOnKeyboardFocus}
      className={cn(
        'group/story bg-card hairline-ring ring-border relative flex w-full cursor-pointer flex-col gap-4 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        FOCUS_RING,
        className
      )}
    >
      <div className='flex h-7 items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='keycap-3d text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md'>
            <TextQuoteIcon className='size-3.5' />
          </span>
          {note && <SampleNote className='truncate'>{note}</SampleNote>}
        </div>
        {!shouldReduceMotion && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={pauseLabelOf(isPaused)}
            onClick={togglePause}
            className='text-muted-foreground -me-1.5'
          >
            <Swap swapKey={String(isPaused)}>
              {isPaused && <PlayIcon />}
              {!isPaused && <PauseIcon />}
            </Swap>
          </Button>
        )}
      </div>
      <div className='relative min-h-36'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.figure
            key={quote.id}
            className='flex min-h-36 flex-col justify-between gap-4'
            {...rise}
          >
            <blockquote className='text-base leading-6 font-medium text-balance'>
              {quote.text}
            </blockquote>
            <figcaption className='flex items-center gap-2.5'>
              <Avatar seed={quote.author} />
              <span className='min-w-0'>
                <span className='block truncate text-[13px] font-medium'>
                  {quote.author}
                </span>
                <span className='text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs'>
                  <span className='truncate'>{quote.role}</span>
                  <span className='flex min-w-0 items-center gap-1.5'>
                    <CompanyMark seed={quote.company} size='sm' />
                    <span className='truncate'>{quote.company}</span>
                  </span>
                </span>
              </span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      <div aria-hidden='true' className='flex gap-1'>
        {quotes.map((candidate, position) => (
          <StorySegment
            key={candidate.id}
            position={position}
            activePosition={activeIndex}
            isStill={shouldReduceMotion}
            durationMs={durationMs}
            isRunning={isRunning}
            onDone={advance}
          />
        ))}
      </div>
      <span aria-hidden='true' className={cn(SIDE_HINT, 'start-0.5')}>
        <ChevronLeftIcon className='size-4' />
      </span>
      <span aria-hidden='true' className={cn(SIDE_HINT, 'end-0.5')}>
        <ChevronRightIcon className='size-4' />
      </span>
      <span className='sr-only'>
        <span id={hintId}>{keysHint}</span>
        <button type='button' tabIndex={-1} onClick={() => step(-1)}>
          Previous quote
        </button>
        <button type='button' tabIndex={-1} onClick={() => step(1)}>
          Next quote
        </button>
      </span>
      <LiveRegion message={announcement} />
    </div>
  );
}

const QUOTES: StoryQuote[] = [
  {
    id: 'board',
    text: 'We stopped asking who is working on what. The board answers before the question comes up.',
    author: PEOPLE.amara.name,
    role: PEOPLE.amara.role,
    company: PEOPLE.amara.company,
  },
  {
    id: 'reviews',
    text: 'Reviews used to wait for a meeting. Now a change gets read the hour it lands.',
    author: PEOPLE.jonas.name,
    role: PEOPLE.jonas.role,
    company: PEOPLE.jonas.company,
  },
  {
    id: 'handoff',
    text: 'The handoff notes come from the task itself, so a design review starts on the work.',
    author: PEOPLE.mei.name,
    role: PEOPLE.mei.role,
    company: PEOPLE.mei.company,
  },
  {
    id: 'timeline',
    text: 'Support reads the same timeline as engineering. One tool fewer to check before a reply.',
    author: PEOPLE.rafael.name,
    role: PEOPLE.rafael.role,
    company: PEOPLE.rafael.company,
  },
];

export default function Card05() {
  const ref = useRef<HTMLDivElement>(null);

  useKeptHeight(ref);

  return (
    <div ref={ref} className='min-h-[15.5rem] w-full max-w-[22rem]'>
      <StoryQuotes quotes={QUOTES} note='Sample quote' />
    </div>
  );
}
