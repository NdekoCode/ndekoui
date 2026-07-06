'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';

import { TYPE_SERIES, type PortType } from './data';
import type { GraphLayout, PlacedWire, Point } from './layout';
import type { Wire } from './session';

const LAYER =
  'pointer-events-none absolute top-0 left-0 size-px overflow-visible';

const WIRE = 'fill-none stroke-2 [stroke-linecap:round]';

/** A wire that has just been made shows at full strength, then settles among the others. */
const SETTLING =
  'opacity-70 transition-opacity duration-500 starting:opacity-100';

const DRAW = { duration: 0.5, ease: EASE_OUT_STRONG };

const REACH = { duration: 0.45, ease: EASE_OUT_STRONG };

const SHAKE = { duration: 0.34, ease: EASE_OUT_STRONG };

/** An error nudges once: four pixels each way, then back. */
const SHAKEN = { x: [0, -4, 4, -3, 3, 0] };

const STILL = { x: 0 };

const LEAVE = { opacity: 0, transition: { duration: 0.15 } };

export function typeColorOf(type: PortType) {
  return seriesColorOf(TYPE_SERIES[type]);
}

function drawStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

function shakeOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return STILL;
  }
  return SHAKEN;
}

/** Only a wire made from a menu draws itself: one let go by a hand is already where it lands. */
function WirePath({ wire }: { wire: PlacedWire<Wire> }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const style = { stroke: typeColorOf(wire.type) };

  if (wire.link.arrival === 'drawn') {
    return (
      <motion.path
        d={wire.path}
        style={style}
        initial={drawStartOf(shouldReduceMotion)}
        animate={{ pathLength: 1 }}
        transition={DRAW}
        className={cn(WIRE, SETTLING)}
      />
    );
  }

  const hasLanded = wire.link.arrival === 'dropped';

  return (
    <path
      d={wire.path}
      style={style}
      className={cn(WIRE, 'opacity-70', hasLanded && SETTLING)}
    />
  );
}

export function WireLayer({ layout }: { layout: GraphLayout<Wire> }) {
  return (
    <svg aria-hidden='true' className={LAYER}>
      {layout.wires.map((wire) => (
        <WirePath key={wire.id} wire={wire} />
      ))}
    </svg>
  );
}

export type HeldWire = {
  path: string;
  type: PortType;
};

export type RefusedWire = {
  id: number;
  path: string;
  end: Point;
};

type HeldLayerProps = {
  /** The wire the demonstration holds out, from its port to the node it aims at. */
  demo: HeldWire | null;
  /** A wire that was refused: it stays a moment, its end shakes once, then it leaves. */
  refused: RefusedWire | null;
  /** The wire a pointer holds. Its path is written to the element on every move, never rendered. */
  liveRef: React.Ref<SVGPathElement>;
};

export function HeldLayer({ demo, refused, liveRef }: HeldLayerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <svg aria-hidden='true' className={LAYER}>
      {demo && (
        <motion.path
          key={demo.path}
          d={demo.path}
          style={{ stroke: typeColorOf(demo.type) }}
          initial={drawStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={REACH}
          className={WIRE}
        />
      )}
      <AnimatePresence>
        {refused && (
          <motion.g key={refused.id} exit={LEAVE}>
            <path
              d={refused.path}
              className={cn(WIRE, 'stroke-destructive [stroke-dasharray:4_5]')}
            />
            <motion.circle
              cx={refused.end.x}
              cy={refused.end.y}
              r={5}
              animate={shakeOf(shouldReduceMotion)}
              transition={SHAKE}
              className='fill-destructive'
            />
          </motion.g>
        )}
      </AnimatePresence>
      <path ref={liveRef} className={WIRE} />
    </svg>
  );
}
