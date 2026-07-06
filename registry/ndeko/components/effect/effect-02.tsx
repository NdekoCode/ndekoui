'use client';

import { useEffect, useImperativeHandle, useRef } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import { createFollower, type Follower } from './_parts/follower';
import { hundredthsOf } from './_parts/rounded';
import { useHover } from './_parts/use-hover';

type Layers = {
  surface: HTMLElement;
  media: HTMLElement;
  text: HTMLElement;
};

/** Where the card leans from: the pointer across and down from its centre, each from -0.5 to 0.5, and how far it is lifted, from 0 to 1. */
type Lean = [across: number, down: number, lift: number];

const DEFAULT_DEPTH_PX = 12;

/** Each layer moves this share of the depth: the surface least, the text on it a little more, the picture the whole depth. */
const SURFACE_SHARE = 0.25;

const TEXT_SHARE = 0.25;

const PICTURE_SHARE = 0.75;

const LIFT_SCALE = 0.02;

/** A pointer is followed closely, a demonstration glides. */
const POINTER_STIFFNESS = 420;

const DEMO_STIFFNESS = 90;

const PRECISION = 0.004;

const LEAN_COUNT = 3;

const AT_REST: Lean = [0, 0, 0];

function shiftOf(away: number, depth: number, share: number) {
  const pixels = away * depth * share;
  return hundredthsOf(pixels);
}

function moveLayer(
  layer: HTMLElement,
  awayX: number,
  awayY: number,
  depth: number,
  share: number
) {
  const x = shiftOf(awayX, depth, share);
  const y = shiftOf(awayY, depth, share);
  layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function isAtRest(values: readonly number[]) {
  return values.every((value) => value === 0);
}

function clearLayers(layers: Layers) {
  layers.surface.style.transform = '';
  layers.media.style.transform = '';
  layers.text.style.transform = '';
}

/** The card leans away from the pointer: every layer moves the other way, the deeper ones further. */
function drawLean(layers: Layers, values: readonly number[], depth: number) {
  if (isAtRest(values)) {
    clearLayers(layers);
    return;
  }
  const [across, down, lift] = values;
  const awayX = -across * 2;
  const awayY = -down * 2;
  const surfaceX = shiftOf(awayX, depth, SURFACE_SHARE);
  const surfaceY = shiftOf(awayY, depth, SURFACE_SHARE);
  const scale = 1 + lift * LIFT_SCALE;
  const roundedScale = Math.round(scale * 10000) / 10000;
  layers.surface.style.transform = `translate3d(${surfaceX}px, ${surfaceY}px, 0) scale(${roundedScale})`;
  moveLayer(layers.media, awayX, awayY, depth, PICTURE_SHARE);
  moveLayer(layers.text, awayX, awayY, depth, TEXT_SHARE);
}

function withinCard(share: number) {
  const atLeast = Math.max(-0.5, share);
  return Math.min(0.5, atLeast);
}

/** The picture is larger than its frame by the furthest it travels, so its edge never shows. */
function pictureStyleOf(picture: string, depth: number) {
  const travel = Math.ceil(depth * PICTURE_SHARE);
  const bleed = travel + 2;
  return {
    backgroundImage: `url(${picture})`,
    inset: `${-bleed}px`,
  };
}

export type ParallaxCardHandle = {
  /** Leans the card as if the pointer stood at this place, in shares of the card from its centre, -0.5 to 0.5. */
  leanTowards: (across: number, down: number) => void;
  rest: () => void;
};

export type ParallaxCardProps = {
  href: string;
  title: string;
  /** A short line above the title: what the card opens and how long it takes. */
  kicker?: string;
  /** The picture at the top of the card. It bleeds past the edges of its frame and travels the furthest. */
  picture: string;
  /** Who wrote it. Their picture is drawn from their name. */
  author?: string;
  /** How far the picture travels at the edge of the card, in pixels. The surface moves a quarter of it and the text half. */
  depth?: number;
  /** Leans the card from outside, for a demonstration. */
  handleRef?: React.Ref<ParallaxCardHandle>;
  className?: string;
};

/**
 * A card that leans away from the pointer: its surface shifts a few pixels and grows to 102% while
 * the text and the picture move further, so they read at three depths. One animation frame runs
 * while it moves and none at rest; it stays still under a finger and under reduced motion.
 */
export function ParallaxCard({
  href,
  title,
  kicker,
  picture,
  author,
  depth = DEFAULT_DEPTH_PX,
  handleRef,
  className,
}: ParallaxCardProps) {
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const mediaRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const follower = useRef<Follower | null>(null);
  const focusLift = useRef(0);
  const isStill = usePrefersReducedMotion();

  useEffect(() => {
    const surface = surfaceRef.current;
    const media = mediaRef.current;
    const text = textRef.current;
    const hasSurface = surface !== null;
    const hasMedia = media !== null;
    const hasText = text !== null;
    const hasLayers = hasSurface && hasMedia && hasText;
    if (!hasLayers) {
      return;
    }
    const layers: Layers = { surface, media, text };
    const created = createFollower(
      LEAN_COUNT,
      (values) => drawLean(layers, values, depth),
      { stiffness: POINTER_STIFFNESS, precision: PRECISION }
    );
    follower.current = created;
    return () => {
      created.stop();
      clearLayers(layers);
      follower.current = null;
    };
  }, [depth]);

  useEffect(() => {
    if (isStill) {
      follower.current?.place(AT_REST);
    }
  }, [isStill]);

  function lean(target: Lean, stiffness: number) {
    if (isStill) {
      return;
    }
    follower.current?.setStiffness(stiffness);
    follower.current?.follow(target);
  }

  function leanFromPointer(event: React.PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType === 'touch') {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    const hasNoWidth = box.width === 0;
    const hasNoHeight = box.height === 0;
    if (hasNoWidth || hasNoHeight) {
      return;
    }
    const across = (event.clientX - box.left) / box.width - 0.5;
    const down = (event.clientY - box.top) / box.height - 0.5;
    lean([withinCard(across), withinCard(down), 1], POINTER_STIFFNESS);
  }

  function settle() {
    lean([0, 0, focusLift.current], POINTER_STIFFNESS);
  }

  function liftOnKeyboardFocus(event: React.FocusEvent<HTMLAnchorElement>) {
    if (!event.target.matches(':focus-visible')) {
      return;
    }
    focusLift.current = 1;
    lean([0, 0, 1], POINTER_STIFFNESS);
  }

  function dropFocusLift() {
    focusLift.current = 0;
    lean(AT_REST, POINTER_STIFFNESS);
  }

  useImperativeHandle(handleRef, () => ({
    leanTowards(across: number, down: number) {
      lean([withinCard(across), withinCard(down), 1], DEMO_STIFFNESS);
    },
    rest() {
      lean([0, 0, focusLift.current], DEMO_STIFFNESS);
    },
  }));

  return (
    <a
      href={href}
      onPointerMove={leanFromPointer}
      onPointerLeave={settle}
      onFocus={liftOnKeyboardFocus}
      onBlur={dropFocusLift}
      className={cn(
        'focus-visible:ring-ring/25 focus-visible:ring-offset-background block w-full max-w-[18rem] rounded-xl transition-[scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] focus-visible:ring-offset-4 active:scale-[0.98]',
        className
      )}
    >
      <span
        ref={surfaceRef}
        className='bg-card hairline-ring ring-border flex flex-col gap-3 rounded-xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <span className='relative block aspect-[16/10] overflow-hidden rounded-[calc(var(--radius-xl)-0.375rem)]'>
          <span
            ref={mediaRef}
            aria-hidden='true'
            style={pictureStyleOf(picture, depth)}
            className='absolute bg-cover bg-center'
          />
        </span>
        <span ref={textRef} className='flex flex-col gap-1 px-2 pb-2'>
          {kicker && (
            <span className='text-muted-foreground text-xs'>{kicker}</span>
          )}
          <span className='text-sm leading-snug font-medium text-balance'>
            {title}
          </span>
          {author && (
            <span className='flex min-w-0 items-center gap-2 pt-2'>
              <Avatar seed={author} className='size-5' />
              <span className='text-muted-foreground truncate text-xs'>
                {author}
              </span>
            </span>
          )}
        </span>
      </span>
    </a>
  );
}

export default function Effect02() {
  const card = useRef<ParallaxCardHandle>(null);
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = [
    { after: 1100, run: () => card.current?.leanTowards(-0.44, -0.38) },
    { after: 1300, run: () => card.current?.leanTowards(0.42, -0.22) },
    { after: 1200, run: () => card.current?.leanTowards(0.3, 0.4) },
    { after: 1200, run: () => card.current?.rest() },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1600,
    onReset: () => card.current?.rest(),
    isEnabled: !isHovered,
  });
  const isDemoStopped = !isAutoplaying && !isHovered;

  /** A lean the demonstration leaves when a person takes over settles back: a keyboard has no pointer to undo it. */
  useEffect(() => {
    if (isDemoStopped) {
      card.current?.rest();
    }
  }, [isDemoStopped]);

  return (
    <div ref={ref} className='flex w-full justify-center' {...hoverHandlers}>
      <ParallaxCard
        handleRef={card}
        href='#'
        kicker='Travel journal · 6 min read'
        title='Walking the coast road at first light'
        picture='/images/scenes/scene-08.svg'
        author='Mara Lindqvist'
      />
    </div>
  );
}
