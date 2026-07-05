'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { PlayIcon, RocketIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { CaseDetail } from './case-detail';
import { CaseGrid } from './case-grid';
import { CELL_WORD, StatusCell } from './cells';
import { caseOf, CASES, PROMPT, TARGETS, type EvalCase } from './data';
import {
  blockedCountOf,
  candidateStatusOf,
  canShip,
  INITIAL,
  isRegression,
  LOOP_AFTER_MS,
  matchesFilter,
  reducer,
  RESTING,
  SCRIPT,
  undecidedCountOf,
  type CellStatus,
  type EvalState,
  type Filter,
  type RunPhase,
} from './session';
import { Versions } from './versions';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const FILTERS: Segment<Filter>[] = [
  { value: 'all', label: 'All' },
  { value: 'failing', label: 'Failing' },
  { value: 'regressions', label: 'Regressions' },
];

const RUN_STATE: Record<RunPhase, MorphState> = {
  idle: 'idle',
  running: 'busy',
  done: 'done',
};

const RUN_LABELS: Record<MorphState, string> = {
  idle: 'Run evals',
  busy: 'Running',
  done: `Ran ${CASES.length} cases`,
};

const SHIP_LABELS: Record<MorphState, string> = {
  idle: `Ship ${TARGETS.candidate.version}`,
  busy: 'Shipping',
  done: 'Shipped',
};

const LEGEND: { status: CellStatus; meaning: string }[] = [
  { status: 'pass', meaning: 'The grader accepted the reply' },
  { status: 'fail', meaning: 'The reply misses what was expected' },
  { status: 'flaky', meaning: 'It passes on some runs only' },
  { status: 'running', meaning: 'The case is with the model now' },
  { status: 'queued', meaning: 'It waits for a free slot' },
];

function regressionsWordOf(count: number) {
  if (count === 1) {
    return '1 regression';
  }
  return `${count} regressions`;
}

function casesWordOf(count: number) {
  if (count === 1) {
    return '1 case';
  }
  return `${count} cases`;
}

function shipHintOf(state: EvalState) {
  const version = TARGETS.candidate.version;
  if (state.ship === 'done') {
    return `${version} answers every new conversation`;
  }
  if (state.ship === 'busy') {
    return `Moving conversations to ${version}`;
  }
  if (state.phase === 'idle') {
    return `Run the evals before ${version} ships`;
  }
  if (state.phase === 'running') {
    return 'Shipping waits for the run to end';
  }
  const undecided = undecidedCountOf(state);
  if (undecided > 0) {
    return `${regressionsWordOf(undecided)} to decide`;
  }
  const blocked = blockedCountOf(state);
  if (blocked > 0) {
    return `${regressionsWordOf(blocked)} blocked: fix the prompt and run again`;
  }
  return 'Every regression is decided';
}

function runVariantOf(phase: RunPhase) {
  if (phase === 'idle') {
    return 'default';
  }
  return 'outline';
}

function shipVariantOf(isReady: boolean) {
  if (isReady) {
    return 'default';
  }
  return 'outline';
}

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}

function Legend() {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-sm font-medium'>
          Pick a case to read both replies
        </h2>
        <p className='text-muted-foreground text-[13px]'>
          A regression opens with the part that fails marked, and waits for your
          decision.
        </p>
      </div>
      <ul className='flex flex-col'>
        {LEGEND.map((entry) => (
          <li
            key={entry.status}
            className='flex min-h-9 items-center gap-2.5 text-[13px]'
          >
            <StatusCell status={entry.status} size='sm' />
            <span className='w-16 shrink-0 font-medium'>
              {CELL_WORD[entry.status]}
            </span>
            <span className='text-muted-foreground min-w-0'>
              {entry.meaning}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AgentOps02() {
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
  const cases = CASES.filter((entry) => matchesFilter(state, entry));
  const isReady = canShip(state);
  const shipHint = shipHintOf(state);
  const message = spokenUnless(isAutoplaying, shipHint);
  const canReplay = isFinished && !isAutoplaying;
  const isLocked = state.ship !== 'idle';
  const shownWord = `${cases.length} of ${casesWordOf(CASES.length)}`;
  let openCase: EvalCase | null = null;
  if (state.openId !== null) {
    openCase = caseOf(state.openId);
  }

  function renderDetail(entry: EvalCase) {
    return (
      <CaseDetail
        entry={entry}
        candidateStatus={candidateStatusOf(state, entry.id)}
        isRegression={isRegression(state, entry.id)}
        verdict={state.verdicts[entry.id]}
        isLocked={isLocked}
        pressed={pressed}
        onVerdict={(verdict) => act({ type: 'verdict', id: entry.id, verdict })}
      />
    );
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-6xl flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <BrandTile brand={PROMPT.brand} size='lg' title={PROMPT.model} />
            <div className='flex min-w-40 flex-1 flex-col leading-tight'>
              <h1 className='text-lg font-semibold text-balance'>
                {PROMPT.name}
              </h1>
              <p className='text-muted-foreground text-xs'>
                {PROMPT.team} · {PROMPT.model}
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay the run'
            />
            <MorphButton
              type='button'
              state={RUN_STATE[state.phase]}
              labels={RUN_LABELS}
              idleIcon={<PlayIcon />}
              variant={runVariantOf(state.phase)}
              onClick={() => act({ type: 'run' })}
              className={pressedSolidOf(pressed === 'run')}
            />
          </header>

          <Versions state={state} />

          <div className='flex flex-col gap-4 @4xl:flex-row @4xl:items-start @4xl:gap-5'>
            <div className='flex min-w-0 flex-1 flex-col gap-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <Segments
                  value={state.filter}
                  segments={FILTERS}
                  onValueChange={(filter) => act({ type: 'filter', filter })}
                  label='Show cases'
                  className='w-full @sm:w-72'
                />
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {shownWord}
                </span>
              </div>
              <CaseGrid
                state={state}
                cases={cases}
                pressed={pressed}
                onOpen={(id) => act({ type: 'opened', id })}
                onShowAll={() => act({ type: 'filter', filter: 'all' })}
                renderDetail={renderDetail}
              />
              <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1'>
                <p className='text-muted-foreground min-w-0 text-[13px]'>
                  <Swap swapKey={shipHint}>{shipHint}</Swap>
                </p>
                <MorphButton
                  type='button'
                  size='lg'
                  state={state.ship}
                  labels={SHIP_LABELS}
                  idleIcon={<RocketIcon />}
                  variant={shipVariantOf(isReady)}
                  disabled={!isReady}
                  onClick={() => act({ type: 'ship' })}
                  className={pressedSolidOf(pressed === 'ship')}
                />
              </div>
            </div>

            <aside
              aria-label='Case'
              className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] hidden w-[28rem] shrink-0 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @4xl:block'
            >
              <AnimatedSize>
                {!openCase && <Legend />}
                {openCase && (
                  <div
                    key={openCase.id}
                    className='flex flex-col gap-3 transition-opacity duration-300 starting:opacity-0'
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <h2 className='text-sm leading-7 font-medium'>
                        {openCase.name}
                      </h2>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        aria-label='Close the case'
                        onClick={() => act({ type: 'closed' })}
                        className='text-muted-foreground'
                      >
                        <XIcon />
                      </Button>
                    </div>
                    {renderDetail(openCase)}
                  </div>
                )}
              </AnimatedSize>
            </aside>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
