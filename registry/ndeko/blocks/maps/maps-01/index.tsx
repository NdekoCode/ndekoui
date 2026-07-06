'use client';

import { memo, useCallback, useState } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ACTIVITY_TITLE, AGENTS, regionOf, type RegionId } from './data';
import { GlobeStage } from './globe-stage';
import { RegionList } from './region-list';
import {
  facingLineOf,
  handoffLineOf,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  totalRunsOf,
  type Handoff,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const ARROW_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

/** The latest hand-off, under the globe, so the arc says what it is. It stays on one line. */
const HandoffLine = memo(function HandoffLine({
  handoff,
}: {
  handoff: Handoff;
}) {
  const agent = AGENTS[handoff.agentId];
  const color = seriesColorOf(agent.series);
  const line = handoffLineOf(handoff);
  const from = regionOf(handoff.from).name;
  const to = regionOf(handoff.to).name;

  return (
    <p className='text-muted-foreground flex h-5 items-center justify-center text-xs whitespace-nowrap'>
      <span className='sr-only'>{line}</span>
      <Swap swapKey={line}>
        <span aria-hidden='true' className='flex items-center'>
          <MeshTile
            seed={agent.name}
            color={color}
            size='sm'
            className='me-1.5'
          />
          <span className='text-foreground me-1.5 font-medium'>
            {agent.name}
          </span>
          {from}
          <ArrowRightIcon className='mx-1 size-3' />
          {to}
        </span>
      </Swap>
    </p>
  );
});

export default function Maps01() {
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
  const [releasedId, setReleasedId] = useState<RegionId | null>(null);
  const isOnScreen = isInView && isVisible;
  const isHeld = releasedId !== state.selectedId;
  const total = totalRunsOf(state);
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.notice);
  const facingLine = facingLineOf(state.facing);
  const globeLabel = `Globe of agent activity, ${facingLine}`;

  const pick = useCallback(
    (id: RegionId) => {
      setReleasedId(null);
      act({ type: 'selected', id });
    },
    [act]
  );

  function letGo() {
    setReleasedId(state.selectedId);
  }

  function letGoOnArrows(event: React.KeyboardEvent<HTMLDivElement>) {
    if (ARROW_KEYS.has(event.key)) {
      letGo();
    }
  }

  function replay() {
    setReleasedId(null);
    restart();
  }

  return (
    <div
      ref={ref}
      className='bg-background text-foreground @container min-h-dvh w-full'
    >
      <div className='mx-auto flex max-w-5xl flex-col gap-5 p-4 @3xl:gap-6 @3xl:p-8'>
        <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <h1 className='text-lg font-semibold text-balance'>
              {ACTIVITY_TITLE}
            </h1>
            <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
              Live runs, tokens and spend by region
              <Badge variant='secondary'>Illustrative</Badge>
            </p>
          </div>
          <ReplayButton
            isShown={canReplay}
            onReplay={replay}
            label='Replay the activity'
          />
        </header>

        <div className='grid grid-cols-1 items-center gap-6 @3xl:grid-cols-2 @3xl:gap-8'>
          <div className='flex min-w-0 flex-col items-center gap-3'>
            <div
              onPointerDown={letGo}
              onKeyDown={letGoOnArrows}
              className='relative aspect-square w-full max-w-[17rem] @md:max-w-[20rem] @3xl:max-w-[26rem]'
            >
              <div
                aria-hidden='true'
                className='bg-foreground/[0.04] absolute inset-[10%] rounded-full'
              />
              <GlobeStage
                selectedId={state.selectedId}
                handoff={state.lastHandoff}
                drawingId={state.drawingId}
                facing={state.facing}
                isHeld={isHeld}
                isActive={isOnScreen}
                label={globeLabel}
              />
            </div>
            <HandoffLine handoff={state.lastHandoff} />
          </div>
          <RegionList
            loads={state.loads}
            selectedId={state.selectedId}
            total={total}
            pressed={pressed}
            onSelect={pick}
          />
        </div>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
