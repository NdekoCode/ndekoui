'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

type Frame = {
  width: number;
  height: number;
  radius: number;
};

type TailLayer = {
  share: number;
  opacity: number;
};

const TAIL_LAYERS: TailLayer[] = [
  { share: 1, opacity: 0.14 },
  { share: 0.72, opacity: 0.2 },
  { share: 0.46, opacity: 0.3 },
  { share: 0.24, opacity: 0.5 },
  { share: 0.08, opacity: 1 },
];

const EMPTY_FRAME: Frame = { width: 0, height: 0, radius: 0 };

function radiusOf(element: HTMLElement | null) {
  if (!element) {
    return 0;
  }
  const corner = getComputedStyle(element).borderTopLeftRadius;
  const radius = Number.parseFloat(corner);
  if (Number.isNaN(radius)) {
    return 0;
  }
  return radius;
}

function frameOf(svg: SVGSVGElement, radiusOverride: number | undefined) {
  const box = svg.getBoundingClientRect();
  const measuredRadius = radiusOf(svg.parentElement);
  const radius = radiusOverride ?? measuredRadius;
  const shortSide = Math.min(box.width, box.height);
  const halfSide = shortSide / 2;
  return {
    width: box.width,
    height: box.height,
    radius: Math.min(radius, halfSide),
  };
}

function perimeterOf(frame: Frame) {
  const straightWidth = frame.width - frame.radius * 2;
  const straightHeight = frame.height - frame.radius * 2;
  const corners = Math.PI * 2 * frame.radius;
  return straightWidth * 2 + straightHeight * 2 + corners;
}

/**
 * Every layer of the tail shares the head, so the stacked opacities fade towards the tail. The head
 * leads the travel: at the end of the pattern going forward, at its start going in reverse.
 */
function dashOf(
  layer: TailLayer,
  beamLength: number,
  period: number,
  reverse: boolean
) {
  const layerLength = beamLength * layer.share;
  if (reverse) {
    const gap = period - layerLength;
    return `${layerLength} ${gap}`;
  }
  const leadingGap = beamLength - layerLength;
  const trailingGap = period - beamLength;
  return `0 ${leadingGap} ${layerLength} ${trailingGap}`;
}

function travelOf(perimeter: number, reverse: boolean) {
  if (reverse) {
    return perimeter;
  }
  return -perimeter;
}

function opacityOf(isActive: boolean) {
  if (isActive) {
    return 1;
  }
  return 0;
}

const PAUSE_AFTER_FADE_MS = 200;

export type BorderBeamProps = {
  duration?: number;
  length?: number;
  width?: number;
  count?: number;
  offset?: number;
  reverse?: boolean;
  active?: boolean;
  radius?: number;
  className?: string;
};

export function BorderBeam({
  duration = 6,
  length = 0.3,
  width = 1.5,
  count = 1,
  offset = 0,
  reverse = false,
  active = true,
  radius,
  className,
}: BorderBeamProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const trackRef = useRef<SVGGElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const resumeTimeRef = useRef<CSSNumberish | null>(null);
  const [frame, setFrame] = useState(EMPTY_FRAME);
  const [isOnScreen, setIsOnScreen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const perimeter = perimeterOf(frame);
  const wholeCount = Math.round(count);
  const beamCount = Math.max(wholeCount, 1);
  const period = perimeter / beamCount;
  const fullBeam = length * perimeter;
  const beamLength = Math.min(fullBeam, period);
  const startOffset = -offset * perimeter;
  const hasSize = perimeter > 0;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const measure = () => {
      const nextFrame = frameOf(svg, radius);
      setFrame(nextFrame);
    };
    const sizeObserver = new ResizeObserver(measure);
    sizeObserver.observe(svg);
    const screenObserver = new IntersectionObserver(([entry]) => {
      setIsOnScreen(entry.isIntersecting);
    });
    screenObserver.observe(svg);
    return () => {
      sizeObserver.disconnect();
      screenObserver.disconnect();
    };
  }, [radius]);

  useEffect(() => {
    const track = trackRef.current;
    const shouldTravel = hasSize && !prefersReducedMotion;
    if (!track || !shouldTravel) {
      return;
    }
    const previousTime = resumeTimeRef.current ?? 0;
    const travel = travelOf(perimeter, reverse);
    const endOffset = startOffset + travel;
    const durationMs = duration * 1000;
    const animation = track.animate(
      [
        { strokeDashoffset: `${startOffset}` },
        { strokeDashoffset: `${endOffset}` },
      ],
      { duration: durationMs, iterations: Infinity, easing: 'linear' }
    );
    animation.currentTime = previousTime;
    animationRef.current = animation;
    return () => {
      resumeTimeRef.current = animation.currentTime;
      animationRef.current = null;
      animation.cancel();
    };
  }, [
    hasSize,
    perimeter,
    startOffset,
    reverse,
    duration,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    const animation = animationRef.current;
    if (!animation) {
      return;
    }
    const shouldRun = active && isOnScreen;
    if (shouldRun) {
      animation.play();
      return;
    }
    const pause = () => animation.pause();
    const timer = window.setTimeout(pause, PAUSE_AFTER_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [active, isOnScreen, perimeter, duration, reverse, startOffset]);

  return (
    <svg
      ref={svgRef}
      aria-hidden='true'
      data-active={active}
      className={cn(
        'text-primary pointer-events-none absolute inset-0 size-full overflow-visible transition-opacity duration-300 ease-(--ease-out-strong) data-[active=false]:duration-150',
        className
      )}
      style={{ opacity: opacityOf(active) }}
    >
      {hasSize && (
        <g
          ref={trackRef}
          fill='none'
          stroke='currentColor'
          strokeWidth={width}
          strokeDashoffset={startOffset}
        >
          {TAIL_LAYERS.map((layer) => (
            <rect
              key={layer.share}
              width={frame.width}
              height={frame.height}
              rx={frame.radius}
              ry={frame.radius}
              opacity={layer.opacity}
              strokeDasharray={dashOf(layer, beamLength, period, reverse)}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
