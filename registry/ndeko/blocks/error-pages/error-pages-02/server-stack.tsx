'use client';

import { motion, type Transition } from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';

import type { LoadStatus } from './session';

type PlateTone = 'ok' | 'error' | 'running';

const PLATE_TOPS = [14, 50, 86];

const MIDDLE_PLATE = 1;

const LIGHT_XS = [46, 56, 66];

const VENT_XS = [140, 146, 152];

const FIRST_LIGHT_FILL: Record<PlateTone, string> = {
  ok: 'fill-success',
  error: 'fill-destructive',
  running: 'fill-info',
};

const PLATE_TINT: Record<PlateTone, string> = {
  ok: 'fill-transparent',
  error: 'fill-destructive/[0.07]',
  running: 'fill-info/[0.06]',
};

const BLINK = { opacity: [0.25, 1, 0.25] };

function blinkOf(index: number): Transition {
  return {
    duration: 0.9,
    ease: 'easeInOut',
    repeat: Infinity,
    delay: index * 0.15,
  };
}

function middleToneOf(status: LoadStatus): PlateTone {
  if (status === 'retrying') {
    return 'running';
  }
  if (status === 'recovered') {
    return 'ok';
  }
  return 'error';
}

function toneOf(index: number, status: LoadStatus): PlateTone {
  if (index === MIDDLE_PLATE) {
    return middleToneOf(status);
  }
  return 'ok';
}

/** The lights only blink while a retry is really on its way. */
function RunningLights({ y }: { y: number }) {
  return (
    <>
      {LIGHT_XS.map((x, index) => (
        <motion.circle
          key={x}
          cx={x}
          cy={y}
          r='3'
          className='fill-info'
          initial={{ opacity: 0.25 }}
          animate={BLINK}
          transition={blinkOf(index)}
        />
      ))}
    </>
  );
}

function StillLights({ y, tone }: { y: number; tone: PlateTone }) {
  const [firstX, ...otherXs] = LIGHT_XS;

  return (
    <>
      <circle
        cx={firstX}
        cy={y}
        r='3'
        className={cn('transition-[fill] duration-300', FIRST_LIGHT_FILL[tone])}
      />
      {otherXs.map((x) => (
        <circle key={x} cx={x} cy={y} r='3' className='fill-foreground/15' />
      ))}
    </>
  );
}

function Plate({ top, tone }: { top: number; tone: PlateTone }) {
  const lightY = top + 14;
  const ventTop = top + 9;
  const ventBottom = top + 19;
  const isRunning = tone === 'running';

  return (
    <g>
      <rect
        x='30'
        y={top}
        width='140'
        height='28'
        rx='7'
        strokeWidth='1'
        vectorEffect='non-scaling-stroke'
        className='fill-card stroke-border'
      />
      <rect
        x='30'
        y={top}
        width='140'
        height='28'
        rx='7'
        className={cn('transition-[fill] duration-300', PLATE_TINT[tone])}
      />
      {isRunning && <RunningLights y={lightY} />}
      {!isRunning && <StillLights y={lightY} tone={tone} />}
      <rect
        x='82'
        y={lightY - 2}
        width='40'
        height='4'
        rx='2'
        className='fill-foreground/10'
      />
      {VENT_XS.map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1={ventTop}
          y2={ventBottom}
          strokeWidth='1.5'
          strokeLinecap='round'
          className='stroke-foreground/15'
        />
      ))}
    </g>
  );
}

export function ServerStack({ status }: { status: LoadStatus }) {
  return (
    <svg
      viewBox='0 0 200 128'
      aria-hidden='true'
      className='w-full max-w-[12rem] overflow-visible'
    >
      <ellipse
        cx='100'
        cy='122'
        rx='76'
        ry='4'
        className='fill-foreground/[0.05]'
      />
      {PLATE_TOPS.map((top, index) => (
        <Plate key={top} top={top} tone={toneOf(index, status)} />
      ))}
    </svg>
  );
}
