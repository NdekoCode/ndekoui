'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments } from '@/registry/ndeko/ui/segments';

import { MAIN_AGENTS, PERIODS, TEAM_NAME, type Model } from './data';
import { Fleet } from './fleet';
import { NeedsYou } from './needs-you';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  runningCountOf,
  SCRIPT,
  spendOf,
  totalsOf,
} from './session';
import { SpendByModel } from './spend';
import { TotalsBand } from './totals';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function agentsWordOf(count: number) {
  if (count === 1) {
    return '1 agent';
  }
  return `${count} agents`;
}

function waitingLineOf(waiting: number) {
  if (waiting === 0) {
    return 'Nothing waits on you';
  }
  if (waiting === 1) {
    return '1 request waits on you';
  }
  return `${waiting} requests wait on you`;
}

function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}

export default function AgentOps01() {
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
  const totals = totalsOf(state);
  const runningCount = runningCountOf(state);
  const agentsWord = agentsWordOf(MAIN_AGENTS.length);
  const waitingLine = waitingLineOf(totals.waiting);
  const message = spokenUnless(isAutoplaying, waitingLine);
  const canReplay = isFinished && !isAutoplaying;

  function spendOfModel(model: Model) {
    return spendOf(state, model.id);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-5xl flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h1 className='text-2xl font-semibold text-balance'>Agents</h1>
              <p className='text-muted-foreground text-xs'>
                {TEAM_NAME} · {agentsWord} · Illustrative figures
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay the day'
            />
            <Segments
              value={state.period}
              segments={PERIODS}
              onValueChange={(period) => act({ type: 'period', period })}
              label='Period'
              className='w-36'
            />
          </header>

          <TotalsBand totals={totals} period={state.period} />

          <div className='flex flex-col gap-4 @4xl:flex-row @4xl:items-start @4xl:gap-5'>
            <div className='flex min-w-0 flex-1 flex-col gap-4 @4xl:gap-5'>
              <NeedsYou
                pending={state.pending}
                pressed={pressed}
                onDecide={(approvalId, decision) =>
                  act({ type: 'decided', approvalId, decision })
                }
              />
              <Fleet
                agents={state.agents}
                runningCount={runningCount}
                openId={state.openId}
                pressed={pressed}
                onToggle={(id) => act({ type: 'toggled', id })}
              />
            </div>
            <div className='@4xl:w-80 @4xl:shrink-0'>
              <SpendByModel
                period={state.period}
                total={totals.spendUsd}
                spendOfModel={spendOfModel}
              />
            </div>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
