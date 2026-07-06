'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { HERO } from './data';
import { useGaze } from './use-gaze';

/** The stroke weight of the icon module, kept at the same width however large the drawing is shown. */
const STROKE_WIDTH = 1.75;

const OUTLINE = 'stroke-foreground/70';

const PLATE = 'fill-card stroke-foreground/70';

const VISOR = 'fill-muted stroke-foreground/70';

const EYE = 'fill-foreground origin-center [transform-box:fill-box]';

const EYES_FOLLOW_GAZE =
  'transition-transform duration-150 ease-out [transform:translate(calc(var(--gaze-x,0)*1px),calc(var(--gaze-y,0)*1px))]';

export function AgentFace() {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { amount: 0.3 });
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isOnScreen = isInView && isVisible;
  const isActive = isOnScreen && !shouldReduceMotion;

  useGaze(ref, isActive);

  return (
    <div className='flex flex-col items-start gap-3'>
      <div className='bg-foreground/[0.04] size-32 rounded-2xl p-4 @3xl:size-40'>
        <svg
          ref={ref}
          viewBox='0 0 96 96'
          fill='none'
          strokeWidth={STROKE_WIDTH}
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden='true'
          className='size-full **:[vector-effect:non-scaling-stroke]'
        >
          <path d='M48 20V12' className={OUTLINE} />
          <circle
            cx='48'
            cy='9'
            r='3.5'
            className='fill-primary stroke-primary'
          />
          <rect x='7' y='41' width='7' height='18' rx='3.5' className={PLATE} />
          <rect
            x='82'
            y='41'
            width='7'
            height='18'
            rx='3.5'
            className={PLATE}
          />
          <rect
            x='14'
            y='20'
            width='68'
            height='58'
            rx='20'
            className={PLATE}
          />
          <rect
            x='24'
            y='36'
            width='48'
            height='24'
            rx='12'
            className={VISOR}
          />
          <g className={EYES_FOLLOW_GAZE}>
            <rect
              data-eye=''
              x='38'
              y='42'
              width='6'
              height='12'
              rx='3'
              className={EYE}
            />
            <rect
              data-eye=''
              x='52'
              y='42'
              width='6'
              height='12'
              rx='3'
              className={EYE}
            />
          </g>
          <path d='M41 68q7 4.5 14 0' className={OUTLINE} />
        </svg>
      </div>
      <div className='flex flex-col'>
        <p className='text-[13px] font-medium'>{HERO.agentName}</p>
        <p className='text-muted-foreground text-xs'>{HERO.agentRole}</p>
      </div>
    </div>
  );
}
