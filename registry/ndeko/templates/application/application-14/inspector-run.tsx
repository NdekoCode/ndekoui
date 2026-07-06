'use client';

import { formatCost } from '@/registry/ndeko/lib/agent-run';
import { Badge } from '@/registry/ndeko/ui/badge';
import { JsonView } from '@/registry/ndeko/ui/json-view';

import type { Step } from './model';
import { exchangeOf, hasRun, WORD_MS, type Run, type StepRun } from './run';
import { StateMark, stateWordsOf } from './state-mark';
import { StreamedText } from './stream';
import { capitalized } from './words';

const NOTE = 'text-muted-foreground text-[13px] leading-relaxed';

const SECTION = 'flex flex-col gap-1.5';

const SECTION_TITLE = 'text-muted-foreground text-xs font-medium';

function isSettled(stepRun: StepRun) {
  return stepRun.status === 'done' || stepRun.status === 'denied';
}

type StepOutputProps = {
  step: Step;
  run: Run;
  stepRun: StepRun;
  isActive: boolean;
};

/**
 * What the step gave. An agent that writes prose shows its text, word by word while it streams.
 * Any other step shows its result once it has one.
 */
function StepOutput({ step, run, stepRun, isActive }: StepOutputProps) {
  const { text, output } = exchangeOf(run, step);
  const isStreaming = run.streamingId === step.id;
  const hasResult = isSettled(stepRun);
  const isReadable = isStreaming || hasResult;

  if (stepRun.status === 'failed' || stepRun.status === 'retrying') {
    return (
      <p className='text-destructive-ink text-[13px] leading-relaxed'>
        The first try failed. The step is trying once more
      </p>
    );
  }
  if (stepRun.status === 'waiting') {
    return <p className={NOTE}>It waits for your answer on the canvas</p>;
  }
  if (text !== null && isReadable) {
    return (
      <p className='bg-foreground/[0.03] dark:bg-foreground/[0.05] rounded-lg p-2.5 text-[13px] leading-relaxed'>
        <StreamedText
          key={run.token}
          text={text}
          isStreaming={isStreaming}
          isActive={isActive}
          wordMs={WORD_MS}
        />
      </p>
    );
  }
  if (!hasResult) {
    return <p className={NOTE}>Still at work</p>;
  }
  return <JsonView value={output} />;
}

type LastRunPanelProps = {
  step: Step;
  run: Run;
  /** False off screen: a text that streams holds its place. */
  isActive: boolean;
};

export function LastRunPanel({ step, run, isActive }: LastRunPanelProps) {
  const stepRun = run.steps[step.id];

  if (!hasRun(run) || !stepRun) {
    return (
      <p className={NOTE}>
        This step has not run yet. Test run sends a sample email through the
        flow
      </p>
    );
  }
  if (stepRun.status === 'skipped') {
    return (
      <p className={NOTE}>
        Skipped in the last run: the run did not come this way
      </p>
    );
  }

  const exchange = exchangeOf(run, step);
  const hasCost = stepRun.usd > 0;
  const state = stateWordsOf(stepRun);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]'>
        <StateMark stepRun={stepRun} />
        <span className='min-w-0 flex-1'>{capitalized(state)}</span>
        {hasCost && (
          <span className='text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums'>
            <span className='sr-only'>Cost</span>
            {formatCost(stepRun.usd)}
            <Badge variant='secondary'>Illustrative</Badge>
          </span>
        )}
      </div>
      <section className={SECTION}>
        <h3 className={SECTION_TITLE}>Input</h3>
        <JsonView value={exchange.input} />
      </section>
      <section className={SECTION}>
        <h3 className={SECTION_TITLE}>Output</h3>
        <StepOutput
          step={step}
          run={run}
          stepRun={stepRun}
          isActive={isActive}
        />
      </section>
    </div>
  );
}
