'use client';

import { useMemo, useState } from 'react';

import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { PauseIcon, PlayIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import {
  degreesOf,
  nearestAngleOf,
  placeOf,
  rounded,
  spanBetween,
  type ScenePoint,
} from './_parts/geometry';
import { useSceneAnimations } from './_parts/use-scene-animations';
import { useScenePlay } from './_parts/use-scene-play';

export type BeamFlow = 'in' | 'out';

export type BeamTool = {
  id: string;
  name: string;
  brand: BrandSlug;
  /** `in` sends data to the product, `out` receives data from it. */
  flow: BeamFlow;
};

type LightShape = 'along' | 'clockwise' | 'counterclockwise';

type Light = {
  /** Where the transform of the light starts from: the centre of its arc, or the start of its line. */
  origin: ScenePoint;
  from: string;
  to: string;
  rest: string;
  shape: LightShape;
};

type Beam = {
  tool: BeamTool;
  point: ScenePoint;
  /** The beam as a path of the stage drawing, 300 by 200. */
  path: string;
  light: Light;
};

const STAGE_ASPECT = 3 / 2;

const VIEW_WIDTH = 300;

const VIEW_HEIGHT = 200;

const VIEW_BOX = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;

const HUB: ScenePoint = { x: 0.5, y: 0.5 };

const SOURCE_COLUMN = 0.1;

const TARGET_COLUMN = 0.9;

/** A tool nearly level with the product gets a straight beam: the arc through both would be almost flat. */
const LEVEL_WITHIN = 0.02;

const FLOW_MS = 2600;

const FLOW_STAGGER_MS = 430;

const LIGHT_CLASS: Record<LightShape, string> = {
  along: 'h-0.5 w-5 bg-linear-to-r',
  clockwise: 'h-5 w-0.5 bg-linear-to-b',
  counterclockwise: 'h-5 w-0.5 bg-linear-to-t',
};

function rowOf(index: number, count: number) {
  return (index + 0.5) / count;
}

function viewPointOf(point: ScenePoint) {
  const x = rounded(point.x * VIEW_WIDTH);
  const y = rounded(point.y * VIEW_HEIGHT);
  return `${x} ${y}`;
}

function endsOf(tool: BeamTool, point: ScenePoint) {
  if (tool.flow === 'in') {
    return { source: point, target: HUB };
  }
  return { source: HUB, target: point };
}

/** A straight beam: the light slides from the source to the target. Lengths are in hundredths of the stage width. */
function lineLightOf(source: ScenePoint, target: ScenePoint): Light {
  const span = spanBetween(source, target, STAGE_ASPECT);
  const half = rounded(span.lengthPercent / 2);
  const turned = `rotate(${span.angleDeg}deg)`;
  return {
    origin: source,
    from: `${turned} translateX(0cqw)`,
    to: `${turned} translateX(${span.lengthPercent}cqw)`,
    rest: `${turned} translateX(${half}cqw)`,
    shape: 'along',
  };
}

function shapeOfTurn(fromDeg: number, toDeg: number): LightShape {
  if (toDeg > fromDeg) {
    return 'clockwise';
  }
  return 'counterclockwise';
}

function sweepOf(fromDeg: number, toDeg: number) {
  if (toDeg > fromDeg) {
    return 1;
  }
  return 0;
}

/**
 * A curved beam is an arc of the circle that passes through the tool and touches the level line of
 * the product, so every beam runs into the product from its side. The light is turned around the
 * centre of that circle, which moves it along the arc with a transform alone.
 */
function arcBeamOf(tool: BeamTool, point: ScenePoint): Beam {
  const across = point.x - HUB.x;
  const down = (point.y - HUB.y) / STAGE_ASPECT;
  const side = Math.sign(down);
  const reach = across * across + down * down;
  const radius = reach / (2 * Math.abs(down));
  const hubDown = HUB.y / STAGE_ASPECT;
  const centreDown = hubDown + radius * side;
  const centre: ScenePoint = { x: HUB.x, y: centreDown * STAGE_ASPECT };
  const hubDeg = -90 * side;
  const toolAngle = Math.atan2(down - radius * side, across);
  const rawToolDeg = degreesOf(toolAngle);
  const toolDeg = nearestAngleOf(rawToolDeg, hubDeg);
  const radiusInHundredths = rounded(radius * 100);
  const out = `translateX(${radiusInHundredths}cqw)`;
  const viewRadius = rounded(radius * VIEW_WIDTH);
  const sweep = sweepOf(toolDeg, hubDeg);
  const start = viewPointOf(point);
  const end = viewPointOf(HUB);
  const path = `M ${start} A ${viewRadius} ${viewRadius} 0 0 ${sweep} ${end}`;
  let fromDeg = rounded(toolDeg);
  let toDeg = rounded(hubDeg);
  if (tool.flow === 'out') {
    fromDeg = rounded(hubDeg);
    toDeg = rounded(toolDeg);
  }
  const restDeg = rounded((fromDeg + toDeg) / 2);
  return {
    tool,
    point,
    path,
    light: {
      origin: centre,
      from: `rotate(${fromDeg}deg) ${out}`,
      to: `rotate(${toDeg}deg) ${out}`,
      rest: `rotate(${restDeg}deg) ${out}`,
      shape: shapeOfTurn(fromDeg, toDeg),
    },
  };
}

function lineBeamOf(tool: BeamTool, point: ScenePoint): Beam {
  const ends = endsOf(tool, point);
  const start = viewPointOf(point);
  const end = viewPointOf(HUB);
  const path = `M ${start} L ${end}`;
  return { tool, point, path, light: lineLightOf(ends.source, ends.target) };
}

function beamOf(tool: BeamTool, point: ScenePoint) {
  const down = (point.y - HUB.y) / STAGE_ASPECT;
  const isLevel = Math.abs(down) < LEVEL_WITHIN;
  if (isLevel) {
    return lineBeamOf(tool, point);
  }
  return arcBeamOf(tool, point);
}

/** Tools that send stand in a column on the left, tools that receive on the right. */
function beamsOf(tools: BeamTool[]) {
  const sources = tools.filter((tool) => tool.flow === 'in');
  const targets = tools.filter((tool) => tool.flow === 'out');
  const sourceBeams = sources.map((tool, index) => {
    const point = { x: SOURCE_COLUMN, y: rowOf(index, sources.length) };
    return beamOf(tool, point);
  });
  const targetBeams = targets.map((tool, index) => {
    const point = { x: TARGET_COLUMN, y: rowOf(index, targets.length) };
    return beamOf(tool, point);
  });
  return [...sourceBeams, ...targetBeams];
}

/** A light leaves from under its source and fades as it reaches its target. Each one starts part of the way, so they never leave together. */
function animateLights(stage: HTMLElement, beams: Beam[]) {
  const lights = stage.querySelectorAll<HTMLElement>('[data-beam-light]');
  const animations: Animation[] = [];
  lights.forEach((element, index) => {
    const beam = beams[index];
    if (!beam) {
      return;
    }
    const keyframes: Keyframe[] = [
      { offset: 0, transform: beam.light.from, opacity: 0 },
      { offset: 0.15, opacity: 1 },
      { offset: 0.8, opacity: 1 },
      { offset: 1, transform: beam.light.to, opacity: 0 },
    ];
    const stagger = index * FLOW_STAGGER_MS;
    const lead = stagger % FLOW_MS;
    const timing = { duration: FLOW_MS, iterations: Infinity, delay: -lead };
    animations.push(element.animate(keyframes, timing));
  });
  return animations;
}

function structureKeyOf(beams: Beam[]) {
  const ids = beams.map((beam) => `${beam.tool.id}:${beam.tool.flow}`);
  return ids.join('|');
}

function toolLabelOf(tool: BeamTool, productName: string) {
  const flowWord = flowWordOf(tool.flow, productName);
  return `${tool.name}, ${flowWord}`;
}

function isDimmed(focusedId: string | null, toolId: string) {
  if (focusedId === null) {
    return false;
  }
  return focusedId !== toolId;
}

function toggledPin(pinnedId: string | null, toolId: string) {
  if (pinnedId === toolId) {
    return null;
  }
  return toolId;
}

function flowWordOf(flow: BeamFlow, productName: string) {
  if (flow === 'in') {
    return `sends data to ${productName}`;
  }
  return `receives data from ${productName}`;
}

function pauseWordOf(isPaused: boolean) {
  if (isPaused) {
    return 'The flow is paused';
  }
  return 'The flow runs again';
}

function pauseLabelOf(isPaused: boolean) {
  if (isPaused) {
    return 'Resume flow';
  }
  return 'Pause flow';
}

function pauseKeyOf(isPaused: boolean) {
  if (isPaused) {
    return 'resume';
  }
  return 'pause';
}

function isMouse(event: React.PointerEvent) {
  return event.pointerType === 'mouse';
}

function isKeyboardFocus(event: React.FocusEvent) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }
  return target.matches(':focus-visible');
}

export type ToolBeamProps = {
  /** Your product, in the middle. Its mark is drawn from this name. */
  productName: string;
  tools: BeamTool[];
  className?: string;
};

export function ToolBeam({ productName, tools, className }: ToolBeamProps) {
  const { ref, isPlaying, isStill } = useScenePlay();
  const [isPaused, setIsPaused] = useState(false);
  const [pointedId, setPointedId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const beams = useMemo(() => beamsOf(tools), [tools]);
  const focusedId = pointedId ?? pinnedId;
  const isFlowing = isPlaying && !isPaused;

  useSceneAnimations(
    ref,
    isFlowing,
    (stage) => animateLights(stage, beams),
    structureKeyOf(beams)
  );

  function togglePause() {
    if (isStill) {
      return;
    }
    const next = !isPaused;
    setIsPaused(next);
    setAnnouncement(pauseWordOf(next));
  }

  // A tap also gives the focus on some phones: only a focus from the keyboard counts as pointing at a tool.
  function pointWithKeyboard(event: React.FocusEvent, toolId: string) {
    if (isKeyboardFocus(event)) {
      setPointedId(toolId);
    }
  }

  function pointWithMouse(event: React.PointerEvent, toolId: string | null) {
    if (isMouse(event)) {
      setPointedId(toolId);
    }
  }

  function togglePin(event: React.MouseEvent, toolId: string) {
    event.stopPropagation();
    setPinnedId((current) => toggledPin(current, toolId));
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full max-w-[28rem] flex-col items-center gap-3',
        className
      )}
    >
      <div
        role='group'
        aria-label={`${productName} between the tools it connects`}
        onClick={togglePause}
        className='@container relative aspect-[3/2] w-full overflow-hidden'
      >
        <svg
          aria-hidden='true'
          viewBox={VIEW_BOX}
          fill='none'
          className='absolute inset-0 size-full'
        >
          {beams.map((beam) => (
            <path
              key={beam.tool.id}
              d={beam.path}
              data-dimmed={isDimmed(focusedId, beam.tool.id)}
              vectorEffect='non-scaling-stroke'
              strokeWidth={1.5}
              strokeLinecap='round'
              className='stroke-foreground/12 transition-opacity duration-200 ease-(--ease-out-strong) data-[dimmed=true]:opacity-30'
            />
          ))}
        </svg>
        {beams.map((beam) => (
          <span
            key={beam.tool.id}
            aria-hidden='true'
            data-dimmed={isDimmed(focusedId, beam.tool.id)}
            className='pointer-events-none absolute inset-0 transition-opacity duration-200 ease-(--ease-out-strong) data-[dimmed=true]:opacity-15'
          >
            <span
              data-beam-light=''
              style={{
                ...placeOf(beam.light.origin),
                transform: beam.light.rest,
              }}
              className={cn(
                'from-primary/0 to-primary absolute -translate-x-1/2 -translate-y-1/2 rounded-full',
                LIGHT_CLASS[beam.light.shape]
              )}
            />
          </span>
        ))}
        <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
          <CompanyMark
            seed={productName}
            title={productName}
            className='size-12 rounded-[14px]'
          />
        </span>
        <ul aria-label='Tools'>
          {beams.map((beam) => (
            <li key={beam.tool.id}>
              <button
                type='button'
                aria-pressed={pinnedId === beam.tool.id}
                aria-label={toolLabelOf(beam.tool, productName)}
                data-dimmed={isDimmed(focusedId, beam.tool.id)}
                style={placeOf(beam.point)}
                onClick={(event) => togglePin(event, beam.tool.id)}
                onPointerEnter={(event) => pointWithMouse(event, beam.tool.id)}
                onPointerLeave={(event) => pointWithMouse(event, null)}
                onFocus={(event) => pointWithKeyboard(event, beam.tool.id)}
                onBlur={() => setPointedId(null)}
                className='focus-visible:ring-ring focus-visible:ring-offset-background absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-lg transition-[opacity,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97] data-[dimmed=true]:opacity-50'
              >
                <BrandTile brand={beam.tool.brand} size='xl' />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className='flex h-7 items-center'>
        {!isStill && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={togglePause}
          >
            <AnimatedSize
              as='span'
              axis='width'
              contentClassName='flex items-center'
            >
              <Swap swapKey={pauseKeyOf(isPaused)}>
                <span className='flex items-center gap-1.5'>
                  {isPaused && <PlayIcon />}
                  {!isPaused && <PauseIcon />}
                  {pauseLabelOf(isPaused)}
                </span>
              </Swap>
            </AnimatedSize>
          </Button>
        )}
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}

const TOOLS: BeamTool[] = [
  { id: 'stripe', name: 'Stripe', brand: 'stripe', flow: 'in' },
  { id: 'shopify', name: 'Shopify', brand: 'shopify', flow: 'in' },
  { id: 'hubspot', name: 'HubSpot', brand: 'hubspot', flow: 'in' },
  { id: 'notion', name: 'Notion', brand: 'notion', flow: 'out' },
  { id: 'linear', name: 'Linear', brand: 'linear', flow: 'out' },
  { id: 'gmail', name: 'Gmail', brand: 'gmail', flow: 'out' },
];

export default function Illustration07() {
  return <ToolBeam productName='Meridian' tools={TOOLS} />;
}
