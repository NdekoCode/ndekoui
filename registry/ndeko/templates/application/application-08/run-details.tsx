'use client';

import { MotionNumber } from '@/components/core/motion-number';
import {
  elapsedOf,
  formatDuration,
  formatTokens,
} from '@/registry/ndeko/lib/agent-run';
import {
  ListChecksIcon,
  LoaderIcon,
  MinusIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { Progress } from '@/registry/ndeko/ui/progress';

import {
  callSeedOf,
  CONTEXT_LIMIT,
  modelOf,
  planSeedOf,
  type ModelId,
} from './data';
import type {
  CallRun,
  CallStatus,
  PlanRun,
  Stage,
  StepStatus,
  Tokens,
} from './session';

/** Under a dollar a cost keeps three decimals, as in the rest of the kit. */
const COST_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

const STATUS_WORD: Record<Stage, string> = {
  idle: 'No run yet',
  thinking: 'Thinking',
  working: 'Working',
  asking: 'Waiting on you',
  answering: 'Writing the answer',
  done: 'Done',
  declined: 'Stopped at the request',
  stopped: 'Stopped',
};

const SECTION_TITLE = 'text-muted-foreground text-xs font-medium';

const MARK_BOX = 'flex size-4 shrink-0 items-center justify-center';

function StepMark({ status }: { status: StepStatus }) {
  if (status === 'upcoming') {
    return (
      <span className={MARK_BOX}>
        <span className='bg-muted-foreground/40 size-1.5 rounded-full' />
        <span className='sr-only'>To do</span>
      </span>
    );
  }
  if (status === 'skipped') {
    return (
      <span className={MARK_BOX}>
        <MinusIcon className='text-muted-foreground size-4' />
        <span className='sr-only'>Skipped</span>
      </span>
    );
  }
  return <CallStatusMark status={status} />;
}

function titleToneOf(status: StepStatus) {
  if (status === 'skipped') {
    return 'text-muted-foreground line-through';
  }
  if (status === 'upcoming') {
    return 'text-muted-foreground';
  }
  return undefined;
}

function PlanClock({ run }: { run: PlanRun }) {
  if (run.status === 'running') {
    return (
      <LiveDuration
        item={run}
        isRunning
        className='text-muted-foreground w-10 shrink-0 text-end text-xs'
      />
    );
  }
  if (run.status === 'done') {
    const elapsed = elapsedOf(run, run.endedAt ?? 0);
    return (
      <span className='text-muted-foreground w-10 shrink-0 text-end text-xs tabular-nums'>
        {formatDuration(elapsed)}
      </span>
    );
  }
  return null;
}

function PlanSection({ plan, stage }: { plan: PlanRun[]; stage: Stage }) {
  const isPlanning = plan.length === 0 && stage === 'thinking';
  const doneCount = plan.filter((run) => run.status === 'done').length;

  return (
    <section className='flex flex-col gap-1.5'>
      <h3 className={cn(SECTION_TITLE, 'flex items-center gap-1.5')}>
        Plan
        {plan.length > 0 && (
          <span className='tabular-nums'>
            {doneCount} of {plan.length}
          </span>
        )}
      </h3>
      {isPlanning && (
        <p className='text-muted-foreground flex h-8 items-center gap-2 text-[13px]'>
          <LoaderIcon className='size-4 animate-spin' />
          Making a plan
        </p>
      )}
      <ol aria-label='Plan' className='flex flex-col'>
        {plan.map((run) => (
          <li
            key={run.id}
            className='flex h-8 items-center gap-2 text-[13px] transition-opacity duration-300 starting:opacity-0'
          >
            <StepMark status={run.status} />
            <span
              className={cn('min-w-0 flex-1 truncate', titleToneOf(run.status))}
            >
              {planSeedOf(run.id).title}
            </span>
            <PlanClock run={run} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function CallMark({ status }: { status: CallStatus }) {
  if (status === 'skipped') {
    return (
      <span className={MARK_BOX}>
        <MinusIcon className='text-muted-foreground size-4' />
        <span className='sr-only'>Skipped</span>
      </span>
    );
  }
  return <CallStatusMark status={status} />;
}

function CallRow({ call }: { call: CallRun }) {
  const seed = callSeedOf(call.id);
  const total = seed.inputTokens + seed.outputTokens;

  return (
    <li className='flex items-center gap-2.5 py-1 transition-opacity duration-300 starting:opacity-0'>
      <BrandTile brand={seed.brand} size='lg' title={seed.product} />
      <span className='flex min-w-0 flex-1 flex-col leading-tight'>
        <span className='truncate text-[13px]'>{seed.title}</span>
        <span className='text-muted-foreground truncate text-xs tabular-nums'>
          {seed.product}, {formatTokens(total)} tokens
        </span>
      </span>
      <CallMark status={call.status} />
    </li>
  );
}

function CallsSection({ calls }: { calls: CallRun[] }) {
  const isEmpty = calls.length === 0;

  return (
    <section className='flex flex-col gap-1.5'>
      <h3 className={cn(SECTION_TITLE, 'flex items-center gap-1.5')}>
        Calls
        {!isEmpty && <span className='tabular-nums'>{calls.length}</span>}
      </h3>
      {isEmpty && (
        <p className='text-muted-foreground text-xs leading-5'>
          The tools the assistant uses are listed here, with what each one cost
          in tokens.
        </p>
      )}
      <ul aria-label='Tool calls' className='flex flex-col'>
        {calls.map((call) => (
          <CallRow key={call.id} call={call} />
        ))}
      </ul>
    </section>
  );
}

type UsageSectionProps = {
  tokens: Tokens;
  costUsd: number;
  model: ModelId;
};

function UsageSection({ tokens, costUsd, model }: UsageSectionProps) {
  const total = tokens.input + tokens.output;
  const contextShare = (total * 100) / CONTEXT_LIMIT;
  const option = modelOf(model);

  return (
    <section className='flex flex-col gap-2.5'>
      <h3 className={SECTION_TITLE}>Usage</h3>
      <div className='bg-foreground/[0.04] flex flex-col gap-3 rounded-lg p-3'>
        <div className='flex items-end justify-between gap-3'>
          <div className='flex min-w-0 flex-col gap-0.5'>
            <span className='text-muted-foreground text-xs'>Cost</span>
            <MotionNumber
              value={costUsd}
              format={COST_FORMAT}
              className='text-2xl leading-8 font-semibold'
            />
          </div>
          <Badge variant='secondary'>Illustrative</Badge>
        </div>
        <dl className='grid grid-cols-2 gap-3 text-xs'>
          <div className='flex flex-col gap-0.5'>
            <dt className='text-muted-foreground'>Tokens in</dt>
            <dd className='text-[13px] font-medium tabular-nums'>
              {formatTokens(tokens.input)}
            </dd>
          </div>
          <div className='flex flex-col gap-0.5'>
            <dt className='text-muted-foreground'>Tokens out</dt>
            <dd className='text-[13px] font-medium tabular-nums'>
              {formatTokens(tokens.output)}
            </dd>
          </div>
        </dl>
        <Progress value={contextShare} aria-label='Context window used' />
        <p className='text-muted-foreground flex items-center justify-between gap-2 text-xs tabular-nums'>
          <span>
            {formatTokens(total)} of {formatTokens(CONTEXT_LIMIT)} context
          </span>
          <span className='flex items-center gap-1.5'>
            <BrandTile brand={option.brand} size='sm' />
            {option.name}
          </span>
        </p>
      </div>
    </section>
  );
}

export type RunDetailsProps = {
  stage: Stage;
  plan: PlanRun[];
  calls: CallRun[];
  tokens: Tokens;
  costUsd: number;
  runModel: ModelId;
  hasRun: boolean;
  emptyLine: string;
  className?: string;
};

export function RunDetails({
  stage,
  plan,
  calls,
  tokens,
  costUsd,
  runModel,
  hasRun,
  emptyLine,
  className,
}: RunDetailsProps) {
  const status = STATUS_WORD[stage];

  return (
    <div className={cn('flex min-h-0 flex-col gap-4', className)}>
      <header className='flex items-center gap-2.5'>
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
        >
          <ListChecksIcon className='size-3.5' />
        </span>
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h2 className='truncate text-sm font-medium'>Run details</h2>
          {hasRun && (
            <Swap swapKey={status} className='text-muted-foreground text-xs'>
              {status}
            </Swap>
          )}
        </div>
      </header>
      <div className='-mx-1.5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-1.5'>
        {!hasRun && (
          <p className='text-muted-foreground text-[13px] leading-relaxed'>
            {emptyLine}
          </p>
        )}
        {hasRun && (
          <>
            <PlanSection plan={plan} stage={stage} />
            <CallsSection calls={calls} />
            <UsageSection tokens={tokens} costUsd={costUsd} model={runModel} />
          </>
        )}
      </div>
    </div>
  );
}
