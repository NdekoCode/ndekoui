'use client';

import { motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

import type { CanvasLayout, PlacedWire } from './layout';
import type { Wire } from './session';

const LAYER =
  'pointer-events-none absolute top-0 left-0 size-px overflow-visible';

/** Where the browser can ease a path, a wire follows its step when the step moves along the grid. */
const WIRE =
  'fill-none stroke-[1.5px] transition-[d,stroke] duration-[150ms,300ms] ease-(--ease-out-strong) [stroke-linecap:round]';

/** A wire that has just been made shows in the brand colour, then settles among the others. */
const LANDED = 'starting:stroke-primary';

const HELD = 'fill-none stroke-primary stroke-2 [stroke-linecap:round]';

const DRAW = { duration: 0.5, ease: EASE_OUT_STRONG };

const REACH = { duration: 0.45, ease: EASE_OUT_STRONG };

function toneOf(isLit: boolean) {
  if (isLit) {
    return 'stroke-primary/70';
  }
  return 'stroke-foreground/30';
}

function drawStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

function touchesStep(wire: Wire, stepId: string | null) {
  return wire.from === stepId || wire.to === stepId;
}

type WirePathProps = {
  wire: PlacedWire<Wire>;
  isLit: boolean;
};

/** Only a wire made from a menu draws itself: one let go by a hand is already where it lands. */
function WirePath({ wire, isLit }: WirePathProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const tone = toneOf(isLit);

  if (wire.link.arrival === 'drawn') {
    return (
      <motion.path
        d={wire.path}
        initial={drawStartOf(shouldReduceMotion)}
        animate={{ pathLength: 1 }}
        transition={DRAW}
        className={cn(WIRE, LANDED, tone)}
      />
    );
  }

  const hasLanded = wire.link.arrival === 'dropped';

  return <path d={wire.path} className={cn(WIRE, hasLanded && LANDED, tone)} />;
}

type WireLayerProps = {
  layout: CanvasLayout<Wire>;
  selectedId: string | null;
};

export function WireLayer({ layout, selectedId }: WireLayerProps) {
  return (
    <svg aria-hidden='true' className={LAYER}>
      {layout.wires.map((wire) => (
        <WirePath
          key={`${wire.id}:${wire.link.to}`}
          wire={wire}
          isLit={touchesStep(wire.link, selectedId)}
        />
      ))}
      {layout.labels.map((label) => (
        <text
          key={label.id}
          x={label.x}
          y={label.y}
          className='fill-muted-foreground text-[10px] font-medium'
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}

type HeldLayerProps = {
  /** The wire the demonstration holds out, from its port to the step it aims at. */
  demoPath: string | null;
  /** The wire a pointer holds. Its path is written to the element on every move, never rendered. */
  liveRef: React.Ref<SVGPathElement>;
};

export function HeldLayer({ demoPath, liveRef }: HeldLayerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <svg aria-hidden='true' className={LAYER}>
      {demoPath && (
        <motion.path
          key={demoPath}
          d={demoPath}
          initial={drawStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={REACH}
          className={HELD}
        />
      )}
      <path ref={liveRef} className={HELD} />
    </svg>
  );
}
