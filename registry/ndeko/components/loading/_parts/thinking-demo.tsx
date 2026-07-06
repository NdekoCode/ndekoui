'use client';

import { useState, type ReactNode } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { hiddenIf } from '@/registry/ndeko/lib/demonstration';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

type Phase = 'thinking' | 'done';

const PHASES: Segment<Phase>[] = [
  { value: 'thinking', label: 'Thinking' },
  { value: 'done', label: 'Done' },
];

const LABEL_HOLD_MS = 1800;

const DONE_HOLD_MS = 2400;

export type ThinkingDemoAgent = {
  name: string;
  series: SeriesSlot;
};

export type IndicatorState = {
  label: string;
  isDone: boolean;
};

type ThinkingDemoProps = {
  agent: ThinkingDemoAgent;
  /** The labels the work goes through; the first one shows when it starts. */
  steps: readonly string[];
  doneLabel: string;
  renderIndicator: (state: IndicatorState) => ReactNode;
  /** A second mark after the agent's name, for a variant shown in a header. */
  renderBesideName?: (state: IndicatorState) => ReactNode;
};

function phaseOf(isDone: boolean): Phase {
  if (isDone) {
    return 'done';
  }
  return 'thinking';
}

function labelOf(
  steps: readonly string[],
  stepIndex: number,
  isDone: boolean,
  doneLabel: string
) {
  if (isDone) {
    return doneLabel;
  }
  return steps[stepIndex] ?? '';
}

/**
 * An agent's turn in a conversation: its name, then its status. The demonstration walks the work
 * through its labels, lands it on done, holds, and starts again; the switch under the card lets a
 * person do the same.
 */
export function ThinkingDemo({
  agent,
  steps,
  doneLabel,
  renderIndicator,
  renderBesideName,
}: ThinkingDemoProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const label = labelOf(steps, stepIndex, isDone, doneLabel);
  const state: IndicatorState = { label, isDone };

  function startOver() {
    setStepIndex(0);
    setIsDone(false);
  }

  function choose(phase: Phase) {
    if (phase === 'done') {
      setIsDone(true);
      return;
    }
    startOver();
  }

  const nextLabels: AutoplayStep[] = steps.slice(1).map((_, index) => ({
    after: LABEL_HOLD_MS,
    run: () => setStepIndex(index + 1),
  }));
  const autoplaySteps: AutoplayStep[] = [
    ...nextLabels,
    { after: LABEL_HOLD_MS, run: () => setIsDone(true) },
  ];
  const { ref, isAutoplaying } = useAutoplay(autoplaySteps, {
    loopAfter: DONE_HOLD_MS,
    onReset: startOver,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[22rem] flex-col items-center gap-3'
    >
      <div className='bg-card hairline-ring ring-border flex w-full flex-col gap-2 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <div className='flex min-w-0 items-center gap-2'>
          <MeshTile seed={agent.name} color={seriesColorOf(agent.series)} />
          <p className='min-w-0 truncate text-[13px] font-medium'>
            {agent.name}
          </p>
          {renderBesideName?.(state)}
        </div>
        <div aria-hidden={hiddenIf(isAutoplaying)} className='min-w-0 ps-7'>
          {renderIndicator(state)}
        </div>
      </div>
      <Segments
        value={phaseOf(isDone)}
        segments={PHASES}
        onValueChange={choose}
        label='Indicator state'
        className='w-full max-w-[13rem]'
      />
    </div>
  );
}
