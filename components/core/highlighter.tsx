'use client';
import { cn } from '@/lib/utils';
import {
  motion,
  useInView,
  useReducedMotion,
  type TargetAndTransition,
} from 'motion/react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

export type HighlighterAction =
  'highlight' | 'underline' | 'box' | 'circle' | 'strike';

export type HighlighterTone =
  'primary' | 'success' | 'warning' | 'info' | 'destructive';

type Point = {
  x: number;
  y: number;
};

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Random = () => number;

type Stroke = {
  key: string;
  path: string;
  width: number;
  delay: number;
  duration: number;
};

type StrokeShape = {
  path: string;
  width: number;
};

type DrawSlot = {
  start: number;
  length: number;
};

const MODULUS = 2147483647;

const LAST_STATE = MODULUS - 1;

const MULTIPLIER = 16807;

const EASE_PEN: [number, number, number, number] = [0.65, 0, 0.35, 1];

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** With two passes, the second starts while the first is still drawing, as a hand going over it again. */
const FIRST_PASS_SHARE = 0.7;

const SECOND_PASS_OFFSET = 0.3;

const ERASE_DURATION = 0.15;

const BAND_OPACITY = 0.35;

const BAND_THICKNESS = 0.8;

const BAND_CENTRE = 0.55;

const STRIKE_LINE = 0.52;

const CIRCLE_STEPS = 16;

const START_ANGLE = Math.PI * -0.62;

const FULL_TURN_AND_OVERLAP = Math.PI * 2.15;

const IN_VIEW_MARGIN = '0px 0px -10% 0px';

/** Marker fills behind the text: the fill tokens at a low opacity read in both themes. */
const BAND_TONES: Record<HighlighterTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  destructive: 'text-destructive',
};

/** Pen lines on the page: the text pairs of each status, measured for both themes. */
const LINE_TONES: Record<HighlighterTone, string> = {
  primary: 'text-primary',
  success: 'text-success-foreground',
  warning: 'text-warning-foreground',
  info: 'text-info-foreground',
  destructive: 'text-destructive-ink',
};

const DEFAULT_PADDING: Record<HighlighterAction, number> = {
  highlight: 2,
  underline: 2,
  box: 5,
  circle: 8,
  strike: 2,
};

const HIDDEN: TargetAndTransition = { pathLength: 0, opacity: 0 };

function seedOf(text: string) {
  let hash = 2166136261;
  for (const character of text) {
    const code = character.charCodeAt(0);
    hash ^= code;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** A seeded generator, so a mark keeps its shape when the text re-wraps. */
function randomOf(seed: number): Random {
  let state = seed % MODULUS;
  if (state <= 0) {
    state += LAST_STATE;
  }
  return () => {
    const product = state * MULTIPLIER;
    state = product % MODULUS;
    const offset = state - 1;
    return offset / LAST_STATE;
  };
}

function jitterOf(random: Random, amount: number) {
  const sample = random();
  const doubled = sample * 2;
  const centred = doubled - 1;
  return centred * amount;
}

function roundedOf(value: number) {
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  return rounded / 100;
}

function pointTextOf(point: Point) {
  const x = roundedOf(point.x);
  const y = roundedOf(point.y);
  return `${x} ${y}`;
}

function nudgedOf(point: Point, random: Random, amount: number): Point {
  const offsetX = jitterOf(random, amount);
  const offsetY = jitterOf(random, amount);
  return { x: point.x + offsetX, y: point.y + offsetY };
}

function horizontalStrokeOf(
  left: number,
  right: number,
  y: number,
  random: Random,
  wobble: number
) {
  const start = nudgedOf({ x: left, y }, random, wobble);
  const end = nudgedOf({ x: right, y }, random, wobble);
  const span = end.x - start.x;
  const third = span / 3;
  const firstX = start.x + third;
  const secondX = end.x - third;
  const firstLift = jitterOf(random, wobble);
  const secondLift = jitterOf(random, wobble);
  const firstY = y + firstLift;
  const secondY = y + secondLift;
  const startText = pointTextOf(start);
  const firstText = pointTextOf({ x: firstX, y: firstY });
  const secondText = pointTextOf({ x: secondX, y: secondY });
  const endText = pointTextOf(end);
  return `M ${startText} C ${firstText}, ${secondText}, ${endText}`;
}

function bowedSideOf(from: Point, to: Point, random: Random) {
  const sumX = from.x + to.x;
  const sumY = from.y + to.y;
  const middle = { x: sumX / 2, y: sumY / 2 };
  const control = nudgedOf(middle, random, 1.5);
  const controlText = pointTextOf(control);
  const endText = pointTextOf(to);
  return `Q ${controlText} ${endText}`;
}

function boxPathOf(box: Box, padding: number, random: Random) {
  const left = box.x - padding;
  const top = box.y - padding;
  const widthWithPadding = box.width + padding;
  const heightWithPadding = box.height + padding;
  const right = box.x + widthWithPadding;
  const bottom = box.y + heightWithPadding;
  const topLeft = nudgedOf({ x: left, y: top }, random, 1.5);
  const topRight = nudgedOf({ x: right, y: top }, random, 1.5);
  const bottomRight = nudgedOf({ x: right, y: bottom }, random, 1.5);
  const bottomLeft = nudgedOf({ x: left, y: bottom }, random, 1.5);
  const overshoot = top - 3;
  const closing = nudgedOf({ x: left, y: overshoot }, random, 1.5);
  const sides = [
    `M ${pointTextOf(topLeft)}`,
    bowedSideOf(topLeft, topRight, random),
    bowedSideOf(topRight, bottomRight, random),
    bowedSideOf(bottomRight, bottomLeft, random),
    bowedSideOf(bottomLeft, closing, random),
  ];
  return sides.join(' ');
}

function controlAfterOf(previous: Point, current: Point, next: Point): Point {
  const deltaX = next.x - previous.x;
  const deltaY = next.y - previous.y;
  const stepX = deltaX / 6;
  const stepY = deltaY / 6;
  return { x: current.x + stepX, y: current.y + stepY };
}

function controlBeforeOf(current: Point, next: Point, after: Point): Point {
  const deltaX = after.x - current.x;
  const deltaY = after.y - current.y;
  const stepX = deltaX / 6;
  const stepY = deltaY / 6;
  return { x: next.x - stepX, y: next.y - stepY };
}

/** A curve through every point (Catmull-Rom written as cubic Bézier segments). */
function smoothPathOf(points: readonly Point[]) {
  const segments = [`M ${pointTextOf(points[0])}`];
  const lastIndex = points.length - 1;
  for (let index = 0; index < lastIndex; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const after = points[index + 2] ?? next;
    const firstControl = controlAfterOf(previous, current, next);
    const secondControl = controlBeforeOf(current, next, after);
    const firstText = pointTextOf(firstControl);
    const secondText = pointTextOf(secondControl);
    const nextText = pointTextOf(next);
    segments.push(`C ${firstText}, ${secondText}, ${nextText}`);
  }
  return segments.join(' ');
}

/** A loop that starts at the upper left, goes once around and runs a little past its start, slightly wider. */
function circlePathOf(box: Box, padding: number, random: Random) {
  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  const middleX = box.x + halfWidth;
  const middleY = box.y + halfHeight;
  const centre = nudgedOf({ x: middleX, y: middleY }, random, 1);
  const widenedHalf = halfWidth * 1.08;
  const radiusX = widenedHalf + padding;
  const radiusY = halfHeight + padding;
  const startJitter = jitterOf(random, 0.15);
  const startAngle = START_ANGLE + startJitter;
  const sweepJitter = jitterOf(random, 0.1);
  const sweep = FULL_TURN_AND_OVERLAP + sweepJitter;
  const points: Point[] = [];
  for (let step = 0; step <= CIRCLE_STEPS; step += 1) {
    const progress = step / CIRCLE_STEPS;
    const turned = sweep * progress;
    const angle = startAngle + turned;
    const drift = progress * 0.07;
    const wobble = jitterOf(random, 0.035);
    const growth = drift + wobble;
    const scale = 1 + growth;
    const reachX = radiusX * scale;
    const reachY = radiusY * scale;
    const offsetX = Math.cos(angle) * reachX;
    const offsetY = Math.sin(angle) * reachY;
    const x = centre.x + offsetX;
    const y = centre.y + offsetY;
    points.push({ x, y });
  }
  return smoothPathOf(points);
}

function shapeOf(
  action: HighlighterAction,
  box: Box,
  padding: number,
  strokeWidth: number,
  random: Random
): StrokeShape {
  const left = box.x - padding;
  const rightEdge = box.x + box.width;
  const right = rightEdge + padding;
  if (action === 'highlight') {
    const centreOffset = box.height * BAND_CENTRE;
    const centre = box.y + centreOffset;
    const thickness = box.height * BAND_THICKNESS;
    const path = horizontalStrokeOf(left, right, centre, random, 1);
    return { path, width: thickness };
  }
  if (action === 'underline') {
    const bottom = box.y + box.height;
    const line = bottom + padding;
    const path = horizontalStrokeOf(left, right, line, random, 1.5);
    return { path, width: strokeWidth };
  }
  if (action === 'strike') {
    const lineOffset = box.height * STRIKE_LINE;
    const line = box.y + lineOffset;
    const path = horizontalStrokeOf(left, right, line, random, 1.2);
    return { path, width: strokeWidth };
  }
  if (action === 'box') {
    const path = boxPathOf(box, padding, random);
    return { path, width: strokeWidth };
  }
  const path = circlePathOf(box, padding, random);
  return { path, width: strokeWidth };
}

/** Wrapped lines are drawn one after the other, each for its share of the whole length. */
function slotsOf(boxes: readonly Box[], duration: number, delay: number) {
  let totalWidth = 0;
  for (const box of boxes) {
    totalWidth += box.width;
  }
  const slots: DrawSlot[] = [];
  let cursor = delay;
  for (const box of boxes) {
    const share = box.width / totalWidth;
    const length = duration * share;
    slots.push({ start: cursor, length });
    cursor += length;
  }
  return slots;
}

function passTimingOf(slot: DrawSlot, pass: number, passCount: number) {
  if (passCount === 1) {
    return { delay: slot.start, duration: slot.length };
  }
  const duration = slot.length * FIRST_PASS_SHARE;
  const offset = slot.length * SECOND_PASS_OFFSET;
  const passOffset = offset * pass;
  const delay = slot.start + passOffset;
  return { delay, duration };
}

function strokesOf(
  action: HighlighterAction,
  boxes: readonly Box[],
  options: {
    seed: number;
    padding: number;
    strokeWidth: number;
    passCount: number;
    duration: number;
    delay: number;
  }
) {
  const random = randomOf(options.seed);
  const slots = slotsOf(boxes, options.duration, options.delay);
  const strokes: Stroke[] = [];
  boxes.forEach((box, boxIndex) => {
    const slot = slots[boxIndex];
    for (let pass = 0; pass < options.passCount; pass += 1) {
      const shape = shapeOf(
        action,
        box,
        options.padding,
        options.strokeWidth,
        random
      );
      const timing = passTimingOf(slot, pass, options.passCount);
      strokes.push({
        key: `${boxIndex}-${pass}`,
        path: shape.path,
        width: shape.width,
        delay: timing.delay,
        duration: timing.duration,
      });
    }
  });
  return strokes;
}

function isInlineDisplay(element: Element) {
  const display = getComputedStyle(element).display;
  return display.startsWith('inline');
}

/** The first block around the text: its size changes whenever the text may wrap differently. */
function blockAncestorOf(element: HTMLElement) {
  let current = element.parentElement;
  while (current) {
    if (!isInlineDisplay(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return document.body;
}

function boxesOf(root: HTMLElement, svg: SVGSVGElement) {
  const origin = svg.getBoundingClientRect();
  const fragments = Array.from(root.getClientRects());
  const boxes: Box[] = [];
  for (const fragment of fragments) {
    const isEmpty = fragment.width < 1;
    if (isEmpty) {
      continue;
    }
    const x = fragment.left - origin.left;
    const y = fragment.top - origin.top;
    boxes.push({ x, y, width: fragment.width, height: fragment.height });
  }
  return boxes;
}

function isSameBox(first: Box, second: Box) {
  const isSameX = first.x === second.x;
  const isSameY = first.y === second.y;
  const isSameWidth = first.width === second.width;
  const isSameHeight = first.height === second.height;
  return isSameX && isSameY && isSameWidth && isSameHeight;
}

function haveSameBoxes(first: readonly Box[], second: readonly Box[]) {
  if (first.length !== second.length) {
    return false;
  }
  return first.every((box, index) => isSameBox(box, second[index]));
}

function keepIfSame(current: Box[], next: Box[]) {
  if (haveSameBoxes(current, next)) {
    return current;
  }
  return next;
}

/** One box per line the text runs over, in the coordinates of the drawing layer. */
function useLineBoxes(
  rootRef: RefObject<HTMLElement | null>,
  svgRef: RefObject<SVGSVGElement | null>
) {
  const [boxes, setBoxes] = useState<Box[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    if (!root) {
      return;
    }
    if (!svg) {
      return;
    }
    let isMounted = true;
    const measure = () => {
      const next = boxesOf(root, svg);
      setBoxes((current) => keepIfSame(current, next));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(blockAncestorOf(root));
    document.fonts.ready.then(() => {
      if (isMounted) {
        measure();
      }
    });
    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, [rootRef, svgRef]);

  return boxes;
}

function toneOf(action: HighlighterAction, tone: HighlighterTone | undefined) {
  if (tone) {
    return tone;
  }
  if (action === 'highlight') {
    return 'warning';
  }
  return 'primary';
}

function toneClassOf(action: HighlighterAction, tone: HighlighterTone) {
  if (action === 'highlight') {
    return BAND_TONES[tone];
  }
  return LINE_TONES[tone];
}

function passCountOf(action: HighlighterAction, passes: 1 | 2 | undefined) {
  if (passes) {
    return passes;
  }
  if (action === 'highlight') {
    return 1;
  }
  return 2;
}

function strokeOpacityOf(action: HighlighterAction) {
  if (action === 'highlight') {
    return BAND_OPACITY;
  }
  return 1;
}

function lineCapOf(action: HighlighterAction) {
  if (action === 'highlight') {
    return 'butt';
  }
  return 'round';
}

function drawnOf(stroke: Stroke): TargetAndTransition {
  return {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: stroke.duration,
        delay: stroke.delay,
        ease: EASE_PEN,
      },
      opacity: { duration: 0.01, delay: stroke.delay },
    },
  };
}

function shownWithoutDrawingOf(stroke: Stroke): TargetAndTransition {
  return {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0 },
      opacity: { duration: 0.2, delay: stroke.delay, ease: EASE_OUT_STRONG },
    },
  };
}

const ERASED: TargetAndTransition = {
  pathLength: 0,
  opacity: 0,
  transition: {
    opacity: { duration: ERASE_DURATION, ease: EASE_OUT_STRONG },
    pathLength: { duration: 0, delay: ERASE_DURATION },
  },
};

function targetOf(
  stroke: Stroke,
  isShown: boolean,
  shouldReduceMotion: boolean | null
) {
  if (!isShown) {
    return ERASED;
  }
  if (shouldReduceMotion) {
    return shownWithoutDrawingOf(stroke);
  }
  return drawnOf(stroke);
}

export type HighlighterProps = {
  children: ReactNode;
  action?: HighlighterAction;
  tone?: HighlighterTone;
  strokeWidth?: number;
  padding?: number;
  passes?: 1 | 2;
  duration?: number;
  delay?: number;
  show?: boolean;
  className?: string;
};

export function Highlighter({
  children,
  action = 'highlight',
  tone,
  strokeWidth = 2,
  padding,
  passes,
  duration = 0.8,
  delay = 0,
  show,
  className,
}: HighlighterProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const instanceId = useId();
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(rootRef, { once: true, margin: IN_VIEW_MARGIN });
  const boxes = useLineBoxes(rootRef, svgRef);
  const isShown = show ?? isInView;
  const isBehindText = action === 'highlight';
  const resolvedTone = toneOf(action, tone);
  const seed = seedOf(`${instanceId}-${action}`);
  const resolvedPadding = padding ?? DEFAULT_PADDING[action];
  const strokes = strokesOf(action, boxes, {
    seed,
    padding: resolvedPadding,
    strokeWidth,
    passCount: passCountOf(action, passes),
    duration,
    delay,
  });

  return (
    <span
      ref={rootRef}
      className={cn('relative', isBehindText && 'isolate', className)}
    >
      {children}
      <svg
        ref={svgRef}
        aria-hidden='true'
        fill='none'
        className={cn(
          'pointer-events-none absolute top-0 left-0 size-px overflow-visible',
          toneClassOf(action, resolvedTone),
          isBehindText && '-z-10'
        )}
      >
        {strokes.map((stroke) => (
          <motion.path
            key={stroke.key}
            d={stroke.path}
            stroke='currentColor'
            strokeWidth={stroke.width}
            strokeOpacity={strokeOpacityOf(action)}
            strokeLinecap={lineCapOf(action)}
            strokeLinejoin='round'
            initial={HIDDEN}
            animate={targetOf(stroke, isShown, shouldReduceMotion)}
          />
        ))}
      </svg>
    </span>
  );
}
