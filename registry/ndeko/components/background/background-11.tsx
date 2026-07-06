'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { watchAim, type Aim } from './_parts/aim';
import { DemoBand } from './_parts/demo-band';
import { DEFAULT_HUE, useHueCycle } from './_parts/hue';
import { clamp, towards } from './_parts/math';

const DEFAULT_BANDS = 6;

const MIN_BANDS = 5;

const MAX_BANDS = 7;

const DEFAULT_SURFACE = 'var(--background)';

/**
 * The bands are ellipses of one shape, each a larger copy of the one inside it, so the edge of a
 * band runs alongside the edge of its neighbour all the way round. A size is a share of the box:
 * the innermost band sits behind a headline, the outermost one covers the box.
 */
const INNER_SCALE = 0.3;

const OUTER_SCALE = 1.45;

const HEIGHT_SHARE = 1.7;

/** The innermost band has no neighbour inside it: its ramp starts this far out, in per cent. */
const FIRST_RAMP_START = 45;

/**
 * A band is an opaque tint of the hue on the surface under the piece, so a band covers what lies
 * under it and the colour starts again at its edge. Over that tint, a ramp deepens it towards the
 * outer edge.
 */
const BAND_TINT =
  'color-mix(in oklab, currentColor var(--glass-light), var(--glass-surface))';

const BAND_DEPTH =
  'color-mix(in oklab, currentColor var(--glass-depth), transparent)';

/** How much hue a band holds at its inner and outer edge, drawn stronger on a dark surface. */
const TINTS =
  '[--glass-depth:13%] [--glass-light:4%] dark:[--glass-depth:20%] dark:[--glass-light:6%]';

/**
 * How far the innermost band travels when the aim reaches an edge of the box, in hundredths of the
 * box for each hundredth of aim. The outer bands travel less, so the set leans like a stepped lens.
 */
const FOLLOW_ACROSS = 0.12;

const FOLLOW_DOWN = 0.2;

const OUTER_FOLLOW = 0.45;

const GLIDE = 'translate var(--glass-ms) var(--glass-ease)';

const WALK_EASE = 'cubic-bezier(0.45, 0, 0.55, 1)';

const FOLLOW_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

/** The centre moves, then rests: a step is longer than the glide that makes it. */
const WALK_STEP_MS = 4400;

const WALK_GLIDE_MS = 2600;

const FOLLOW_MS = 700;

/** The round the centre walks while no pointer leads it. The first one is where it rests. */
const WAYPOINTS: Aim[] = [
  { x: 0.5, y: 0.5 },
  { x: 0.7, y: 0.36 },
  { x: 0.4, y: 0.66 },
  { x: 0.62, y: 0.62 },
  { x: 0.3, y: 0.42 },
];

type GlassStyle = CSSProperties & {
  '--glass-x': number;
  '--glass-y': number;
  '--glass-ms': string;
  '--glass-ease': string;
  '--glass-surface': string;
};

function easeOf(isFollowing: boolean) {
  if (isFollowing) {
    return FOLLOW_EASE;
  }
  return WALK_EASE;
}

/** The aim, counted from the middle of the box in hundredths of it. */
function offsetOf(share: number) {
  const fromMiddle = share - 0.5;
  return fromMiddle * 100;
}

function moveCentre(
  host: HTMLElement,
  aim: Aim,
  durationMs: number,
  isFollowing: boolean
) {
  const across = offsetOf(aim.x);
  const down = offsetOf(aim.y);
  host.style.setProperty('--glass-ms', `${durationMs}ms`);
  host.style.setProperty('--glass-ease', easeOf(isFollowing));
  host.style.setProperty('--glass-x', String(across));
  host.style.setProperty('--glass-y', String(down));
}

/** Where the ramp of a band starts, in per cent of its radius: at the edge of the band inside it. */
function rampStartOf(scale: number, step: number, isInnermost: boolean) {
  if (isInnermost) {
    return FIRST_RAMP_START;
  }
  const inside = scale - step;
  const share = inside / scale;
  return share * 100;
}

function bandStyleOf(index: number, count: number): CSSProperties {
  const last = count - 1;
  const share = index / last;
  const span = OUTER_SCALE - INNER_SCALE;
  const step = span / last;
  const scale = towards(INNER_SCALE, OUTER_SCALE, share);
  const follow = towards(1, OUTER_FOLLOW, share);
  const followAcross = follow * FOLLOW_ACROSS;
  const followDown = follow * FOLLOW_DOWN;
  const width = scale * 100;
  const height = width * HEIGHT_SHARE;
  const rampStart = rampStartOf(scale, step, index === 0);
  return {
    width: `${width}%`,
    height: `${height}%`,
    backgroundColor: BAND_TINT,
    backgroundImage: `radial-gradient(closest-side, transparent ${rampStart}%, ${BAND_DEPTH})`,
    translate: `calc(var(--glass-x) * ${followAcross}cqw) calc(var(--glass-y) * ${followDown}cqh)`,
    transition: GLIDE,
  };
}

/** From the outermost band to the innermost, which is the order they are painted in. */
function bandsOf(count: number) {
  const indexes = Array.from({ length: count }, (_, index) => index);
  return indexes.reverse();
}

export type GlassBandsProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. Every band is a tint of it. */
  hue?: string;
  /** How many bands, from five to seven. */
  bands?: number;
  /** The colour under the piece. A band is an opaque tint of the hue on it. */
  surface?: string;
  /** The centre of the bands eases towards the pointer. Without it, the centre only walks its round. */
  interactive?: boolean;
};

/**
 * Concentric bands of one hue. Each holds its own short ramp, light at its inner edge and a little
 * deeper at its outer edge, so the colour starts again at every curved edge and the set reads as
 * glass. The centre eases towards the pointer and the inner bands travel further than the outer
 * ones. It is all CSS: a band moves by a transform, on a transition. It fills its parent, which
 * must be positioned. Under reduced motion the bands rest, centred.
 */
export function GlassBands({
  className,
  hue = DEFAULT_HUE,
  bands = DEFAULT_BANDS,
  surface = DEFAULT_SURFACE,
  interactive = true,
}: GlassBandsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const whole = Math.round(bands);
  const count = clamp(whole, MIN_BANDS, MAX_BANDS);
  const hostStyle: GlassStyle = {
    color: hue,
    '--glass-x': 0,
    '--glass-y': 0,
    '--glass-ms': '0ms',
    '--glass-ease': WALK_EASE,
    '--glass-surface': surface,
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host || shouldReduceMotion) {
      return;
    }
    return watchAim(host, {
      waypoints: WAYPOINTS,
      stepMs: WALK_STEP_MS,
      glideMs: WALK_GLIDE_MS,
      followMs: FOLLOW_MS,
      isInteractive: interactive,
      onAim: (aim, durationMs, isFollowing) =>
        moveCentre(host, aim, durationMs, isFollowing),
    });
  }, [interactive, shouldReduceMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden='true'
      style={hostStyle}
      className={cn(
        '[container-type:size] pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-500',
        TINTS,
        className
      )}
    >
      {bandsOf(count).map((index) => (
        <div
          key={index}
          style={bandStyleOf(index, count)}
          className='absolute inset-0 m-auto rounded-full'
        />
      ))}
    </div>
  );
}

export default function Background11() {
  const { hue, nextHue } = useHueCycle();

  return (
    <DemoBand
      title='One hue that starts again at every edge'
      background={<GlassBands hue={hue} />}
    >
      <Button onClick={nextHue}>Change hue</Button>
    </DemoBand>
  );
}
