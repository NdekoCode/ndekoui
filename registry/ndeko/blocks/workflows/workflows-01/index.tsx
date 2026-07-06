'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  CircleCheckIcon,
  TriangleAlertIcon,
  UndoIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { Canvas } from './canvas';
import { shownNameOf, WORKFLOW_NAME, type Step } from './data';
import { problemsOf, problemsOfStep, stepOf } from './graph';
import { Inspector } from './inspector';
import { layoutOf, type Orientation } from './layout';
import {
  graphOf,
  INITIAL,
  LOOP_AFTER_MS,
  PUBLISH_MS,
  reducer,
  RESTING,
  SCRIPT,
  type PublishState,
} from './session';
import {
  BottomSheet,
  DEFAULT_WIDTH,
  isOwnEscape,
  ResizeHandle,
  SHEET_SHARE,
} from './side-panel';
import { useWidthBand, type WidthBand } from './use-width-band';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const PUBLISH_LABELS: Record<MorphState, string> = {
  idle: 'Publish',
  busy: 'Publishing',
  done: 'Published',
};

const MORPH_OF: Record<PublishState, MorphState> = {
  draft: 'idle',
  publishing: 'busy',
  live: 'done',
};

const CANVAS_HINT =
  'Tab moves through the steps. The arrow keys follow the connections. Enter opens a step in the inspector. Alt with an arrow key moves the step along the grid. Delete removes it, and Undo brings it back. The menu of a step connects it without dragging.';

type RowStyle = React.CSSProperties & { '--inspector': string };

type Status = 'problems' | 'ready' | 'live';

function orientationOf(band: WidthBand | null): Orientation {
  if (band === 'wide' || band === null) {
    return 'across';
  }
  return 'down';
}

function stepsWordOf(count: number) {
  if (count === 1) {
    return '1 step';
  }
  return `${count} steps`;
}

function wiresWordOf(count: number) {
  if (count === 1) {
    return '1 connection';
  }
  return `${count} connections`;
}

function problemWordOf(count: number) {
  if (count === 1) {
    return 'problem';
  }
  return 'problems';
}

function statusOf(problemCount: number, isLive: boolean): Status {
  if (problemCount > 0) {
    return 'problems';
  }
  if (isLive) {
    return 'live';
  }
  return 'ready';
}

function stageWordOf(isLive: boolean) {
  if (isLive) {
    return 'Live';
  }
  return 'Draft';
}

function stageVariantOf(isLive: boolean) {
  if (isLive) {
    return 'success';
  }
  return 'secondary';
}

function coveredOf(isSheetOpen: boolean) {
  if (isSheetOpen) {
    return SHEET_SHARE;
  }
  return 0;
}

function shownStepOf(step: Step | undefined, isOpen: boolean) {
  if (isOpen) {
    return step;
  }
  return undefined;
}

type ProblemStatusProps = {
  count: number;
  isLive: boolean;
};

function ProblemStatus({ count, isLive }: ProblemStatusProps) {
  const status = statusOf(count, isLive);

  return (
    <p className='flex h-8 items-center text-xs'>
      <Swap swapKey={status}>
        {status === 'problems' && (
          <span className='text-warning-foreground flex items-center gap-1.5 tabular-nums'>
            <TriangleAlertIcon className='size-3.5' />
            <MotionNumber value={count} />
            {problemWordOf(count)}
          </span>
        )}
        {status === 'ready' && (
          <span className='text-success-foreground flex items-center gap-1.5'>
            <CircleCheckIcon className='size-3.5' />
            Ready to publish
          </span>
        )}
      </Swap>
    </p>
  );
}

type UndoLineProps = {
  step: Step | undefined;
  onUndo: () => void;
  onDismiss: () => void;
};

/** It stays until it is used or dismissed: a timer would take the focus away with it. */
function UndoLine({ step, onUndo, onDismiss }: UndoLineProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = risePresenceOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {step && (
        <motion.div
          key='undo'
          className='pointer-events-none absolute inset-x-3 top-3 flex justify-center'
          {...presence}
        >
          <div className='surface-raised pointer-events-auto flex h-9 max-w-full items-center gap-1 rounded-full ps-3.5 pe-1 text-[13px]'>
            <span className='min-w-0 truncate'>
              {shownNameOf(step)} removed
            </span>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              data-undo
              onClick={onUndo}
              className='text-primary-ink rounded-full'
            >
              <UndoIcon />
              Undo
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label='Dismiss'
              onClick={onDismiss}
              className='text-muted-foreground rounded-full'
            >
              <XIcon />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** It lies over the canvas without taking its presses, so the zoom control under it still works. */
function EmptyCanvas({ onRestore }: { onRestore: () => void }) {
  return (
    <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center'>
      <p className='text-muted-foreground text-[13px]'>
        No step is left on the canvas
      </p>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={onRestore}
        className='pointer-events-auto'
      >
        Restore the sample workflow
      </Button>
    </div>
  );
}

export default function Workflows01() {
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
  const { schedule } = useTimeouts();
  const rowRef = useRef<HTMLDivElement>(null);
  const band = useWidthBand(rowRef);
  const headingId = useId();
  const hintId = useId();
  const inspectorId = useId();
  const [inspectorWidth, setInspectorWidth] = useState(DEFAULT_WIDTH);
  const [round, setRound] = useState(0);
  const orientation = orientationOf(band);
  const layout = useMemo(
    () => layoutOf(state.steps, state.wires, orientation),
    [state.steps, state.wires, orientation]
  );
  const graph = graphOf(state);
  const problems = problemsOf(graph);
  const problemCount = problems.length;
  const selected = stepOf(state.steps, state.selectedId);
  const shownStep = shownStepOf(selected, state.isInspectorOpen);
  const isSheet = band === 'phone';
  const isPanel = band === 'compact' || band === 'wide';
  const isSheetOpen = isSheet && shownStep !== undefined;
  const isLive = state.publish === 'live';
  const isEmpty = state.steps.length === 0;
  const stageWord = stageWordOf(isLive);
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.notice);
  const stepsWord = stepsWordOf(state.steps.length);
  const wiresWord = wiresWordOf(state.wires.length);
  const rowStyle: RowStyle = { '--inspector': `${inspectorWidth}px` };

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** After a refusal the focus goes to the field to fill, or to the inspector when a wire is missing. */
  function focusProblemLater() {
    requestAnimationFrame(() => {
      const root = ref.current;
      const field = root?.querySelector<HTMLElement>('[aria-invalid="true"]');
      const heading = root?.querySelector<HTMLElement>(
        '[data-inspector-heading]'
      );
      const target = field ?? heading;
      target?.focus();
    });
  }

  function open(id: string, isFromKeyboard: boolean) {
    act({ type: 'opened', id });
    if (isFromKeyboard) {
      focusLater('[data-inspector-heading]');
    }
  }

  function close() {
    act({ type: 'closed' });
    if (state.selectedId !== null) {
      focusLater(`[data-step-button="${state.selectedId}"]`);
    }
  }

  function remove(id: string) {
    act({ type: 'removed', id });
    focusLater('[data-undo]');
  }

  function undo() {
    const lost = state.removed;
    act({ type: 'undone' });
    if (lost) {
      focusLater(`[data-step-button="${lost.step.id}"]`);
    }
  }

  function dismissUndo() {
    act({ type: 'undoDismissed' });
    focusLater('[data-canvas-frame]');
  }

  function publish() {
    act({ type: 'publishStarted' });
    if (problemCount > 0) {
      focusProblemLater();
      return;
    }
    if (state.publish === 'draft') {
      schedule(() => act({ type: 'publishDone' }), PUBLISH_MS);
    }
  }

  /** A new round starts on a fresh canvas, so the view a person left does not hide the demonstration. */
  function replay() {
    restart();
    setRound((current) => current + 1);
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLElement>) {
    if (isOwnEscape(event)) {
      close();
    }
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
              <div className='flex items-center gap-2'>
                <h1 className='truncate text-lg font-semibold'>
                  {WORKFLOW_NAME}
                </h1>
                <Badge variant={stageVariantOf(isLive)}>
                  <Swap swapKey={stageWord}>{stageWord}</Swap>
                </Badge>
              </div>
              <p className='text-muted-foreground text-xs tabular-nums'>
                {stepsWord} · {wiresWord}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
              <ReplayButton
                isShown={canReplay}
                onReplay={replay}
                label='Replay the demo'
              />
              <ProblemStatus count={problemCount} isLive={isLive} />
              <MorphButton
                type='button'
                state={MORPH_OF[state.publish]}
                labels={PUBLISH_LABELS}
                onClick={publish}
                className={pressedSolidOf(pressed === 'publish')}
              />
            </div>
          </header>

          <div ref={rowRef} style={rowStyle} className='flex min-h-0 flex-1'>
            <div className='group/canvas bg-foreground/[0.03] relative min-w-0 flex-1 overflow-hidden rounded-xl'>
              <Canvas
                key={round}
                isLaidOut={band !== null}
                label={`Canvas of ${WORKFLOW_NAME}`}
                subject='the workflow'
                hintId={hintId}
                inspectorId={inspectorId}
                steps={state.steps}
                graph={graph}
                problems={problems}
                layout={layout}
                orientation={orientation}
                selectedId={state.selectedId}
                isInspectorOpen={state.isInspectorOpen}
                covered={coveredOf(isSheetOpen)}
                wiring={state.wiring}
                isDemonstrating={isAutoplaying}
                pressed={pressed}
                onAction={act}
                onOpen={open}
                onRemove={remove}
              />
              <p id={hintId} className='sr-only'>
                {CANVAS_HINT}
              </p>
              {isEmpty && (
                <EmptyCanvas onRestore={() => act({ type: 'restored' })} />
              )}
              <UndoLine
                step={state.removed?.step}
                onUndo={undo}
                onDismiss={dismissUndo}
              />
              {isSheet && (
                <BottomSheet
                  id={inspectorId}
                  isOpen={isSheetOpen}
                  label='Step inspector'
                  onClose={close}
                >
                  {shownStep && (
                    <Inspector
                      step={shownStep}
                      graph={graph}
                      problems={problemsOfStep(problems, shownStep.id)}
                      headingId={headingId}
                      onAction={act}
                      onRemove={remove}
                      onClose={close}
                    />
                  )}
                </BottomSheet>
              )}
            </div>
            {isPanel && shownStep && (
              <>
                <ResizeHandle
                  width={inspectorWidth}
                  containerRef={rowRef}
                  onWidthChange={setInspectorWidth}
                />
                <aside
                  id={inspectorId}
                  aria-label='Step inspector'
                  onKeyDown={closeOnEscape}
                  className='bg-card hairline-ring ring-border flex w-(--inspector) max-w-[46%] shrink-0 flex-col rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity duration-200 starting:opacity-0'
                >
                  <Inspector
                    step={shownStep}
                    graph={graph}
                    problems={problemsOfStep(problems, shownStep.id)}
                    headingId={headingId}
                    onAction={act}
                    onRemove={remove}
                    onClose={close}
                  />
                </aside>
              </>
            )}
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
