import type { CSSProperties } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

/** A corner by name, or a custom property that holds one, so a container query can move the notch. */
export type TicketCorner =
  | 'left top'
  | 'right top'
  | 'left bottom'
  | 'right bottom'
  | `var(--${string})`;

const NOTCH_PX = 7;

const SCALLOP_PX = 5;

const SCALLOP_STEP_PX = 16;

/** Half a pixel of soft edge keeps the curve of a cut from showing steps. */
const SOFT_EDGE_PX = 0.5;

type MaskLayer = { image: string; size: string; repeat: string };

function holeAt(position: string, radius: number) {
  const edge = radius + SOFT_EDGE_PX;
  return `radial-gradient(circle at ${position}, transparent ${radius}px, black ${edge}px)`;
}

function notchLayerOf(corner: TicketCorner): MaskLayer {
  return {
    image: holeAt(corner, NOTCH_PX),
    size: '100% 100%',
    repeat: 'no-repeat',
  };
}

/** `round` fits a whole number of half circles into the edge, whatever the width of the ticket. */
const SCALLOP_LAYER: MaskLayer = {
  image: holeAt('50% 100%', SCALLOP_PX),
  size: `${SCALLOP_STEP_PX}px 100%`,
  repeat: 'round no-repeat',
};

function layersOf(corners: readonly TicketCorner[], hasScallops: boolean) {
  const notches = corners.map(notchLayerOf);
  if (hasScallops) {
    return [...notches, SCALLOP_LAYER];
  }
  return notches;
}

/**
 * The mask of one piece of a ticket: a quarter circle cut out of each named corner, so two pieces
 * that meet show a round notch, and a scalloped bottom edge when asked.
 */
export function ticketMaskOf(
  corners: readonly TicketCorner[],
  hasScallops = false
): CSSProperties {
  const layers = layersOf(corners, hasScallops);
  const images = layers.map((layer) => layer.image);
  const sizes = layers.map((layer) => layer.size);
  const repeats = layers.map((layer) => layer.repeat);
  return {
    maskImage: images.join(', '),
    maskSize: sizes.join(', '),
    maskRepeat: repeats.join(', '),
    maskComposite: 'intersect',
  };
}

const OUTLINE_SHADOWS = [
  'drop-shadow(0 var(--hairline) 0 var(--border))',
  'drop-shadow(0 calc(var(--hairline) * -1) 0 var(--border))',
  'drop-shadow(var(--hairline) 0 0 var(--border))',
  'drop-shadow(calc(var(--hairline) * -1) 0 0 var(--border))',
  'drop-shadow(0 1px 1px rgb(0 0 0 / 0.04))',
];

/**
 * A mask cuts away the ring and the shadow of the piece it shapes. The wrapper of a ticket draws
 * the outline instead: one hairline on every side, following each cut.
 */
export const TICKET_OUTLINE: CSSProperties = {
  filter: OUTLINE_SHADOWS.join(' '),
};

const PERFORATION =
  'color-mix(in oklab, var(--foreground) 22%, transparent) 0 4px, transparent 4px 8px';

const TEAR_ROW: CSSProperties = {
  backgroundImage: `repeating-linear-gradient(90deg, ${PERFORATION})`,
};

const TEAR_COLUMN: CSSProperties = {
  backgroundImage: `repeating-linear-gradient(180deg, ${PERFORATION})`,
};

type TearLineProps = {
  /** `row` runs across a ticket that tears into a top and a bottom, `column` down one that tears into a left and a right. */
  direction: 'row' | 'column';
  className?: string;
};

/** The perforation where two pieces of a ticket meet, drawn from one notch to the other. */
export function TearLine({ direction, className }: TearLineProps) {
  if (direction === 'column') {
    return (
      <span
        aria-hidden='true'
        style={TEAR_COLUMN}
        className={cn('block w-px', className)}
      />
    );
  }
  return (
    <span
      aria-hidden='true'
      style={TEAR_ROW}
      className={cn('block h-px', className)}
    />
  );
}
