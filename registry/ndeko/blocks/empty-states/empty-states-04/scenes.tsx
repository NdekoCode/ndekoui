'use client';

import { useRef } from 'react';

import {
  CheckIcon,
  InboxIcon,
  PlayIcon,
  PlusIcon,
} from '@/registry/ndeko/lib/icons';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import type { SceneId } from './data';
import { useSceneLoops, type SceneLoop } from './use-scene-loops';

/** An empty slot that invites an addition is the only dashed hairline of the system. */
const SLOT = 'hairline-border border-dashed border-foreground/20';

const RUN_BAR_WIDTHS = ['w-3/5', 'w-2/5', 'w-1/3'];

const AGENT_SLOTS = [0, 1, 2];

const TOOL_SLOTS = [0, 1, 2, 3];

const RISE_OFFSETS = ['start-[28%]', 'start-1/2', 'start-[72%]'];

function RunsArt() {
  return (
    <div className='flex h-full w-full flex-col justify-center gap-2.5'>
      {RUN_BAR_WIDTHS.map((width, index) => (
        <div
          key={width}
          data-loop='row'
          className={`${SLOT} flex h-10 items-center gap-3 rounded-lg px-3`}
        >
          <span className={`${SLOT} size-4 shrink-0 rounded-full`} />
          <span className={`bg-foreground/10 h-1.5 rounded-full ${width}`} />
          {index === 0 && (
            <span className='keycap-3d text-muted-foreground ms-auto flex size-6 shrink-0 items-center justify-center rounded-md'>
              <PlayIcon className='size-3' />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function InboxArt() {
  return (
    <div className='relative flex h-full w-full items-center justify-center'>
      {RISE_OFFSETS.map((offset) => (
        <span
          key={offset}
          data-loop='rise'
          className={`chip-3d absolute bottom-[58%] -translate-x-1/2 opacity-0 [--chip:var(--success)] ${offset} flex size-[18px] items-center justify-center rounded-full`}
        >
          <CheckIcon className='size-3' />
        </span>
      ))}
      <span className='keycap-3d text-muted-foreground flex size-16 items-center justify-center rounded-2xl'>
        <InboxIcon className='size-7' />
      </span>
    </div>
  );
}

function ToolsArt() {
  return (
    <div className='flex h-full w-full items-center justify-center gap-3'>
      {TOOL_SLOTS.map((slot) => (
        <span
          key={slot}
          className={`${SLOT} text-muted-foreground relative flex size-14 items-center justify-center rounded-xl`}
        >
          <span
            data-loop='slot'
            aria-hidden='true'
            className='bg-primary/10 absolute inset-0 rounded-xl opacity-0'
          />
          <PlusIcon className='size-4 opacity-60' />
        </span>
      ))}
    </div>
  );
}

function AgentsArt() {
  return (
    <div className='flex h-full w-full items-center justify-center gap-3'>
      {AGENT_SLOTS.map((slot) => {
        if (slot === 0) {
          return (
            <span key={slot} data-loop='ghost' className='opacity-30'>
              <MeshTile seed='Planner' className='size-14 rounded-xl' />
            </span>
          );
        }
        return (
          <span
            key={slot}
            className={`${SLOT} text-muted-foreground flex size-14 items-center justify-center rounded-xl`}
          >
            <PlusIcon className='size-4 opacity-60' />
          </span>
        );
      })}
    </div>
  );
}

const ART: Record<SceneId, () => React.JSX.Element> = {
  runs: RunsArt,
  inbox: InboxArt,
  tools: ToolsArt,
  agents: AgentsArt,
};

const BREATH: Keyframe[] = [
  { opacity: 0.45 },
  { opacity: 1 },
  { opacity: 0.45 },
];

const RISE: Keyframe[] = [
  { opacity: 0, transform: 'translateY(10px) scale(0.9)' },
  { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.3 },
  { opacity: 0, transform: 'translateY(-26px) scale(1)' },
];

const LIGHT: Keyframe[] = [
  { opacity: 0 },
  { opacity: 1, offset: 0.25 },
  { opacity: 0, offset: 0.5 },
  { opacity: 0 },
];

const GHOST: Keyframe[] = [
  { opacity: 0.3, transform: 'scale(0.97)' },
  { opacity: 0.75, transform: 'scale(1)' },
  { opacity: 0.3, transform: 'scale(0.97)' },
];

const LOOPS: Record<SceneId, SceneLoop[]> = {
  runs: [
    {
      selector: '[data-loop="row"]',
      keyframes: BREATH,
      duration: 3600,
      stagger: 600,
    },
  ],
  inbox: [
    {
      selector: '[data-loop="rise"]',
      keyframes: RISE,
      duration: 3200,
      stagger: 1000,
    },
  ],
  tools: [
    {
      selector: '[data-loop="slot"]',
      keyframes: LIGHT,
      duration: 3200,
      stagger: 800,
    },
  ],
  agents: [
    { selector: '[data-loop="ghost"]', keyframes: GHOST, duration: 3600 },
  ],
};

type SceneArtProps = {
  sceneId: SceneId;
  isPlaying: boolean;
};

export function SceneArt({ sceneId, isPlaying }: SceneArtProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const Art = ART[sceneId];
  useSceneLoops(rootRef, LOOPS[sceneId], isPlaying);

  return (
    <div ref={rootRef} aria-hidden='true' className='h-40 w-full max-w-xs'>
      <Art />
    </div>
  );
}
