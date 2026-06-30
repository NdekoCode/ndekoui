import { Children } from 'react';

import { cn } from '@/lib/utils';

const FULL_TURN = 360;

function orbitDurationOf(duration: number, speed: number) {
  const safeSpeed = Math.max(speed, 0.01);
  const seconds = duration / safeSpeed;
  return `${seconds}s`;
}

function slotAngleOf(index: number, count: number, startAngle: number) {
  const step = FULL_TURN / count;
  const angle = startAngle + step * index;
  return (angle * Math.PI) / 180;
}

function slotPositionOf(angle: number, radius: number) {
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
  };
}

const RING_DIRECTION = {
  forward: 'normal',
  backward: 'reverse',
} as const;

const ITEM_DIRECTION = {
  forward: 'reverse',
  backward: 'normal',
} as const;

function playStateOf(paused: boolean) {
  if (paused) {
    return 'paused';
  }
  return 'running';
}

function directionOf(reverse: boolean) {
  if (reverse) {
    return 'backward';
  }
  return 'forward';
}

export type OrbitingCirclesProps = {
  children: React.ReactNode;
  radius?: number;
  duration?: number;
  speed?: number;
  reverse?: boolean;
  startAngle?: number;
  iconSize?: number;
  path?: boolean;
  paused?: boolean;
  className?: string;
};

export function OrbitingCircles({
  children,
  radius = 120,
  duration = 24,
  speed = 1,
  reverse = false,
  startAngle = -90,
  iconSize = 40,
  path = true,
  paused = false,
  className,
}: OrbitingCirclesProps) {
  const items = Children.toArray(children);
  const direction = directionOf(reverse);
  const diameter = radius * 2;
  const animationDuration = orbitDurationOf(duration, speed);
  const animationPlayState = playStateOf(paused);

  return (
    <div
      style={{
        width: diameter,
        height: diameter,
        animationDuration,
        animationDirection: RING_DIRECTION[direction],
        animationPlayState,
      }}
      className={cn(
        'pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full motion-reduce:animate-none',
        path && 'hairline-ring ring-border',
        className
      )}
    >
      {items.map((item, index) => {
        const angle = slotAngleOf(index, items.length, startAngle);
        const position = slotPositionOf(angle, radius);

        return (
          <div
            key={index}
            style={{
              ...position,
              width: iconSize,
              height: iconSize,
              animationDuration,
              animationDirection: ITEM_DIRECTION[direction],
              animationPlayState,
            }}
            className='pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center justify-center motion-reduce:animate-none'
          >
            {item}
          </div>
        );
      })}
    </div>
  );
}
