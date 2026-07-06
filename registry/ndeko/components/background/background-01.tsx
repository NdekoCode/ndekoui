'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { DemoBand } from './_parts/demo-band';
import { DEFAULT_HUE, useHueCycle } from './_parts/hue';
import { runWhileShowing } from './_parts/loops';
import { softFieldOf } from './_parts/soft-field';

type Field = {
  id: string;
  style: CSSProperties;
  /** Milliseconds for one round of the path. The three differ, so the fields never drift in step. */
  periodMs: number;
  path: Keyframe[];
};

const FIELD_SHAPE = 'closest-side';

function restOf(
  left: string,
  top: string,
  width: string,
  strength: number
): CSSProperties {
  const backgroundImage = softFieldOf(FIELD_SHAPE, strength);
  return { left, top, width, backgroundImage };
}

/** Each leg eases in and out, so a field turns at a waypoint without a corner in its path. */
function legTo(transform: string): Keyframe {
  return { transform, easing: 'ease-in-out' };
}

const FIELDS: Field[] = [
  {
    id: 'near',
    style: restOf('26%', '34%', 'min(64%, 46rem)', 24),
    periodMs: 47000,
    path: [
      legTo('translate(0%, 0%) scale(1)'),
      legTo('translate(14%, 8%) scale(1.08)'),
      legTo('translate(5%, -10%) scale(0.94)'),
      legTo('translate(0%, 0%) scale(1)'),
    ],
  },
  {
    id: 'far',
    style: restOf('74%', '70%', 'min(56%, 40rem)', 17),
    periodMs: 61000,
    path: [
      legTo('translate(0%, 0%) scale(1)'),
      legTo('translate(-12%, -9%) scale(0.93)'),
      legTo('translate(-4%, 10%) scale(1.07)'),
      legTo('translate(0%, 0%) scale(1)'),
    ],
  },
  {
    id: 'high',
    style: restOf('54%', '16%', 'min(42%, 30rem)', 13),
    periodMs: 79000,
    path: [
      legTo('translate(0%, 0%) scale(1)'),
      legTo('translate(10%, 12%) scale(1.1)'),
      legTo('translate(-13%, 5%) scale(0.96)'),
      legTo('translate(0%, 0%) scale(1)'),
    ],
  },
];

function driftsOf(host: HTMLElement, fields: Field[]) {
  const drifts: Animation[] = [];
  fields.forEach((field, index) => {
    const element = host.children.item(index);
    if (!element) {
      return;
    }
    const drift = element.animate(field.path, {
      duration: field.periodMs,
      iterations: Infinity,
    });
    drifts.push(drift);
  });
  return drifts;
}

export type DriftingFieldsProps = {
  className?: string;
  /** Any colour token, such as `var(--primary)` or `var(--series-2)`. The fields wear it at different strengths. */
  hue?: string;
  /** How many fields drift. */
  count?: 1 | 2 | 3;
};

/**
 * Up to three soft fields of one hue that drift behind content. Each is a radial gradient that
 * fades to nothing, moved by a transform alone: no filter, and nothing repainted while they drift.
 * It fills its parent, which must be positioned. Under reduced motion the fields rest in place.
 */
export function DriftingFields({
  className,
  hue = DEFAULT_HUE,
  count = 3,
}: DriftingFieldsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const fields = FIELDS.slice(0, count);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || shouldReduceMotion) {
      return;
    }
    const drifting = FIELDS.slice(0, count);
    const drifts = driftsOf(host, drifting);
    return runWhileShowing(host, drifts);
  }, [count, shouldReduceMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden='true'
      style={{ color: hue }}
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-500',
        className
      )}
    >
      {fields.map((field) => (
        <div
          key={field.id}
          style={field.style}
          className='absolute aspect-5/4 -translate-1/2'
        />
      ))}
    </div>
  );
}

export default function Background01() {
  const { hue, nextHue } = useHueCycle();

  return (
    <DemoBand
      title='Three fields of one hue, drifting'
      background={<DriftingFields hue={hue} />}
    >
      <Button onClick={nextHue}>Change hue</Button>
    </DemoBand>
  );
}
