'use client';

import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useTransform,
  wrap,
  type MotionValue,
} from 'motion/react';
import { useEffect, useRef, type RefObject } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { CONVEYOR_SECTION, TASK_CARDS } from './data';
import { Reveal } from './reveal';
import { TaskCardView } from './task-card';

const DRIFT_PX_PER_SECOND = 26;

const FRICTION_MS = 650;

const MAX_FLICK = 4;

const KEY_IMPULSE = 0.5;

const MAX_FRAME_MS = 64;

const DRAG_THRESHOLD_PX = 4;

const STILL_RELEASE_MS = 80;

type Control = {
  velocity: number;
  isDragging: boolean;
  isHeld: boolean;
  width: number;
};

type Press = {
  pointerId: number;
  startX: number;
  lastX: number;
  lastTime: number;
  hasMoved: boolean;
};

function clampedFlick(value: number) {
  return Math.max(-MAX_FLICK, Math.min(MAX_FLICK, value));
}

function wrappedOffset(value: number, width: number) {
  if (width === 0) {
    return value;
  }
  return wrap(-width, 0, value);
}

function driftOf(control: Control, step: number) {
  if (control.isHeld) {
    return 0;
  }
  return (-DRIFT_PX_PER_SECOND * step) / 1000;
}

type DriverProps = {
  offset: MotionValue<number>;
  controlRef: RefObject<Control>;
};

function Driver({ offset, controlRef }: DriverProps) {
  useAnimationFrame((_, delta) => {
    const control = controlRef.current;
    const step = Math.min(delta, MAX_FRAME_MS);
    const flick = control.velocity * step;
    control.velocity *= Math.exp(-step / FRICTION_MS);
    if (control.isDragging) {
      return;
    }
    const next = offset.get() + driftOf(control, step) + flick;
    offset.set(wrappedOffset(next, control.width));
  });

  return null;
}

function Cards() {
  return (
    <>
      {TASK_CARDS.map((card) => (
        <TaskCardView key={card.id} card={card} />
      ))}
    </>
  );
}

function StillConveyor() {
  return (
    <div
      role='region'
      aria-label='Task cards'
      tabIndex={0}
      className='focus-visible:ring-ring/25 overflow-x-auto rounded-2xl pb-2 outline-none focus-visible:ring-[3px]'
    >
      <ul className='flex w-max gap-3'>
        <Cards />
      </ul>
    </div>
  );
}

function MovingConveyor() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLUListElement>(null);
  const controlRef = useRef<Control>({
    velocity: 0,
    isDragging: false,
    isHeld: false,
    width: 0,
  });
  const press = useRef<Press | null>(null);
  const isInView = useInView(viewportRef);
  const offset = useMotionValue(0);
  const transform = useTransform(offset, (latest) => `translateX(${latest}px)`);

  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) {
      return;
    }
    const control = controlRef.current;
    const observer = new ResizeObserver(() => {
      control.width = copy.offsetWidth;
    });
    observer.observe(copy);
    return () => observer.disconnect();
  }, []);

  function startPress(event: React.PointerEvent<HTMLDivElement>) {
    const isMouse = event.pointerType === 'mouse';
    const isMainButton = event.button === 0;
    if (isMouse && !isMainButton) {
      return;
    }
    press.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      hasMoved: false,
    };
  }

  function movePress(event: React.PointerEvent<HTMLDivElement>) {
    const current = press.current;
    if (!current) {
      return;
    }
    const control = controlRef.current;
    const travel = event.clientX - current.startX;
    const isPastThreshold = Math.abs(travel) > DRAG_THRESHOLD_PX;
    if (!current.hasMoved && !isPastThreshold) {
      return;
    }
    if (!current.hasMoved) {
      current.hasMoved = true;
      control.isDragging = true;
      control.velocity = 0;
      event.currentTarget.setPointerCapture(current.pointerId);
    }
    const gap = event.clientX - current.lastX;
    const elapsed = Math.max(event.timeStamp - current.lastTime, 1);
    const speed = clampedFlick(gap / elapsed);
    control.velocity = control.velocity * 0.5 + speed * 0.5;
    offset.set(wrappedOffset(offset.get() + gap, control.width));
    current.lastX = event.clientX;
    current.lastTime = event.timeStamp;
  }

  function endPress(event: React.PointerEvent<HTMLDivElement>) {
    const current = press.current;
    press.current = null;
    if (!current) {
      return;
    }
    const control = controlRef.current;
    control.isDragging = false;
    const stillFor = event.timeStamp - current.lastTime;
    if (stillFor > STILL_RELEASE_MS) {
      control.velocity = 0;
    }
    const isCaptured = event.currentTarget.hasPointerCapture(event.pointerId);
    if (isCaptured) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function nudgeWithKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const control = controlRef.current;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      control.velocity = clampedFlick(control.velocity - KEY_IMPULSE);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      control.velocity = clampedFlick(control.velocity + KEY_IMPULSE);
    }
  }

  function hold(event: React.FocusEvent<HTMLDivElement>) {
    controlRef.current.isHeld = event.currentTarget.matches(':focus-visible');
  }

  function release() {
    controlRef.current.isHeld = false;
  }

  return (
    <div
      ref={viewportRef}
      role='region'
      aria-label='Task cards'
      aria-roledescription='conveyor'
      tabIndex={0}
      onPointerDown={startPress}
      onPointerMove={movePress}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onKeyDown={nudgeWithKeys}
      onFocus={hold}
      onBlur={release}
      className={cn(
        'focus-visible:ring-ring/25 relative cursor-grab touch-pan-y overflow-hidden rounded-2xl outline-none focus-visible:ring-[3px] active:cursor-grabbing'
      )}
    >
      {isInView && <Driver offset={offset} controlRef={controlRef} />}
      <motion.div style={{ transform }} className='flex w-max'>
        <ul ref={copyRef} className='flex gap-3 pe-3'>
          <Cards />
        </ul>
        <ul aria-hidden='true' className='flex gap-3 pe-3'>
          <Cards />
        </ul>
      </motion.div>
    </div>
  );
}

export function Conveyor() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <section className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'>
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {CONVEYOR_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {CONVEYOR_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem className='flex flex-col gap-3'>
          {shouldReduceMotion && <StillConveyor />}
          {!shouldReduceMotion && <MovingConveyor />}
          <p className='text-muted-foreground text-xs'>
            {CONVEYOR_SECTION.hint}
          </p>
        </SettleItem>
      </Reveal>
    </section>
  );
}
