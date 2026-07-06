'use client';

import {
  AnimatePresence,
  motion,
  useInView,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useRef, useState } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { QuoteIcon } from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { CarouselControls, tabIdOf } from './carousel-controls';
import { SECTION, SLIDES } from './data';
import { QuoteSlide } from './quote-slide';
import { useSlideClock } from './use-slide-clock';

type Direction = 1 | -1;

/** `auto` turns unless the system asks for reduced motion; a person's Play or Pause decides from then on. */
type Rotation = 'auto' | 'on' | 'off';

const SLIDE_MS = 7000;

const TRAVEL_PX = 24;

const BLURRED = 'blur(4px)';

const ENTER: Transition = { duration: 0.4, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

function enteringOf(direction: Direction) {
  const x = direction * TRAVEL_PX;
  return { opacity: 0, x, filter: BLURRED };
}

function leavingOf(direction: Direction) {
  const x = direction * -TRAVEL_PX;
  return { opacity: 0, x, filter: BLURRED, transition: EXIT };
}

const SLIDE_VARIANTS: Variants = {
  enter: enteringOf,
  shown: { opacity: 1, x: 0, filter: 'blur(0px)', transition: ENTER },
  gone: leavingOf,
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  shown: { opacity: 1, transition: ENTER },
  gone: { opacity: 0, transition: EXIT },
};

function variantsOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SLIDE_VARIANTS;
}

function isRotationOn(rotation: Rotation, shouldReduceMotion: boolean) {
  if (rotation === 'auto') {
    return !shouldReduceMotion;
  }
  return rotation === 'on';
}

function indexAfter(index: number) {
  const next = index + 1;
  return next % SLIDES.length;
}

function indexBefore(index: number) {
  const shifted = index + SLIDES.length;
  const previous = shifted - 1;
  return previous % SLIDES.length;
}

function directionBetween(from: number, to: number): Direction {
  if (to < from) {
    return -1;
  }
  return 1;
}

function spokenSlideOf(index: number) {
  const { person } = SLIDES[index];
  const position = index + 1;
  return `Quote ${position} of ${SLIDES.length}, ${person.name}, ${person.role} at ${person.company}`;
}

const SLIDE_SECONDS = SLIDE_MS / 1000;

const PLAYING_LINE = `Quotes play again, a new one every ${SLIDE_SECONDS} seconds`;

export default function Testimonials02() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);
  const [rotation, setRotation] = useState<Rotation>('auto');
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusHeld, setIsFocusHeld] = useState(false);
  const [message, setMessage] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const idBase = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isInView = useInView(stageRef, { amount: 0.3 });
  const isTabVisible = useDocumentVisible();
  const isRotating = isRotationOn(rotation, shouldReduceMotion);
  const isOnScreen = isInView && isTabVisible;
  const isHeld = isHovered || isFocusHeld;
  const canTurn = isRotating && isOnScreen;
  const isClockRunning = canTurn && !isHeld;
  const activeSlide = SLIDES[activeIndex];
  const panelId = `${idBase}-panel`;
  const activeTabId = tabIdOf(idBase, activeSlide.id);
  const variants = variantsOf(shouldReduceMotion);

  function show(index: number, nextDirection: Direction) {
    setDirection(nextDirection);
    setActiveIndex(index);
  }

  function turn() {
    show(indexAfter(activeIndex), 1);
  }

  useSlideClock(fillRef, {
    slideKey: activeSlide.id,
    isRotating,
    isRunning: isClockRunning,
    durationMs: SLIDE_MS,
    onEnd: turn,
  });

  function showByPerson(index: number, nextDirection: Direction) {
    setRotation('off');
    show(index, nextDirection);
    setMessage(spokenSlideOf(index));
  }

  function showPrevious() {
    showByPerson(indexBefore(activeIndex), -1);
  }

  function showNext() {
    showByPerson(indexAfter(activeIndex), 1);
  }

  function pick(slideId: string) {
    const index = SLIDES.findIndex((slide) => slide.id === slideId);
    const isCurrent = index === activeIndex;
    if (isCurrent) {
      return;
    }
    showByPerson(index, directionBetween(activeIndex, index));
  }

  /** Play while the keyboard is inside would otherwise wait for the focus to leave. */
  function toggleRotation() {
    if (isRotating) {
      setRotation('off');
      setMessage('Quotes paused');
      return;
    }
    setRotation('on');
    setIsFocusHeld(false);
    setMessage(PLAYING_LINE);
  }

  function holdOnKeyboardFocus(event: React.FocusEvent<HTMLElement>) {
    const isKeyboardFocus = event.target.matches(':focus-visible');
    if (isKeyboardFocus) {
      setIsFocusHeld(true);
    }
  }

  function releaseWhenFocusLeaves(event: React.FocusEvent<HTMLElement>) {
    const next = event.relatedTarget;
    const staysInside = next !== null && event.currentTarget.contains(next);
    if (!staysInside) {
      setIsFocusHeld(false);
    }
  }

  function holdUnderPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') {
      setIsHovered(true);
    }
  }

  function releasePointer() {
    setIsHovered(false);
  }

  function stopRotation() {
    setRotation('off');
  }

  return (
    <section
      aria-roledescription='carousel'
      aria-label='Sample quotes from Fieldnote customers'
      onFocus={holdOnKeyboardFocus}
      onBlur={releaseWhenFocusLeaves}
      className='@container'
    >
      <div className='mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <header className='flex max-w-2xl flex-col gap-3'>
          <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
            <QuoteIcon className='size-4' />
            {SECTION.label}
          </p>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.lead}
          </p>
        </header>
        <div className='flex flex-col gap-4'>
          <div
            ref={stageRef}
            onPointerEnter={holdUnderPointer}
            onPointerLeave={releasePointer}
            onPointerDown={stopRotation}
            className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] rounded-2xl p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @2xl:p-10'
          >
            <div
              id={panelId}
              role='tabpanel'
              aria-roledescription='slide'
              aria-labelledby={activeTabId}
              className='grid *:col-start-1 *:row-start-1'
            >
              {SLIDES.map((slide) => (
                <div key={slide.id} aria-hidden='true' className='invisible'>
                  <QuoteSlide slide={slide} />
                </div>
              ))}
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={activeSlide.id}
                  custom={direction}
                  variants={variants}
                  initial='enter'
                  animate='shown'
                  exit='gone'
                >
                  <QuoteSlide slide={activeSlide} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <CarouselControls
              slides={SLIDES}
              activeId={activeSlide.id}
              isRotating={isRotating}
              fillRef={fillRef}
              tabIdBase={idBase}
              panelId={panelId}
              onPick={pick}
              onPrevious={showPrevious}
              onNext={showNext}
              onToggleRotation={toggleRotation}
            />
            <Badge variant='secondary'>Sample quotes</Badge>
          </div>
        </div>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
