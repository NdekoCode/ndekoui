'use client';

import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { PERSON } from './data';

const WAVE_FRAMES: Keyframe[] = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(-16deg)' },
  { transform: 'rotate(12deg)' },
  { transform: 'rotate(-14deg)' },
  { transform: 'rotate(10deg)' },
  { transform: 'rotate(0deg)' },
];

const WAVE_TIMING: KeyframeAnimationOptions = {
  duration: 1700,
  delay: 900,
  easing: 'ease-in-out',
};

const STROKE = 3;

const ELBOW_STYLE = {
  transformBox: 'view-box',
  transformOrigin: '188px 160px',
} as const;

export function DrawnAvatar() {
  const forearmRef = useRef<SVGGElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const forearm = forearmRef.current;
    if (!forearm || shouldReduceMotion) {
      return;
    }
    const wave = forearm.animate(WAVE_FRAMES, WAVE_TIMING);
    return () => wave.cancel();
  }, [shouldReduceMotion]);

  return (
    <svg
      viewBox='0 0 220 240'
      role='img'
      aria-label={`A drawing of ${PERSON.name} waving hello`}
      className='size-full'
    >
      <circle cx='110' cy='132' r='100' className='fill-primary/10' />
      <rect
        x='99'
        y='148'
        width='22'
        height='26'
        rx='8'
        strokeWidth={STROKE}
        className='fill-card stroke-foreground'
      />
      <path
        d='M34 240C34 188 68 168 110 168s76 20 76 72Z'
        strokeWidth={STROKE}
        strokeLinejoin='round'
        className='fill-primary stroke-foreground'
      />
      <path
        d='M97 169l13 16 13-16'
        fill='none'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='stroke-card'
      />
      <path
        d='M60 196c-9 14-13 28-12 44'
        fill='none'
        strokeWidth='17'
        strokeLinecap='round'
        className='stroke-primary'
      />
      <path
        d='M162 192l26-32'
        fill='none'
        strokeWidth='17'
        strokeLinecap='round'
        className='stroke-primary'
      />
      <g ref={forearmRef} style={ELBOW_STYLE}>
        <path
          d='M188 160l-6-42'
          fill='none'
          strokeWidth='17'
          strokeLinecap='round'
          className='stroke-primary'
        />
        <circle
          cx='181'
          cy='106'
          r='11'
          strokeWidth={STROKE}
          className='fill-card stroke-foreground'
        />
      </g>
      <ellipse
        cx='110'
        cy='112'
        rx='38'
        ry='42'
        strokeWidth={STROKE}
        className='fill-card stroke-foreground'
      />
      <path
        d='M70 104C62 62 100 48 112 48c16 0 48 16 38 56-8-20-22-26-40-26S78 84 70 104Z'
        className='fill-foreground'
      />
      <circle cx='97' cy='117' r='3.2' className='fill-foreground' />
      <circle cx='123' cy='117' r='3.2' className='fill-foreground' />
      <path
        d='M98 132c6 8 18 8 24 0'
        fill='none'
        strokeWidth={STROKE}
        strokeLinecap='round'
        className='stroke-foreground'
      />
    </svg>
  );
}
