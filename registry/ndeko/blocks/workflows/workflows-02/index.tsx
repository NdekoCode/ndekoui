'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { PlayIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { Canvas } from './canvas';
import {
  nodeOf,
  NODES,
  PIPELINE_NAME,
  PORT_TYPES,
  TYPE_WORD,
  type NodeId,
  type PortType,
} from './data';
import { layoutOf, type Orientation } from './layout';
import {
  INITIAL,
  isRunning,
  LOOP_AFTER_MS,
  phaseOf,
  reducer,
  RESTING,
  SCRIPT,
  type GraphState,
  type RunStatus,
} from './session';
import { useIsPhone } from './use-is-phone';
import { typeColorOf } from './wires';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
  holdWhile: isRunning,
};

const RUN_LABELS: Record<MorphState, string> = {
  idle: 'Run pipeline',
  busy: 'Running',
  done: 'Run pipeline',
};

/** How long a refused wire and its reason stay before they leave on their own. */
const REFUSAL_MS = 2400;

const CANVAS_HINT =
  'Drag from the port on the way out of a node to another node to connect them. The port on the way in of a node opens the list of nodes that can feed it. A wire only joins two ports of the same type.';

function orientationOf(isPhone: boolean | null): Orientation {
  if (isPhone) {
    return 'down';
  }
  return 'across';
}

function morphOf(isBusy: boolean): MorphState {
  if (isBusy) {
    return 'busy';
  }
  return 'idle';
}

function titleOf(id: NodeId | null) {
  if (id === null) {
    return null;
  }
  return nodeOf(id).title;
}

function countOf(state: GraphState, status: RunStatus) {
  const matching = NODES.filter(
    (node) => state.runs[node.id].status === status
  );
  return matching.length;
}

function ranWordOf(count: number) {
  if (count === 1) {
    return '1 node ran';
  }
  return `${count} nodes ran`;
}

/** The last run in one line: what ran, what came from cache, what was left out. */
function runLineOf(state: GraphState, runningTitle: string | null) {
  if (runningTitle !== null) {
    return `Running ${runningTitle}`;
  }
  const failed = NODES.find((node) => state.runs[node.id].status === 'failed');
  const skipped = countOf(state, 'skipped');
  if (failed) {
    return `${failed.title} failed, ${skipped} skipped`;
  }
  const done = countOf(state, 'done');
  const cached = countOf(state, 'cached');
  const hasRun = done + cached + skipped > 0;
  if (!hasRun) {
    return 'Not run yet';
  }
  const parts = [ranWordOf(done)];
  if (cached > 0) {
    parts.push(`${cached} from cache`);
  }
  if (skipped > 0) {
    parts.push(`${skipped} skipped`);
  }
  return parts.join(', ');
}

function LegendEntry({ type }: { type: PortType }) {
  return (
    <li className='flex items-center gap-1.5'>
      <span
        aria-hidden='true'
        style={{ backgroundColor: typeColorOf(type) }}
        className='h-0.5 w-4 rounded-full'
      />
      {TYPE_WORD[type]}
    </li>
  );
}

function Legend() {
  return (
    <ul
      aria-label='What each wire carries'
      className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'
    >
      {PORT_TYPES.map((type) => (
        <LegendEntry key={type} type={type} />
      ))}
    </ul>
  );
}

export default function Workflows02() {
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
  const cellRef = useRef<HTMLDivElement>(null);
  const isPhone = useIsPhone(cellRef);
  const isVisible = useDocumentVisible();
  const isOnScreen = isInView && isVisible;
  const hintId = useId();
  const [round, setRound] = useState(0);
  const orientation = orientationOf(isPhone);
  const layout = useMemo(
    () => layoutOf(state.wires, orientation),
    [state.wires, orientation]
  );
  const phase = phaseOf(state);
  const phaseId = phase?.id ?? null;
  const phaseMs = phase?.ms ?? null;
  const phaseToken = phase?.token ?? null;
  const refusedId = state.refused?.id ?? null;
  const isBusy = phase !== null;
  const runningTitle = titleOf(phaseId);
  const runLine = runLineOf(state, runningTitle);
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.notice);

  /**
   * A run holds its place off screen and in a hidden tab, as the session does: the node it is on
   * starts over on return.
   */
  useEffect(() => {
    const isIdle = phaseMs === null || phaseToken === null;
    if (isIdle || !isOnScreen) {
      return;
    }
    const end = () => act({ type: 'phaseEnded', token: phaseToken });
    const timer = setTimeout(end, phaseMs);
    return () => clearTimeout(timer);
  }, [act, isOnScreen, phaseId, phaseMs, phaseToken]);

  useEffect(() => {
    if (refusedId === null || !isOnScreen) {
      return;
    }
    const clear = () => act({ type: 'refusalCleared', id: refusedId });
    const timer = setTimeout(clear, REFUSAL_MS);
    return () => clearTimeout(timer);
  }, [act, isOnScreen, refusedId]);

  function run() {
    act({ type: 'ran' });
  }

  /** A new round starts on a fresh canvas, so the view a person left does not hide the demonstration. */
  function replay() {
    restart();
    setRound((current) => current + 1);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container flex h-dvh min-h-[38rem] w-full flex-col overflow-hidden'
      >
        <div className='mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 p-3 @3xl:gap-4 @3xl:p-4'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h1 className='truncate text-lg font-semibold'>
                {PIPELINE_NAME}
              </h1>
              <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums'>
                <Swap swapKey={runLine}>{runLine}</Swap>
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
              <ReplayButton
                isShown={canReplay}
                onReplay={replay}
                label='Replay the demo'
              />
              <MorphButton
                type='button'
                state={morphOf(isBusy)}
                labels={RUN_LABELS}
                idleIcon={<PlayIcon />}
                onClick={run}
                className={pressedSolidOf(pressed === 'run')}
              />
            </div>
          </header>

          <div
            ref={cellRef}
            className='group/canvas bg-foreground/[0.03] relative min-h-0 flex-1 overflow-hidden rounded-xl'
          >
            <Canvas
              key={round}
              isLaidOut={isPhone !== null}
              label={`Canvas of ${PIPELINE_NAME}`}
              subject='the pipeline'
              hintId={hintId}
              layout={layout}
              orientation={orientation}
              wires={state.wires}
              params={state.params}
              runs={state.runs}
              runningId={phaseId}
              wiring={state.wiring}
              refused={state.refused}
              isDemonstrating={isAutoplaying}
              pressed={pressed}
              onAction={act}
              onRun={run}
            />
            <p id={hintId} className='sr-only'>
              {CANVAS_HINT}
            </p>
          </div>

          <Legend />
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
