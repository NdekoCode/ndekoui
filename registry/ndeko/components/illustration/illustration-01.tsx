'use client';

import { useMemo, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { nearestAngleOf, percentOf, radiansOf } from './_parts/geometry';
import {
  CHATGPT,
  CLAUDE,
  DEEPSEEK,
  GEMINI,
  MISTRAL,
  type SceneModel,
} from './_parts/models';
import { useSceneFrames, type SceneFrame } from './_parts/use-scene-frames';
import { useScenePlay } from './_parts/use-scene-play';

type Link = {
  index: number;
  angle: number;
};

type TurnStyle = {
  animationDuration: string;
  animationPlayState: 'running' | 'paused';
  animationDirection: 'normal' | 'reverse';
};

const FULL_TURN_DEG = 360;

const TOP_OF_ORBIT_DEG = -90;

const DEFAULT_ORBIT_SECONDS = 48;

const DEFAULT_HAND_OVER_MS = 3200;

function slotAngleOf(index: number, count: number) {
  const step = FULL_TURN_DEG / count;
  return TOP_OF_ORBIT_DEG + step * index;
}

function slotPlaceOf(index: number, count: number) {
  const degrees = slotAngleOf(index, count);
  const angle = radiansOf(degrees);
  const across = 0.5 + Math.cos(angle) * 0.5;
  const down = 0.5 + Math.sin(angle) * 0.5;
  return { left: percentOf(across), top: percentOf(down) };
}

function playStateOf(isPlaying: boolean) {
  if (isPlaying) {
    return 'running';
  }
  return 'paused';
}

/** One frame per model, in orbit order. An orbit with no model still gets its resting frame. */
function handOversOf(count: number, holdMs: number) {
  const frameCount = Math.max(count, 1);
  const frames: SceneFrame<number>[] = [];
  for (let index = 0; index < frameCount; index += 1) {
    frames.push({ state: index, holdMs });
  }
  return frames;
}

function labelOf(agentName: string, models: SceneModel[], active: SceneModel) {
  const names = models.map((model) => model.name);
  const list = names.join(', ');
  return `${agentName} can hand a step to ${list}. It is using ${active.name}`;
}

export type ModelOrbitProps = {
  /** The agent at the centre. Its picture is drawn from this name. */
  agentName: string;
  models: SceneModel[];
  /** Milliseconds the agent stays on one model before it hands over to the next. */
  handOverMs?: number;
  /** Seconds for one turn of the orbit. */
  orbitSeconds?: number;
  className?: string;
};

export function ModelOrbit({
  agentName,
  models,
  handOverMs = DEFAULT_HAND_OVER_MS,
  orbitSeconds = DEFAULT_ORBIT_SECONDS,
  className,
}: ModelOrbitProps) {
  const { ref, isPlaying, isStill } = useScenePlay();
  const count = models.length;
  const handOvers = useMemo(
    () => handOversOf(count, handOverMs),
    [count, handOverMs]
  );
  const activeIndex = useSceneFrames(handOvers, { isPlaying, isStill });
  const [link, setLink] = useState<Link>({
    index: 0,
    angle: TOP_OF_ORBIT_DEG,
  });
  const active = models[activeIndex];

  const hasHandedOver = link.index !== activeIndex;
  if (hasHandedOver) {
    const slotCount = Math.max(count, 1);
    const target = slotAngleOf(activeIndex, slotCount);
    const angle = nearestAngleOf(target, link.angle);
    setLink({ index: activeIndex, angle });
  }

  if (!active) {
    return null;
  }

  const names = models.map((model) => model.name);
  const turn: TurnStyle = {
    animationDuration: `${orbitSeconds}s`,
    animationPlayState: playStateOf(isPlaying),
    animationDirection: 'normal',
  };
  const counterTurn: TurnStyle = { ...turn, animationDirection: 'reverse' };

  return (
    <div
      ref={ref}
      role='img'
      aria-label={labelOf(agentName, models, active)}
      className={cn('relative aspect-square w-full max-w-[20rem]', className)}
    >
      <div
        style={turn}
        className='hairline-ring ring-border absolute inset-[12%] animate-spin rounded-full motion-reduce:animate-none'
      >
        <span
          style={{ transform: `rotate(${link.angle}deg)` }}
          className='from-primary/0 to-primary absolute top-1/2 left-1/2 -mt-px h-0.5 w-1/2 origin-left rounded-full bg-linear-to-r transition-transform duration-700 ease-(--ease-in-out-strong)'
        />
        {models.map((model, index) => (
          <span
            key={model.id}
            style={slotPlaceOf(index, count)}
            className='absolute -translate-x-1/2 -translate-y-1/2'
          >
            <span
              style={counterTurn}
              className='relative block animate-spin motion-reduce:animate-none'
            >
              <span
                data-active={index === activeIndex}
                className='ring-primary absolute -inset-1 rounded-[14px] opacity-0 ring-[1.5px] transition-opacity duration-300 ease-(--ease-out-strong) data-[active=true]:opacity-100'
              />
              <BrandTile brand={model.brand} size='2xl' />
            </span>
          </span>
        ))}
      </div>
      <MeshTile
        seed={agentName}
        color='var(--primary)'
        className='absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-[14px]'
      />
      <p className='bg-card hairline-ring ring-border absolute top-1/2 left-1/2 mt-9 flex h-6 -translate-x-1/2 items-center gap-1 rounded-full px-2.5 text-xs whitespace-nowrap shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <span className='text-muted-foreground'>via</span>
        <WordRoll text={active.name} labels={names} className='font-medium' />
      </p>
    </div>
  );
}

const MODELS: SceneModel[] = [CLAUDE, CHATGPT, GEMINI, MISTRAL, DEEPSEEK];

export default function Illustration01() {
  return <ModelOrbit agentName='Planner' models={MODELS} />;
}
