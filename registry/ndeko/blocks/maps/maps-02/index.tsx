'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import {
  AGENT_IDS,
  AGENTS,
  MAP_TITLE,
  REGIONS,
  type AgentId,
  type RegionId,
} from './data';
import { MapStage } from './map-stage';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  totalRunsOf,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function liveWordOf(count: number) {
  if (count === 1) {
    return 'run live';
  }
  return 'runs live';
}

function regionsWordOf(count: number) {
  if (count === 1) {
    return '1 region';
  }
  return `${count} regions`;
}

function AgentEntry({ id }: { id: AgentId }) {
  const agent = AGENTS[id];
  const color = seriesColorOf(agent.series);

  return (
    <span className='flex items-center gap-1.5'>
      <MeshTile seed={agent.name} color={color} size='sm' />
      {agent.name}
    </span>
  );
}

/** What the marks of the map mean: a light takes the colour of the agent whose run it carries. */
function Legend() {
  return (
    <ul
      aria-label='Legend'
      className='text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-xs'
    >
      <li className='flex items-center gap-1.5'>
        <span
          aria-hidden='true'
          className='bg-primary ring-card size-2.5 rounded-full ring-2'
        />
        Region, larger with more runs
      </li>
      <li className='flex items-center gap-1.5'>
        <span
          aria-hidden='true'
          className='bg-foreground/30 h-px w-4 rounded-full'
        />
        Route
      </li>
      <li className='flex flex-wrap items-center gap-x-3 gap-y-1'>
        <span>Run handed off by</span>
        {AGENT_IDS.map((id) => (
          <AgentEntry key={id} id={id} />
        ))}
      </li>
    </ul>
  );
}

export default function Maps02() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const isVisible = useDocumentVisible();
  const isOnScreen = isInView && isVisible;
  const total = totalRunsOf(state);
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.notice);
  const regionsWord = regionsWordOf(REGIONS.length);

  function toggle(id: RegionId) {
    act({ type: 'toggled', id });
  }

  function clear() {
    act({ type: 'cleared' });
  }

  return (
    <div
      ref={ref}
      className='bg-background text-foreground @container min-h-dvh w-full'
    >
      <div className='mx-auto flex max-w-5xl flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-8'>
        <header className='flex flex-wrap items-end gap-x-4 gap-y-3'>
          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <h1 className='text-lg font-semibold text-balance'>{MAP_TITLE}</h1>
            <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
              Runs handed off between {regionsWord}
              <Badge variant='secondary'>Illustrative</Badge>
            </p>
          </div>
          <ReplayButton
            isShown={canReplay}
            onReplay={restart}
            label='Replay the map'
          />
          <p className='flex items-baseline gap-1.5'>
            <MotionNumber
              value={total}
              className='text-2xl leading-8 font-semibold'
            />
            <span className='text-muted-foreground text-xs'>
              {liveWordOf(total)}
            </span>
          </p>
        </header>

        <div className='bg-foreground/[0.03] rounded-xl p-3 @2xl:p-6'>
          <MapStage
            runs={state.runs}
            flights={state.flights}
            landings={state.landings}
            selectedId={state.selectedId}
            pressed={pressed}
            isActive={isOnScreen}
            onToggle={toggle}
            onClear={clear}
          />
        </div>

        <Legend />
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
