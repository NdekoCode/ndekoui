'use client';

import { useInView } from 'motion/react';
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
} from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

export type PatternKind = 'zigzag' | 'stripes' | 'grid' | 'dots';

type PatternTile = {
  width: number;
  height: number;
  /** One whole tile in the direction of the drift, so each loop ends exactly where it began. */
  driftX: number;
  driftY: number;
  shape: ReactNode;
};

/** The time the pattern takes to drift by one tile, slow enough to read as a texture. */
const DRIFT_MS = 3200;

const UNSAFE_ID_CHARACTERS = /[^a-zA-Z0-9_-]/g;

const HAIRLINE: CSSProperties = { strokeWidth: 'var(--hairline, 1px)' };

const TILES: Record<PatternKind, PatternTile> = {
  zigzag: {
    width: 16,
    height: 10,
    driftX: 16,
    driftY: 0,
    shape: (
      <path
        d='M0 7.5 4 2.5 8 7.5 12 2.5 16 7.5'
        fill='none'
        stroke='currentColor'
        strokeLinejoin='round'
        style={HAIRLINE}
      />
    ),
  },
  stripes: {
    width: 10,
    height: 10,
    driftX: 10,
    driftY: 0,
    shape: (
      <path
        d='M-2.5 2.5 2.5-2.5M0 10 10 0M7.5 12.5 12.5 7.5'
        fill='none'
        stroke='currentColor'
        style={HAIRLINE}
      />
    ),
  },
  grid: {
    width: 16,
    height: 16,
    driftX: 16,
    driftY: 16,
    shape: (
      <path
        d='M16 0H0V16'
        fill='none'
        stroke='currentColor'
        shapeRendering='crispEdges'
        style={HAIRLINE}
      />
    ),
  },
  dots: {
    width: 12,
    height: 12,
    driftX: 12,
    driftY: 12,
    shape: <circle cx='6' cy='6' r='1' fill='currentColor' />,
  },
};

function driftFramesOf(tile: PatternTile): Keyframe[] {
  return [
    { transform: 'translate(0px, 0px)' },
    { transform: `translate(${tile.driftX}px, ${tile.driftY}px)` },
  ];
}

/** The layer reaches one tile past the top and left edges, so the drift never uncovers a corner. */
function layerStyleOf(tile: PatternTile): CSSProperties {
  const top = -tile.driftY;
  const left = -tile.driftX;
  return { top, left, right: 0, bottom: 0 };
}

/**
 * One Web Animation on the transform of the layer, made once and only paused or played: it runs
 * on the compositor while the frame is on screen and stays where it stopped when it leaves.
 */
function useDrift(
  layerRef: RefObject<HTMLDivElement | null>,
  tile: PatternTile,
  isDrifting: boolean,
  shouldReduceMotion: boolean
) {
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) {
      return;
    }
    if (shouldReduceMotion) {
      return;
    }
    const frames = driftFramesOf(tile);
    const animation = layer.animate(frames, {
      duration: DRIFT_MS,
      iterations: Infinity,
      easing: 'linear',
    });
    animation.pause();
    animationRef.current = animation;
    return () => {
      animation.cancel();
      animationRef.current = null;
    };
  }, [layerRef, tile, shouldReduceMotion]);

  useEffect(() => {
    const animation = animationRef.current;
    if (!animation) {
      return;
    }
    if (isDrifting) {
      animation.play();
      return;
    }
    animation.pause();
  }, [isDrifting, tile, shouldReduceMotion]);
}

type PatternFrameProps = {
  pattern: PatternKind;
  className?: string;
  children: ReactNode;
};

/**
 * A tray drawn with a pattern of hairlines around a solid panel. The pattern drifts while the
 * tray is on screen, stops off screen and in a hidden tab, and stays still under reduced motion.
 */
export function PatternFrame({
  pattern,
  className,
  children,
}: PatternFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const isInView = useInView(frameRef, { amount: 0.2 });
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = usePrefersReducedMotion();
  const safeId = rawId.replace(UNSAFE_ID_CHARACTERS, '');
  const patternId = `pattern-${safeId}`;
  const tile = TILES[pattern];
  const layerStyle = layerStyleOf(tile);
  const isDrifting = isInView && isVisible;

  useDrift(layerRef, tile, isDrifting, shouldReduceMotion);

  return (
    <div
      ref={frameRef}
      className={cn(
        'bg-foreground/[0.02] relative isolate overflow-hidden rounded-2xl p-5 @md:p-10',
        className
      )}
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10'
      >
        <div ref={layerRef} style={layerStyle} className='absolute'>
          <svg className='text-border size-full'>
            <defs>
              <pattern
                id={patternId}
                width={tile.width}
                height={tile.height}
                patternUnits='userSpaceOnUse'
              >
                {tile.shape}
              </pattern>
            </defs>
            <rect width='100%' height='100%' fill={`url(#${patternId})`} />
          </svg>
        </div>
      </div>
      {children}
    </div>
  );
}
