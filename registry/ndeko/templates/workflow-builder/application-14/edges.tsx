'use client';

import { motion, type Transition } from 'motion/react';
import { memo, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import { lengthOf, type FlowEdge, type FlowLayout, type Point } from './layout';
import { TRAVEL_MS, type Run } from './run';

type EdgeTone = 'idle' | 'taken' | 'leftOut';

const TONE_CLASS: Record<EdgeTone, string> = {
  idle: 'opacity-100',
  taken: 'opacity-100',
  leftOut: 'opacity-35',
};

/** The stroke shows from its first point to its last, once: the path is one dash that slides into place. */
const DRAWN =
  '[stroke-dasharray:1] [stroke-dashoffset:0] transition-[stroke-dashoffset] ease-linear starting:[stroke-dashoffset:1]';

/** The colour of the run fills an edge in the time the dot takes to go along it. */
const FILL_STYLE = { transitionDuration: `${TRAVEL_MS}ms` };

/** An edge whose route changed comes back in place with a fade, while the steps travel to their new places. */
const REDRAWN = 'transition-opacity delay-150 duration-300 starting:opacity-0';

const LABEL_TONE: Record<EdgeTone, string> = {
  idle: 'bg-background text-muted-foreground ring-border',
  taken:
    'bg-[color-mix(in_oklab,var(--primary)_10%,var(--background))] text-primary-ink ring-primary/40',
  leftOut: 'bg-background text-muted-foreground ring-border opacity-50',
};

/** An edge is left out when the run never came to it: its step was skipped, or its branch took another output. */
function isLeftOut(run: Run, edge: FlowEdge) {
  const fromStatus = run.steps[edge.fromId]?.status;
  const wasStopped = fromStatus === 'skipped' || fromStatus === 'denied';
  if (wasStopped) {
    return true;
  }
  const choice = run.choices[edge.fromId];
  const isOutput = edge.outputId !== null;
  const hasChosen = choice !== undefined;
  const tookAnother = choice !== edge.outputId;
  return isOutput && hasChosen && tookAnother;
}

function toneOf(run: Run, edge: FlowEdge): EdgeTone {
  if (run.taken.includes(edge.id)) {
    return 'taken';
  }
  if (isLeftOut(run, edge)) {
    return 'leftOut';
  }
  return 'idle';
}

function entranceOf(isNew: boolean, isRedrawn: boolean) {
  if (isNew) {
    return cn(DRAWN, 'duration-500');
  }
  if (isRedrawn) {
    return REDRAWN;
  }
  return undefined;
}

/** Only the run fills an edge. An edge an edit draws again while it is taken shows its colour with the redraw. */
function fillEntranceOf(isFillInherited: boolean) {
  if (isFillInherited) {
    return REDRAWN;
  }
  return DRAWN;
}

type EdgePathProps = {
  edge: FlowEdge;
  tone: EdgeTone;
  isNew: boolean;
  isRedrawn: boolean;
};

/** Drawn again only when its own tone or route changes: a beat of the run touches one or two edges. */
const EdgePath = memo(function EdgePath({
  edge,
  tone,
  isNew,
  isRedrawn,
}: EdgePathProps) {
  const isTaken = tone === 'taken';
  const [isFillInherited, setIsFillInherited] = useState(isTaken);
  const hasLostFill = isFillInherited && !isTaken;
  if (hasLostFill) {
    setIsFillInherited(false);
  }

  return (
    <g
      className={cn('transition-opacity duration-300', TONE_CLASS[tone])}
      fill='none'
    >
      <path
        d={edge.path}
        pathLength={1}
        strokeWidth={1.5}
        className={cn('stroke-foreground/25', entranceOf(isNew, isRedrawn))}
      />
      {isTaken && (
        <path
          d={edge.path}
          pathLength={1}
          strokeWidth={2}
          style={FILL_STYLE}
          className={cn('stroke-primary', fillEntranceOf(isFillInherited))}
        />
      )}
    </g>
  );
});

type EdgeLabelProps = {
  label: string;
  at: Point;
  tone: EdgeTone;
};

/** An output whose name was erased still has to read as an output. */
function shownLabelOf(label: string) {
  if (label.trim() === '') {
    return 'Unnamed';
  }
  return label;
}

/** The label hangs from a point without size, so centring it never widens the plane. */
const EdgeLabel = memo(function EdgeLabel({ label, at, tone }: EdgeLabelProps) {
  const anchorStyle = { translate: `${at.x}px ${at.y}px` };

  return (
    <span
      className='absolute top-0 left-0 size-0 transition-[translate] duration-300 ease-(--ease-out-strong)'
      style={anchorStyle}
    >
      <span
        className={cn(
          'hairline-ring absolute top-0 left-0 flex h-[18px] max-w-44 -translate-x-1/2 -translate-y-1/2 items-center rounded-md px-1.5 text-[11px] font-medium whitespace-nowrap transition-[color,background-color,opacity] duration-300',
          LABEL_TONE[tone]
        )}
      >
        <span className='truncate'>{shownLabelOf(label)}</span>
      </span>
    </span>
  );
});

/** The share of the way reached at each corner of an edge, so the dot keeps one speed along all of it. */
function sharesOf(points: Point[]) {
  const total = lengthOf(points);
  const shares = [0];
  let travelled = 0;
  for (let index = 1; index < points.length; index += 1) {
    const side = [points[index - 1], points[index]];
    travelled += lengthOf(side);
    const share = travelled / total;
    shares.push(share);
  }
  return shares;
}

const DOT_FADE = [0, 1, 1, 0];

const DOT_FADE_TIMES = [0, 0.12, 0.85, 1];

const TRAVEL_SECONDS = TRAVEL_MS / 1000;

type DotRoute = {
  first: Point;
  xs: number[];
  ys: number[];
  times: number[];
};

function routeOf(edge: FlowEdge): DotRoute {
  return {
    first: edge.points[0],
    xs: edge.points.map((point) => point.x),
    ys: edge.points.map((point) => point.y),
    times: sharesOf(edge.points),
  };
}

/**
 * One dot goes along the edge the run just took, once. It moves with a transform and leaves no loop
 * behind. It keeps the route of that moment: an edit that moves the edge later does not send it again.
 */
function TravelDot({ edge }: { edge: FlowEdge }) {
  const [route] = useState(() => routeOf(edge));
  const { first, xs, ys, times } = route;
  const glide: Transition = {
    duration: TRAVEL_SECONDS,
    ease: 'linear',
    times,
  };
  const fade: Transition = {
    duration: TRAVEL_SECONDS,
    times: DOT_FADE_TIMES,
  };

  return (
    <motion.span
      aria-hidden='true'
      initial={{ x: first.x, y: first.y, opacity: 0 }}
      animate={{ x: xs, y: ys, opacity: DOT_FADE }}
      transition={{ x: glide, y: glide, opacity: fade }}
      className='bg-primary pointer-events-none absolute top-0 left-0 -mt-1 -ml-1 size-2 rounded-full'
    />
  );
}

function touches(edge: FlowEdge, stepId: string | null) {
  if (stepId === null) {
    return false;
  }
  return edge.fromId === stepId || edge.toId === stepId;
}

function canTravel(edge: FlowEdge | undefined): edge is FlowEdge {
  if (!edge) {
    return false;
  }
  return lengthOf(edge.points) > 0;
}

type EdgeLayerProps = {
  layout: FlowLayout;
  run: Run;
  /** The text on the edge of each output of a branch, by the id of that edge. */
  labels: Partial<Record<string, string>>;
  /** The step that was just added: the edges that touch it draw themselves. */
  arrivedId: string | null;
  /** True once the flow was edited. Before that, edges are simply there: nothing plays when the page loads. */
  hasEdits: boolean;
};

export const EdgeLayer = memo(function EdgeLayer({
  layout,
  run,
  labels,
  arrivedId,
  hasEdits,
}: EdgeLayerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const lastTakenId = run.taken.at(-1);
  const lastTaken = layout.edges.find((edge) => edge.id === lastTakenId);
  const showsDot = canTravel(lastTaken) && !shouldReduceMotion;

  return (
    <>
      <svg
        aria-hidden='true'
        width={layout.width}
        height={layout.height}
        className='pointer-events-none absolute top-0 left-0 overflow-visible'
      >
        {layout.edges.map((edge) => (
          <EdgePath
            key={`${edge.id} ${edge.path}`}
            edge={edge}
            tone={toneOf(run, edge)}
            isNew={touches(edge, arrivedId)}
            isRedrawn={hasEdits}
          />
        ))}
      </svg>
      {layout.edges.map((edge) => {
        const label = labels[edge.id];
        if (label === undefined || edge.labelAt === null) {
          return null;
        }
        return (
          <EdgeLabel
            key={edge.id}
            label={label}
            at={edge.labelAt}
            tone={toneOf(run, edge)}
          />
        );
      })}
      {showsDot && lastTaken && (
        <TravelDot key={`${run.token} ${run.taken.length}`} edge={lastTaken} />
      )}
    </>
  );
});
