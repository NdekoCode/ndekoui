'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { watchAim, type Aim } from './_parts/aim';
import { DemoBand } from './_parts/demo-band';
import { DEFAULT_HUE, useHueCycle } from './_parts/hue';

const DEFAULT_PITCH = 20;

const DEFAULT_RADIUS = 180;

const QUIET_DOT =
  'radial-gradient(circle at center, color-mix(in oklab, var(--foreground) 22%, transparent) 1px, transparent 1.5px)';

/** A lit dot is the hue, and a little larger than the quiet dot it covers. */
const LIT_DOT =
  'radial-gradient(circle at center, currentColor 1.75px, transparent 2.25px)';

/** The light: the lit dots show in full at its heart and not at all at its edge. */
const LIGHT_MASK =
  'radial-gradient(closest-side, black, rgb(0 0 0 / 0.85) 30%, rgb(0 0 0 / 0.4) 62%, transparent)';

/**
 * The light is a masked window that a transform carries across the box, and the lit dots inside it
 * are carried back by the opposite transform, so they stay on the grid. Both follow two numbers,
 * the place of the light in hundredths of the box, so moving the light repaints nothing.
 */
const LIGHT_SHIFT = 'calc(var(--spot-x) * 1cqw) calc(var(--spot-y) * 1cqh)';

const DOTS_SHIFT = 'calc(var(--spot-x) * -1cqw) calc(var(--spot-y) * -1cqh)';

const GLIDE = 'translate var(--spot-ms) var(--spot-ease)';

const WALK_EASE = 'cubic-bezier(0.45, 0, 0.55, 1)';

const FOLLOW_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

/** Milliseconds from one waypoint to the next. The glide lasts as long, so the light never stops. */
const WALK_STEP_MS = 3200;

const FOLLOW_MS = 220;

/** The round the light walks while no pointer leads it. The first one is where it rests. */
const WAYPOINTS: Aim[] = [
  { x: 0.5, y: 0.4 },
  { x: 0.72, y: 0.32 },
  { x: 0.64, y: 0.66 },
  { x: 0.34, y: 0.62 },
  { x: 0.26, y: 0.34 },
];

const REST_ACROSS = 50;

const REST_DOWN = 40;

type SpotStyle = CSSProperties & {
  '--spot-x': number;
  '--spot-y': number;
  '--spot-ms': string;
  '--spot-ease': string;
};

function easeOf(isFollowing: boolean) {
  if (isFollowing) {
    return FOLLOW_EASE;
  }
  return WALK_EASE;
}

function moveLight(
  host: HTMLElement,
  aim: Aim,
  durationMs: number,
  isFollowing: boolean
) {
  const across = aim.x * 100;
  const down = aim.y * 100;
  host.style.setProperty('--spot-ms', `${durationMs}ms`);
  host.style.setProperty('--spot-ease', easeOf(isFollowing));
  host.style.setProperty('--spot-x', String(across));
  host.style.setProperty('--spot-y', String(down));
}

function gridOf(dot: string, pitch: number): CSSProperties {
  const backgroundSize = `${pitch}px ${pitch}px`;
  return { backgroundImage: dot, backgroundSize };
}

function lightOf(radius: number): CSSProperties {
  const side = radius * 2;
  return {
    width: side,
    height: side,
    marginLeft: -radius,
    marginTop: -radius,
    translate: LIGHT_SHIFT,
    transition: GLIDE,
    maskImage: LIGHT_MASK,
    WebkitMaskImage: LIGHT_MASK,
  };
}

function litDotsOf(radius: number, pitch: number): CSSProperties {
  return {
    ...gridOf(LIT_DOT, pitch),
    left: radius,
    top: radius,
    width: '100cqw',
    height: '100cqh',
    translate: DOTS_SHIFT,
    transition: GLIDE,
  };
}

export type DotSpotlightProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. The dots under the light wear it. */
  hue?: string;
  /** The distance between two dots, in pixels. */
  size?: number;
  /** The reach of the light, in pixels. */
  radius?: number;
  /** The light follows the pointer. Without it, the light only walks its round. */
  interactive?: boolean;
};

/**
 * A quiet grid of dots and a soft light that lifts the dots under it into the hue. The light
 * follows the pointer, and walks a slow round while no pointer leads it. It is all CSS: the light
 * moves by a transform, on a transition, and no frame is computed. It fills its parent, which
 * must be positioned. Under reduced motion the light rests in place.
 */
export function DotSpotlight({
  className,
  hue = DEFAULT_HUE,
  size = DEFAULT_PITCH,
  radius = DEFAULT_RADIUS,
  interactive = true,
}: DotSpotlightProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const hostStyle: SpotStyle = {
    color: hue,
    '--spot-x': REST_ACROSS,
    '--spot-y': REST_DOWN,
    '--spot-ms': '0ms',
    '--spot-ease': WALK_EASE,
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host || shouldReduceMotion) {
      return;
    }
    return watchAim(host, {
      waypoints: WAYPOINTS,
      stepMs: WALK_STEP_MS,
      glideMs: WALK_STEP_MS,
      followMs: FOLLOW_MS,
      isInteractive: interactive,
      onAim: (aim, durationMs, isFollowing) =>
        moveLight(host, aim, durationMs, isFollowing),
    });
  }, [interactive, shouldReduceMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden='true'
      style={hostStyle}
      className={cn(
        '[container-type:size] pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-500',
        className
      )}
    >
      <div style={gridOf(QUIET_DOT, size)} className='absolute inset-0' />
      <div style={lightOf(radius)} className='absolute top-0 left-0'>
        <div style={litDotsOf(radius, size)} className='absolute' />
      </div>
    </div>
  );
}

export default function Background04() {
  const { hue, nextHue } = useHueCycle();

  return (
    <DemoBand
      title='Dots that light up under the pointer'
      background={<DotSpotlight hue={hue} />}
    >
      <Button onClick={nextHue}>Change hue</Button>
    </DemoBand>
  );
}
