'use client';

import { memo, useEffect, useMemo, useState } from 'react';

import {
  Globe,
  type GlobeArc,
  type GlobeLocation,
  type GlobeMarker,
} from '@/components/core/globe';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { regionOf, type RegionId } from './data';
import { drawnShareOf, pointAlong } from './geo';
import {
  facingKeyOf,
  facingLocationOf,
  handoffKeyOf,
  regionsInViewOf,
  type Facing,
  type Handoff,
} from './session';

/** The globe has come most of the way to a new view this long after it starts to turn. */
const TURN_LEAD_MS = 600;

/** An arc draws itself in a few steps, one render each, while the globe settles: never one render a frame. */
const DRAW_STEPS = 6;

const STEP_MS = 50;

const PICKED_MARKER = 0.075;

const REGION_MARKER = 0.05;

/** Close to the latitude of the views, so the globe barely tilts when it first faces one. */
const STARTING_TILT = 30;

const NO_ARCS: GlobeArc[] = [];

type Settled = {
  key: string;
  location: GlobeLocation;
};

/**
 * The globe starts on the meridian ninety degrees west, tilted as asked, and still has to turn to
 * its first view: even the first arc waits for it.
 */
const STARTING_VIEW: Settled = { key: '', location: [STARTING_TILT, -90] };

type Drawing = {
  id: number | null;
  step: number;
};

function markerSizeOf(isPicked: boolean) {
  if (isPicked) {
    return PICKED_MARKER;
  }
  return REGION_MARKER;
}

/** Only the regions near the centre of the view the globe leaves and of the one it turns to. */
function markersOf(
  selectedId: RegionId,
  target: GlobeLocation,
  previous: GlobeLocation
): GlobeMarker[] {
  const regions = regionsInViewOf(target, previous);
  return regions.map((region) => {
    const isPicked = region.id === selectedId;
    return {
      location: region.location,
      size: markerSizeOf(isPicked),
      label: `${region.name}, ${region.place}`,
    };
  });
}

function arcOf(handoff: Handoff, drawing: Drawing): GlobeArc | null {
  const from = regionOf(handoff.from).location;
  const to = regionOf(handoff.to).location;
  const isDrawing = handoff.id === drawing.id;
  const isWhole = !isDrawing || drawing.step >= DRAW_STEPS;
  if (isWhole) {
    return { from, to };
  }
  if (drawing.step === 0) {
    return null;
  }
  const progress = drawing.step / DRAW_STEPS;
  const share = drawnShareOf(progress);
  const end = pointAlong(from, to, share);
  return { from, to: end };
}

/** The arc of the last hand-off, only while the globe faces its route: from elsewhere it would cross the rim. */
function arcsOf(handoff: Handoff, drawing: Drawing, isFramed: boolean) {
  if (!isFramed) {
    return NO_ARCS;
  }
  const arc = arcOf(handoff, drawing);
  if (!arc) {
    return NO_ARCS;
  }
  return [arc];
}

function grown(drawing: Drawing): Drawing {
  const next = drawing.step + 1;
  const step = Math.min(next, DRAW_STEPS);
  return { id: drawing.id, step };
}

/** Under reduced motion an arc is whole as soon as its hand-off happens. */
function firstStepOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return DRAW_STEPS;
  }
  return 0;
}

/** A globe a person turned by hand stays where they left it until a region is picked again. */
function focusOf(isHeld: boolean, target: GlobeLocation) {
  if (isHeld) {
    return target;
  }
  return null;
}

export type GlobeStageProps = {
  selectedId: RegionId;
  handoff: Handoff;
  drawingId: number | null;
  facing: Facing;
  /** False once a person turned the globe by hand. */
  isHeld: boolean;
  /** Nothing turns or draws while the block is off screen or the tab is hidden. */
  isActive: boolean;
  label: string;
};

/**
 * The globe draws frames only while it turns, and an arc draws itself in a few renders once the
 * globe has nearly arrived. Between two beats nothing here renders, and the globe stays still.
 */
export const GlobeStage = memo(function GlobeStage({
  selectedId,
  handoff,
  drawingId,
  facing,
  isHeld,
  isActive,
  label,
}: GlobeStageProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const facingKey = facingKeyOf(facing);
  const target = useMemo(() => facingLocationOf(facing), [facing]);
  const [settled, setSettled] = useState<Settled>(STARTING_VIEW);
  const [drawing, setDrawing] = useState<Drawing>({
    id: drawingId,
    step: DRAW_STEPS,
  });
  const isNewDrawing = drawing.id !== drawingId;
  if (isNewDrawing) {
    setDrawing({ id: drawingId, step: firstStepOf(shouldReduceMotion) });
  }
  const isTurning = settled.key !== facingKey;
  const arrivesAtOnce = isTurning && shouldReduceMotion;
  if (arrivesAtOnce) {
    setSettled({ key: facingKey, location: target });
  }
  const routeKey = handoffKeyOf(handoff);
  const facesRoute = facingKey === routeKey;
  const hasArrived = settled.key === routeKey;
  const isFramed = isHeld && facesRoute && hasArrived;
  const hasDrawing = drawing.id !== null;
  const isUnfinished = hasDrawing && drawing.step < DRAW_STEPS;
  const canDraw = isActive && isFramed;
  const isGrowing = canDraw && isUnfinished;

  useEffect(() => {
    if (!isTurning || !isActive) {
      return;
    }
    const arrival: Settled = { key: facingKey, location: target };
    const timer = setTimeout(() => setSettled(arrival), TURN_LEAD_MS);
    return () => clearTimeout(timer);
  }, [isTurning, isActive, facingKey, target]);

  useEffect(() => {
    if (!isGrowing) {
      return;
    }
    const timer = setTimeout(() => setDrawing(grown), STEP_MS);
    return () => clearTimeout(timer);
  }, [isGrowing, drawing.step]);

  const markers = useMemo(
    () => markersOf(selectedId, target, settled.location),
    [selectedId, target, settled.location]
  );
  const arcs = useMemo(
    () => arcsOf(handoff, drawing, isFramed),
    [handoff, drawing, isFramed]
  );
  const focus = useMemo(() => focusOf(isHeld, target), [isHeld, target]);

  return (
    <Globe
      markers={markers}
      arcs={arcs}
      focus={focus}
      autoRotate={false}
      tilt={STARTING_TILT}
      label={label}
    />
  );
});
