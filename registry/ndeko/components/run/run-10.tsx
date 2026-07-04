'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { TextShimmer } from '@/components/core/text-shimmer';
import { seriesColorOf, type RunAgent } from '@/registry/ndeko/lib/agent-run';
import {
  ArrowUpIcon,
  CircleXIcon,
  FeatherIcon,
  LightbulbIcon,
  RotateCcwIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import {
  EASE_OUT_STRONG,
  INSTANT,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

export type HealthSignal = {
  id: string;
  label: string;
  value: number;
  format: Intl.NumberFormatOptions;
  suffix?: string;
  /** The range this signal should stay in, in words: "95% or more". */
  target: string;
  /** Same count of points in every period, so the line morphs from one to the next. */
  points: number[];
  isOutOfRange: boolean;
};

export type HealthReport = {
  score: number;
  change: number;
  changeLabel: string;
  signals: HealthSignal[];
};

export type SummaryStatus =
  'idle' | 'thinking' | 'streaming' | 'done' | 'stopped';

export type ActionStatus = 'idle' | 'pending' | 'failed' | 'done';

export type HealthAction = {
  title: string;
  reason: string;
  doneLine: string;
  errorLine: string;
};

const GAUGE_WIDTH = 120;

const GAUGE_HEIGHT = 66;

const GAUGE_ARC = 'M 12 60 A 48 48 0 0 1 108 60';

const SPARK_WIDTH = 72;

const SPARK_HEIGHT = 24;

const SPARK_PADDING = 2;

const PATH_MORPH = { duration: 0.45, ease: EASE_OUT_STRONG };

function gaugeToneOf(score: number) {
  if (score >= 80) {
    return 'stroke-success';
  }
  if (score >= 60) {
    return 'stroke-warning';
  }
  return 'stroke-destructive';
}

function changeToneOf(change: number) {
  if (change < 0) {
    return 'text-destructive-ink';
  }
  return 'text-success-foreground';
}

function changeTurnOf(change: number) {
  if (change < 0) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function signedChangeOf(change: number) {
  const magnitude = Math.abs(change);
  if (change < 0) {
    return `down ${magnitude}`;
  }
  return `up ${magnitude}`;
}

function HealthGauge({ report }: { report: HealthReport }) {
  const dashOffset = 100 - report.score;
  const spokenChange = signedChangeOf(report.change);
  const spoken = `Health ${report.score} out of 100, ${spokenChange} ${report.changeLabel}`;
  const magnitude = Math.abs(report.change);

  return (
    <div
      role='meter'
      aria-label='Agent health'
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={report.score}
      aria-valuetext={spoken}
      className='relative mx-auto w-44'
    >
      <svg
        aria-hidden='true'
        viewBox={`0 0 ${GAUGE_WIDTH} ${GAUGE_HEIGHT}`}
        className='w-full'
      >
        <path
          d={GAUGE_ARC}
          pathLength={100}
          fill='none'
          strokeWidth={8}
          strokeLinecap='round'
          className='stroke-foreground/[0.07]'
        />
        <path
          d={GAUGE_ARC}
          pathLength={100}
          fill='none'
          strokeWidth={8}
          strokeLinecap='round'
          strokeDasharray='100 100'
          strokeDashoffset={dashOffset}
          className={cn(
            'transition-[stroke-dashoffset,stroke] duration-500 ease-(--ease-out-strong)',
            gaugeToneOf(report.score)
          )}
        />
      </svg>
      <div className='absolute inset-x-0 bottom-0 flex flex-col items-center'>
        <MotionNumber value={report.score} className='text-3xl font-semibold' />
        <span
          className={cn(
            'flex items-center gap-1 text-xs transition-colors duration-200',
            changeToneOf(report.change)
          )}
        >
          <ArrowUpIcon
            className={cn(
              'size-3 transition-transform duration-300 ease-(--ease-out-strong)',
              changeTurnOf(report.change)
            )}
          />
          <MotionNumber value={magnitude} />
          <span className='text-muted-foreground'>{report.changeLabel}</span>
        </span>
      </div>
    </div>
  );
}

const SPARK_INNER_HEIGHT = SPARK_HEIGHT - SPARK_PADDING * 2;

function pathCommandOf(index: number) {
  if (index === 0) {
    return 'M';
  }
  return 'L';
}

/** Each line is scaled to its own period, so the shape reads even when the values sit close together. */
function sparkPathOf(points: number[]) {
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    min = Math.min(min, point);
    max = Math.max(max, point);
  }
  const spread = max - min;
  const range = Math.max(spread, 0.0001);
  const gaps = Math.max(points.length - 1, 1);
  const step = SPARK_WIDTH / gaps;
  const commands: string[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const x = index * step;
    const share = (points[index] - min) / range;
    const drop = SPARK_INNER_HEIGHT * (1 - share);
    const y = SPARK_PADDING + drop;
    const command = pathCommandOf(index);
    commands.push(`${command} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return commands.join(' ');
}

function sparkToneOf(isOutOfRange: boolean) {
  if (isOutOfRange) {
    return 'stroke-warning';
  }
  return 'stroke-muted-foreground';
}

function Sparkline({ signal }: { signal: HealthSignal }) {
  const shouldReduceMotion = useReducedMotion();
  const path = sparkPathOf(signal.points);
  const transition = morphOf(shouldReduceMotion);

  return (
    <svg
      aria-hidden='true'
      width={SPARK_WIDTH}
      height={SPARK_HEIGHT}
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      className='shrink-0 overflow-visible'
    >
      <motion.path
        initial={false}
        animate={{ d: path }}
        transition={transition}
        fill='none'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
        className={cn(
          'transition-[stroke] duration-200',
          sparkToneOf(signal.isOutOfRange)
        )}
      />
    </svg>
  );
}

function morphOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return PATH_MORPH;
}

function SignalRow({ signal }: { signal: HealthSignal }) {
  const statusKey = String(signal.isOutOfRange);

  return (
    <li className='flex items-center gap-3 py-1.5'>
      <div className='min-w-0 flex-1'>
        <p className='text-muted-foreground truncate text-xs'>{signal.label}</p>
        <MotionNumber
          value={signal.value}
          format={signal.format}
          suffix={signal.suffix}
          className='text-[13px] font-medium'
        />
      </div>
      <Sparkline signal={signal} />
      <span className='flex size-6 shrink-0 items-center justify-center'>
        <Swap swapKey={statusKey}>
          {signal.isOutOfRange && <StatusOrb tone='warning' size='sm' />}
          {!signal.isOutOfRange && (
            <span className='bg-foreground/15 size-1.5 rounded-full' />
          )}
        </Swap>
      </span>
      <span className='sr-only'>
        {signalStatusWordOf(signal)}, target {signal.target}
      </span>
    </li>
  );
}

function signalStatusWordOf(signal: HealthSignal) {
  if (signal.isOutOfRange) {
    return 'out of range';
  }
  return 'in range';
}

function wordsOf(text: string) {
  return text.split(' ');
}

type SummaryProps = {
  status: SummaryStatus;
  text: string;
  shownWords: number;
  onGenerate?: () => void;
  onStop?: () => void;
};

function SummaryPanel({
  status,
  text,
  shownWords,
  onGenerate,
  onStop,
}: SummaryProps) {
  const words = wordsOf(text);
  const visibleWords = words.slice(0, shownWords);
  const isIdle = status === 'idle';
  const isThinking = status === 'thinking';
  const isStreaming = status === 'streaming';
  const isStopped = status === 'stopped';
  const isDone = status === 'done';
  const hasWords = visibleWords.length > 0;
  const canRetry = isStopped || isDone;

  return (
    <div className='bg-foreground/[0.03] flex flex-col gap-2 rounded-lg p-3'>
      <div className='flex min-h-7 items-center justify-between gap-2'>
        <span className='text-xs font-medium'>Summary</span>
        <Swap swapKey={status}>
          {isStreaming && (
            <Button type='button' variant='ghost' size='sm' onClick={onStop}>
              <span className='bg-foreground size-2 rounded-[2px]' />
              Stop
            </Button>
          )}
          {canRetry && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={onGenerate}
              className='text-muted-foreground'
            >
              <RotateCcwIcon />
              Write again
            </Button>
          )}
        </Swap>
      </div>
      <AnimatedSize>
        {isIdle && (
          <div className='flex flex-col items-start gap-2'>
            <p className='text-muted-foreground text-xs leading-5'>
              A short reading of the five signals for this period.
            </p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={onGenerate}
            >
              <FeatherIcon />
              Generate summary
            </Button>
          </div>
        )}
        {isThinking && (
          <TextShimmer as='p' className='text-[13px]'>
            Reading the signals
          </TextShimmer>
        )}
        {hasWords && (
          <p className='text-[13px] leading-5'>
            {visibleWords.map((word, index) => (
              <span
                key={index}
                className='transition-opacity duration-200 starting:opacity-0'
              >
                {word}{' '}
              </span>
            ))}
          </p>
        )}
        {isStopped && (
          <p className='text-muted-foreground mt-1 text-xs'>
            Stopped before the end
          </p>
        )}
      </AnimatedSize>
    </div>
  );
}

function applyStateOf(status: ActionStatus): MorphState {
  if (status === 'pending') {
    return 'busy';
  }
  if (status === 'done') {
    return 'done';
  }
  return 'idle';
}

function applyLabelsOf(status: ActionStatus): Record<MorphState, string> {
  if (status === 'failed') {
    return { idle: 'Retry', busy: 'Applying', done: 'Applied' };
  }
  return { idle: 'Apply', busy: 'Applying', done: 'Applied' };
}

function ActionCard({
  action,
  status,
  onApply,
}: {
  action: HealthAction;
  status: ActionStatus;
  onApply?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isFailed = status === 'failed';
  const isDone = status === 'done';

  return (
    <div className='bg-foreground/[0.03] flex flex-col rounded-lg p-3'>
      <div className='flex items-start gap-3'>
        <span className='keycap-3d text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md'>
          <LightbulbIcon className='size-3.5' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='text-[13px] font-medium text-balance'>{action.title}</p>
          <p className='text-muted-foreground mt-0.5 text-xs leading-5'>
            {action.reason}
          </p>
        </div>
        <MorphButton
          type='button'
          size='sm'
          state={applyStateOf(status)}
          labels={applyLabelsOf(status)}
          onClick={onApply}
        />
      </div>
      <AnimatePresence initial={false}>
        {isFailed && (
          <motion.p
            key='failed'
            className='text-destructive-ink overflow-hidden text-xs'
            {...rowPresence}
          >
            <span className='flex items-center gap-1.5 ps-10 pt-2'>
              <CircleXIcon className='size-3.5 shrink-0' />
              {action.errorLine}
            </span>
          </motion.p>
        )}
        {isDone && (
          <motion.p
            key='done'
            className='text-muted-foreground overflow-hidden text-xs'
            {...rowPresence}
          >
            <span className='block ps-10 pt-2'>{action.doneLine}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export type AgentHealthProps = {
  agent: Pick<RunAgent, 'name' | 'series' | 'model'>;
  report: HealthReport;
  periodSwitch?: React.ReactNode;
  summary: { status: SummaryStatus; text: string; shownWords: number };
  onGenerateSummary?: () => void;
  onStopSummary?: () => void;
  action: HealthAction;
  actionStatus: ActionStatus;
  onApplyAction?: () => void;
  className?: string;
};

export function AgentHealth({
  agent,
  report,
  periodSwitch,
  summary,
  onGenerateSummary,
  onStopSummary,
  action,
  actionStatus,
  onApplyAction,
  className,
}: AgentHealthProps) {
  const titleId = useId();
  const chipColor = seriesColorOf(agent.series);

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <h3 id={titleId} className='sr-only'>
            {agent.name} health
          </h3>
          <Chip color={chipColor}>{agent.name}</Chip>
          {agent.model && (
            <span className='text-muted-foreground truncate text-xs'>
              {agent.model}
            </span>
          )}
          <Badge variant='secondary'>Illustrative</Badge>
        </div>
        {periodSwitch}
      </header>
      <HealthGauge report={report} />
      <ul aria-label='Signals' className='flex flex-col'>
        {report.signals.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </ul>
      <SummaryPanel
        status={summary.status}
        text={summary.text}
        shownWords={summary.shownWords}
        onGenerate={onGenerateSummary}
        onStop={onStopSummary}
      />
      <ActionCard
        action={action}
        status={actionStatus}
        onApply={onApplyAction}
      />
    </section>
  );
}

type PeriodId = 'week' | 'month';

const PERIODS: Segment<PeriodId>[] = [
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
];

const ONE_DECIMAL: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

const CENTS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

const REPORTS: Record<PeriodId, HealthReport> = {
  week: {
    score: 71,
    change: -9,
    changeLabel: 'since last week',
    signals: [
      {
        id: 'success',
        label: 'Success rate',
        value: 91.2,
        format: ONE_DECIMAL,
        suffix: '%',
        target: '95% or more',
        points: [
          96, 95.8, 96.2, 95.1, 94.6, 93.9, 93.1, 92.4, 91.8, 91.5, 90.9, 91.2,
        ],
        isOutOfRange: true,
      },
      {
        id: 'latency',
        label: 'Median latency',
        value: 3.4,
        format: ONE_DECIMAL,
        suffix: 's',
        target: '4s or less',
        points: [3.1, 3.2, 3, 3.3, 3.2, 3.5, 3.4, 3.6, 3.3, 3.5, 3.4, 3.4],
        isOutOfRange: false,
      },
      {
        id: 'cost',
        label: 'Cost per run',
        value: 0.042,
        format: CENTS,
        target: '$0.050 or less',
        points: [
          0.038, 0.039, 0.04, 0.039, 0.041, 0.042, 0.04, 0.043, 0.042, 0.041,
          0.043, 0.042,
        ],
        isOutOfRange: false,
      },
      {
        id: 'escalations',
        label: 'Escalations',
        value: 7,
        format: WHOLE,
        target: '5 or fewer',
        points: [0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 2, 0],
        isOutOfRange: true,
      },
      {
        id: 'errors',
        label: 'Tool errors',
        value: 4.8,
        format: ONE_DECIMAL,
        suffix: '%',
        target: '3% or less',
        points: [1.9, 2.1, 2, 2.6, 3.1, 3.4, 3.9, 4.2, 4.6, 4.4, 5.1, 4.8],
        isOutOfRange: true,
      },
    ],
  },
  month: {
    score: 86,
    change: 4,
    changeLabel: 'since last month',
    signals: [
      {
        id: 'success',
        label: 'Success rate',
        value: 95.6,
        format: ONE_DECIMAL,
        suffix: '%',
        target: '95% or more',
        points: [
          94.8, 95.2, 95.9, 96.3, 96.1, 96.6, 96.4, 96.8, 96.2, 95.7, 94.1,
          93.2,
        ],
        isOutOfRange: false,
      },
      {
        id: 'latency',
        label: 'Median latency',
        value: 3.1,
        format: ONE_DECIMAL,
        suffix: 's',
        target: '4s or less',
        points: [3.3, 3.2, 3.1, 3, 3.1, 2.9, 3, 3.1, 3, 3.2, 3.3, 3.4],
        isOutOfRange: false,
      },
      {
        id: 'cost',
        label: 'Cost per run',
        value: 0.039,
        format: CENTS,
        target: '$0.050 or less',
        points: [
          0.041, 0.04, 0.039, 0.038, 0.038, 0.037, 0.038, 0.039, 0.038, 0.039,
          0.041, 0.042,
        ],
        isOutOfRange: false,
      },
      {
        id: 'escalations',
        label: 'Escalations',
        value: 3,
        format: WHOLE,
        target: '5 or fewer',
        points: [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 2, 2],
        isOutOfRange: false,
      },
      {
        id: 'errors',
        label: 'Tool errors',
        value: 2.4,
        format: ONE_DECIMAL,
        suffix: '%',
        target: '3% or less',
        points: [2.2, 2, 1.9, 1.8, 1.9, 1.7, 1.8, 1.9, 2.1, 2.6, 3.8, 4.8],
        isOutOfRange: false,
      },
    ],
  },
};

const SUMMARIES: Record<PeriodId, string> = {
  week: 'Success fell to 91% this week, mostly on Brightmoor pricing pages that time out after 8 seconds. Tool errors rose to 4.8% and escalations to 7, both from that same fetch step. Latency and cost stay inside their targets. A longer fetch timeout should recover most of the failed runs.',
  month:
    'Over 30 days the Researcher stays healthy: 95.6% of runs succeed, the median run takes 3.1 seconds and costs about 4 cents. The only drift is the last week, where page fetches started to time out. Tool errors are the signal to watch over the next days.',
};

const ACTION: HealthAction = {
  title: 'Raise the timeout of fetch_page to 20s',
  reason: 'Most failed runs this week stop at the 8s limit on pricing pages.',
  doneLine: 'Timeout set to 20s. The next runs use it.',
  errorLine: 'The settings service did not answer. Nothing was changed.',
};

const RESEARCHER_AGENT: Pick<RunAgent, 'name' | 'series' | 'model'> = {
  name: 'Researcher',
  series: 2,
  model: 'Lumen',
};

const THINK_MS = 1100;

const WORD_MS = 55;

const APPLY_MS = 900;

type SummaryState = {
  status: SummaryStatus;
  shownWords: number;
};

const IDLE_SUMMARY: SummaryState = { status: 'idle', shownWords: 0 };

function summaryAnnouncementOf(status: SummaryStatus) {
  if (status === 'thinking') {
    return 'Writing the summary';
  }
  if (status === 'done') {
    return 'Summary ready';
  }
  if (status === 'stopped') {
    return 'Summary stopped';
  }
  return '';
}

function actionAnnouncementOf(status: ActionStatus) {
  if (status === 'pending') {
    return 'Applying the change';
  }
  if (status === 'failed') {
    return 'The change failed, nothing was changed';
  }
  if (status === 'done') {
    return 'The change is applied';
  }
  return '';
}

function announcementOf(
  summary: SummaryStatus,
  action: ActionStatus,
  fallback: string
) {
  const actionLine = actionAnnouncementOf(action);
  if (actionLine) {
    return actionLine;
  }
  const summaryLine = summaryAnnouncementOf(summary);
  if (summaryLine) {
    return summaryLine;
  }
  return fallback;
}

export default function Run10() {
  const [periodId, setPeriodId] = useState<PeriodId>('week');
  const [summaryState, setSummaryState] = useState<SummaryState>(IDLE_SUMMARY);
  const [actionStatus, setActionStatus] = useState<ActionStatus>('idle');
  const [attempts, setAttempts] = useState(0);
  const [periodLine, setPeriodLine] = useState('');
  const summaryTimers = useTimeouts();
  const actionTimers = useTimeouts();
  const report = REPORTS[periodId];
  const summaryText = SUMMARIES[periodId];
  const wordCount = wordsOf(summaryText).length;
  const announcement = announcementOf(
    summaryState.status,
    actionStatus,
    periodLine
  );

  function streamFrom(index: number) {
    if (index > wordCount) {
      setSummaryState({ status: 'done', shownWords: wordCount });
      return;
    }
    setSummaryState({ status: 'streaming', shownWords: index });
    summaryTimers.schedule(() => streamFrom(index + 1), WORD_MS);
  }

  function generateSummary() {
    summaryTimers.clearAll();
    setSummaryState({ status: 'thinking', shownWords: 0 });
    summaryTimers.schedule(() => streamFrom(1), THINK_MS);
  }

  function stopSummary() {
    summaryTimers.clearAll();
    setSummaryState((current) => ({ ...current, status: 'stopped' }));
  }

  function changePeriod(next: PeriodId) {
    summaryTimers.clearAll();
    setSummaryState(IDLE_SUMMARY);
    setPeriodId(next);
    const nextReport = REPORTS[next];
    setPeriodLine(`Health ${nextReport.score} ${nextReport.changeLabel}`);
  }

  function applyAction() {
    const isBusy = actionStatus === 'pending';
    const isDone = actionStatus === 'done';
    if (isBusy || isDone) {
      return;
    }
    const isFirstTry = attempts === 0;
    setAttempts((current) => current + 1);
    setActionStatus('pending');
    actionTimers.schedule(() => {
      if (isFirstTry) {
        setActionStatus('failed');
        return;
      }
      setActionStatus('done');
    }, APPLY_MS);
  }

  return (
    <div className='flex w-full max-w-[34rem] flex-col gap-2'>
      <AgentHealth
        agent={RESEARCHER_AGENT}
        report={report}
        periodSwitch={
          <Segments
            value={periodId}
            segments={PERIODS}
            onValueChange={changePeriod}
            label='Period'
          />
        }
        summary={{
          status: summaryState.status,
          text: summaryText,
          shownWords: summaryState.shownWords,
        }}
        onGenerateSummary={generateSummary}
        onStopSummary={stopSummary}
        action={ACTION}
        actionStatus={actionStatus}
        onApplyAction={applyAction}
      />
      <LiveRegion message={announcement} />
    </div>
  );
}
