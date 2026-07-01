'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useId, useState } from 'react';

import { cn } from '@/lib/utils';

type Point = { x: number; y: number };

type BeamGeometry = {
  width: number;
  height: number;
  start: Point;
  end: Point;
  path: string;
};

type ElementRef = React.RefObject<HTMLElement | null>;

type BeamOffsets = {
  start: Point;
  end: Point;
};

const HEAD_LENGTH = 0.35;

const TRAVEL_EASE = [0.77, 0, 0.175, 1] as const;

function centreOf(element: HTMLElement, origin: DOMRect): Point {
  const box = element.getBoundingClientRect();
  const left = box.left - origin.left;
  const top = box.top - origin.top;
  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  return { x: left + halfWidth, y: top + halfHeight };
}

function shiftedOf(point: Point, offset: Point): Point {
  const x = point.x + offset.x;
  const y = point.y + offset.y;
  return { x, y };
}

function curvedPathOf(start: Point, end: Point, curvature: number) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.hypot(deltaX, deltaY);
  const length = Math.max(distance, 1);
  const normalX = -deltaY / length;
  const normalY = deltaX / length;
  const bendX = normalX * curvature;
  const bendY = normalY * curvature;
  const middleX = (start.x + end.x) / 2;
  const middleY = (start.y + end.y) / 2;
  const controlX = middleX + bendX;
  const controlY = middleY + bendY;
  return `M ${start.x},${start.y} Q ${controlX},${controlY} ${end.x},${end.y}`;
}

function measureBeam(
  container: HTMLElement,
  from: HTMLElement,
  to: HTMLElement,
  curvature: number,
  offsets: BeamOffsets
): BeamGeometry {
  const origin = container.getBoundingClientRect();
  const fromCentre = centreOf(from, origin);
  const toCentre = centreOf(to, origin);
  const start = shiftedOf(fromCentre, offsets.start);
  const end = shiftedOf(toCentre, offsets.end);
  return {
    width: origin.width,
    height: origin.height,
    start,
    end,
    path: curvedPathOf(start, end, curvature),
  };
}

function useBeamGeometry(
  containerRef: ElementRef,
  fromRef: ElementRef,
  toRef: ElementRef,
  curvature: number,
  offsets: BeamOffsets
) {
  const [geometry, setGeometry] = useState<BeamGeometry | null>(null);
  const startX = offsets.start.x;
  const startY = offsets.start.y;
  const endX = offsets.end.x;
  const endY = offsets.end.y;

  useEffect(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    const isMissingNode = !from || !to;
    if (!container || isMissingNode) {
      return;
    }
    const measuredOffsets: BeamOffsets = {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    };
    const observer = new ResizeObserver(() => {
      const next = measureBeam(container, from, to, curvature, measuredOffsets);
      setGeometry(next);
    });
    observer.observe(container);
    observer.observe(from);
    observer.observe(to);
    return () => observer.disconnect();
  }, [containerRef, fromRef, toRef, curvature, startX, startY, endX, endY]);

  return geometry;
}

function pointAlong(start: Point, end: Point, progress: number): Point {
  const stepX = (end.x - start.x) * progress;
  const stepY = (end.y - start.y) * progress;
  return { x: start.x + stepX, y: start.y + stepY };
}

function travelOf(start: Point, end: Point) {
  const tailFrom = pointAlong(start, end, -HEAD_LENGTH);
  const tailTo = pointAlong(start, end, 1);
  const headFrom = start;
  const headTo = pointAlong(start, end, 1 + HEAD_LENGTH);
  return {
    x1: [tailFrom.x, tailTo.x],
    y1: [tailFrom.y, tailTo.y],
    x2: [headFrom.x, headTo.x],
    y2: [headFrom.y, headTo.y],
  };
}

function firstFrameOf(travel: ReturnType<typeof travelOf>) {
  return {
    x1: travel.x1[0],
    y1: travel.y1[0],
    x2: travel.x2[0],
    y2: travel.y2[0],
  };
}

function directedEnds(geometry: BeamGeometry, reverse: boolean) {
  if (reverse) {
    return { from: geometry.end, to: geometry.start };
  }
  return { from: geometry.start, to: geometry.end };
}

function safeIdOf(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

export type AnimatedBeamProps = {
  containerRef: ElementRef;
  fromRef: ElementRef;
  toRef: ElementRef;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  repeatDelay?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
  className?: string;
};

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 3,
  delay = 0,
  repeatDelay = 1,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  className,
}: AnimatedBeamProps) {
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(containerRef);
  const offsets: BeamOffsets = {
    start: { x: startXOffset, y: startYOffset },
    end: { x: endXOffset, y: endYOffset },
  };
  const geometry = useBeamGeometry(
    containerRef,
    fromRef,
    toRef,
    curvature,
    offsets
  );
  const beamId = useId();
  const gradientId = `beam-${safeIdOf(beamId)}`;

  if (!geometry) {
    return null;
  }

  const ends = directedEnds(geometry, reverse);
  const travel = travelOf(ends.from, ends.to);
  const isTravelling = isInView && !prefersReducedMotion;

  return (
    <svg
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute inset-0 size-full',
        className
      )}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      fill='none'
    >
      <path
        d={geometry.path}
        className='stroke-foreground/12'
        strokeWidth={1.5}
        strokeLinecap='round'
      />
      {isTravelling && (
        <>
          <path
            d={geometry.path}
            stroke={`url(#${gradientId})`}
            strokeWidth={2}
            strokeLinecap='round'
          />
          <defs>
            <motion.linearGradient
              id={gradientId}
              gradientUnits='userSpaceOnUse'
              initial={firstFrameOf(travel)}
              animate={travel}
              transition={{
                duration,
                delay,
                repeatDelay,
                repeat: Infinity,
                ease: TRAVEL_EASE,
              }}
            >
              <stop
                offset='0'
                style={{ stopColor: 'var(--primary)' }}
                stopOpacity={0}
              />
              <stop offset='0.75' style={{ stopColor: 'var(--primary)' }} />
              <stop
                offset='1'
                style={{ stopColor: 'var(--primary)' }}
                stopOpacity={0}
              />
            </motion.linearGradient>
          </defs>
        </>
      )}
    </svg>
  );
}

const NODE_SIZES = {
  sm: 'size-10 rounded-lg [&_svg]:size-4',
  md: 'size-12 rounded-xl [&_svg]:size-5',
  lg: 'size-16 rounded-2xl [&_svg]:size-6',
} as const;

const NODE_MATERIALS = {
  tile: 'bg-muted text-muted-foreground',
  keycap: 'keycap-3d text-muted-foreground',
  gem: 'gem-plate [--gem:var(--primary)]',
} as const;

export type BeamNodeProps = React.ComponentProps<'div'> & {
  material?: keyof typeof NODE_MATERIALS;
  size?: keyof typeof NODE_SIZES;
};

export function BeamNode({
  material = 'tile',
  size = 'md',
  className,
  ...props
}: BeamNodeProps) {
  return (
    <div
      className={cn(
        'relative z-10 grid shrink-0 place-items-center',
        NODE_MATERIALS[material],
        NODE_SIZES[size],
        className
      )}
      {...props}
    />
  );
}
