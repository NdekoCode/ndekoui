'use client';

import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControls,
  type Transition,
} from 'motion/react';
import { useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { CoverCard } from './cover-card';
import { CARD_STEP, heldPositionOf, nearestIndexOf } from './cover-math';
import { CARDS_ANCHOR, CARDS_SECTION, GROUP_CARDS, START_INDEX } from './data';

type CoverStyle = React.CSSProperties & { '--card-w': string };

const STAGE_STYLE: CoverStyle = {
  '--card-w': 'min(66cqw, 19rem)',
  height: 'calc(var(--card-w) / 1.586 + 1.5rem)',
};

const GLIDE: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 30,
  mass: 0.9,
};

const LAST_INDEX = GROUP_CARDS.length - 1;

const TOUR_INDEXES = [3, 4, 0, 1, START_INDEX];

const TOUR_STEP_MS = 2600;

const DRAG_THRESHOLD_PX = 4;

const FLING_MS = 220;

type Press = {
  pointerId: number;
  startX: number;
  startPosition: number;
  step: number;
  lastX: number;
  lastTime: number;
  velocity: number;
};

function dotToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground';
  }
  return 'bg-foreground/25';
}

export function Coverflow() {
  const position = useMotionValue(START_INDEX);
  const [active, setActive] = useState(START_INDEX);
  const [isDragging, setIsDragging] = useState(false);
  const glide = useRef<AnimationPlaybackControls | null>(null);
  const press = useRef<Press | null>(null);
  const hasMoved = useRef(false);
  const shouldReduceMotion = usePrefersReducedMotion();

  useMotionValueEvent(position, 'change', (latest) => {
    const nearest = nearestIndexOf(latest, LAST_INDEX);
    setActive(nearest);
  });

  function goTo(index: number, velocity = 0) {
    const target = nearestIndexOf(index, LAST_INDEX);
    glide.current?.stop();
    if (shouldReduceMotion) {
      position.set(target);
      return;
    }
    glide.current = animate(position, target, { ...GLIDE, velocity });
  }

  const tourSteps = TOUR_INDEXES.map((index) => ({
    after: TOUR_STEP_MS,
    run: () => goTo(index),
  }));
  const { ref, isAutoplaying } = useAutoplay(tourSteps, {
    loopAfter: TOUR_STEP_MS,
  });

  function startPress(event: React.PointerEvent<HTMLUListElement>) {
    const isMouse = event.pointerType === 'mouse';
    const isMainButton = event.button === 0;
    if (isMouse && !isMainButton) {
      return;
    }
    const card = event.currentTarget.firstElementChild;
    if (!(card instanceof HTMLElement)) {
      return;
    }
    glide.current?.stop();
    hasMoved.current = false;
    press.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startPosition: position.get(),
      step: card.offsetWidth * CARD_STEP,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
    };
  }

  function movePress(event: React.PointerEvent<HTMLUListElement>) {
    const current = press.current;
    if (!current) {
      return;
    }
    const travel = event.clientX - current.startX;
    const hasStarted = hasMoved.current;
    const isPastThreshold = Math.abs(travel) > DRAG_THRESHOLD_PX;
    if (!hasStarted && !isPastThreshold) {
      return;
    }
    if (!hasStarted) {
      hasMoved.current = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(current.pointerId);
    }
    const elapsed = event.timeStamp - current.lastTime;
    if (elapsed > 0) {
      const speed = (event.clientX - current.lastX) / elapsed;
      current.velocity = current.velocity * 0.6 + speed * 0.4;
    }
    current.lastX = event.clientX;
    current.lastTime = event.timeStamp;
    const raw = current.startPosition - travel / current.step;
    position.set(heldPositionOf(raw, LAST_INDEX));
  }

  function endPress(event: React.PointerEvent<HTMLUListElement>) {
    const current = press.current;
    press.current = null;
    if (!current) {
      return;
    }
    setIsDragging(false);
    if (!hasMoved.current) {
      return;
    }
    const scroller = event.currentTarget;
    if (scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
    const flung = (current.velocity * FLING_MS) / current.step;
    const target = position.get() - flung;
    const positionsPerSecond = (-current.velocity * 1000) / current.step;
    goTo(target, positionsPerSecond);
  }

  function swallowClickAfterDrag(event: React.MouseEvent<HTMLUListElement>) {
    if (!hasMoved.current) {
      return;
    }
    hasMoved.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function moveWithKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(active - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(active + 1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      goTo(LAST_INDEX);
    }
  }

  const card = GROUP_CARDS[active];
  const memberCount = countOf(card.members.length, 'member');
  const message = spokenUnless(isAutoplaying, `${card.name}, ${memberCount}`);

  return (
    <div
      ref={ref}
      id={CARDS_ANCHOR}
      className='flex flex-col items-center gap-6'
    >
      <div
        role='group'
        aria-roledescription='carousel'
        aria-label='Group cards'
        tabIndex={0}
        onKeyDown={moveWithKeys}
        className='focus-visible:ring-ring/25 @container w-full overflow-x-clip rounded-2xl outline-none focus-visible:ring-[3px]'
      >
        <ul
          style={STAGE_STYLE}
          onPointerDown={startPress}
          onPointerMove={movePress}
          onPointerUp={endPress}
          onPointerCancel={endPress}
          onClickCapture={swallowClickAfterDrag}
          className={cn(
            'relative w-full touch-pan-y [perspective:1200px]',
            isDragging && 'cursor-grabbing'
          )}
        >
          {GROUP_CARDS.map((groupCard, index) => (
            <CoverCard
              key={groupCard.id}
              card={groupCard}
              index={index}
              position={position}
              isActive={index === active}
              onPick={goTo}
            />
          ))}
        </ul>
      </div>
      <div className='flex flex-col items-center gap-3 text-center'>
        <div className='flex items-center gap-2'>
          <div className='flex -space-x-1.5'>
            {card.members.slice(0, 4).map((member) => (
              <Avatar
                key={member}
                seed={member}
                role='img'
                aria-label={member}
                className='ring-background size-6 ring-2'
              />
            ))}
          </div>
          <p className='text-sm font-medium'>{card.name}</p>
          <p className='text-muted-foreground text-xs'>{memberCount}</p>
        </div>
        <p className='text-muted-foreground text-xs tabular-nums'>
          <MotionNumber
            value={card.spentCents / 100}
            prefix='$'
            format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
          />{' '}
          spent this month
        </p>
        <div role='group' aria-label='Choose a card' className='flex gap-1'>
          {GROUP_CARDS.map((groupCard, index) => (
            <button
              key={groupCard.id}
              type='button'
              aria-label={`Show ${groupCard.name}`}
              aria-pressed={index === active}
              onClick={() => goTo(index)}
              className='focus-visible:ring-ring/25 flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-[3px]'
            >
              <span
                className={cn(
                  'size-2 rounded-full transition-colors duration-200',
                  dotToneOf(index === active)
                )}
              />
            </button>
          ))}
        </div>
        <p className='text-muted-foreground text-xs'>{CARDS_SECTION.note}</p>
        <p className='text-muted-foreground text-xs'>{CARDS_SECTION.hint}</p>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
