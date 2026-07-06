'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  useRunScript,
  type RunScriptStep,
} from '@/registry/ndeko/hooks/use-agent-run';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  elapsedOf,
  emptyRun,
  formatDuration,
  type CallStatus,
  type PlanStep,
  type RunEvent,
  type RunSnapshot,
  type StepStatus,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  BrainIcon,
  ChevronDownIcon,
  CircleDashedIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { nounOf, wordsOf } from '@/registry/ndeko/lib/words';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { StreamedWords } from '@/registry/ndeko/ui/streamed-text';

import { LabTile } from './_parts/lab-tile';

export type ThinkingSite = {
  id: string;
  site: string;
};

const SEARCH_TOOL = 'web_search';

const STEP_AS_CALL: Record<Exclude<StepStatus, 'skipped'>, CallStatus> = {
  upcoming: 'queued',
  running: 'running',
  done: 'done',
  failed: 'failed',
};

function StepGlyph({ status }: { status: StepStatus }) {
  if (status === 'skipped') {
    return (
      <span className='inline-flex size-4 shrink-0'>
        <CircleDashedIcon className='text-muted-foreground size-4' />
        <span className='sr-only'>Skipped</span>
      </span>
    );
  }
  return <CallStatusMark status={STEP_AS_CALL[status]} />;
}

function isThinkingStatus(run: RunSnapshot) {
  const isIdle = run.status === 'idle';
  const isRunning = run.status === 'running';
  return isIdle || isRunning;
}

function siteCallsOf(run: RunSnapshot) {
  return run.calls.filter((call) => call.tool === SEARCH_TOOL);
}

function toolCallOf(run: RunSnapshot) {
  return run.calls.find((call) => call.tool !== SEARCH_TOOL);
}

function siteOf(sites: ThinkingSite[], call: ToolCall) {
  return sites.find((site) => site.id === call.id);
}

function thoughtWordsOf(run: RunSnapshot) {
  if (isThinkingStatus(run)) {
    return 'Thinking';
  }
  const end = run.endedAt ?? run.startedAt ?? 0;
  const elapsed = elapsedOf(run, end);
  const duration = formatDuration(elapsed);
  if (run.status === 'cancelled') {
    return `Thought for ${duration}, answered early`;
  }
  return `Thought for ${duration}`;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function stepTitleOf(step: PlanStep) {
  if (step.id !== 'search') {
    return step.title;
  }
  if (step.status === 'running') {
    return 'Searching';
  }
  return 'Searched';
}

function compareCallOf(step: PlanStep, call: ToolCall | undefined) {
  if (step.id !== 'compare') {
    return undefined;
  }
  return call;
}

type SearchRowProps = {
  calls: ToolCall[];
  sites: ThinkingSite[];
};

function SearchRow({ calls, sites }: SearchRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const tileMotion = tileMotionOf(shouldReduceMotion);
  const count = calls.length;
  const noun = nounOf(count, 'source');

  return (
    <span className='flex min-w-0 flex-wrap items-center gap-1.5 ps-6'>
      <ul aria-label='Sources found' className='flex items-center gap-1'>
        <AnimatePresence initial={false}>
          {calls.map((call) => {
            const site = siteOf(sites, call);
            if (!site) {
              return null;
            }
            return (
              <motion.li key={call.id} className='flex' {...tileMotion}>
                <CompanyMark seed={site.site} size='sm' />
                <span className='sr-only'>{site.site}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      <span className='text-muted-foreground text-xs'>
        <MotionNumber value={count} /> {noun}
      </span>
    </span>
  );
}

const TILE_ENTER = {
  initial: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6 },
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
} as const;

const TILE_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function tileMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return TILE_FADE;
  }
  return TILE_ENTER;
}

function ToolRow({ call }: { call: ToolCall }) {
  const isRunning = call.status === 'running';

  return (
    <span className='flex min-w-0 items-baseline gap-2 ps-6 text-xs'>
      <span className='text-muted-foreground shrink-0 font-mono'>
        {call.tool}
      </span>
      <span className='text-foreground/80 min-w-0 truncate'>{call.label}</span>
      <LiveDuration
        item={call}
        isRunning={isRunning}
        className='text-muted-foreground ms-auto shrink-0'
      />
    </span>
  );
}

type ReasoningRowProps = {
  words: string[];
  shown: number;
  isStreaming: boolean;
};

/** While it streams, the oldest lines fade under a mask so the newest one stays in view. */
function ReasoningRow({ words, shown, isStreaming }: ReasoningRowProps) {
  return (
    <div className='ps-6'>
      <div
        className={cn(
          'text-muted-foreground flex flex-col justify-end text-[13px] leading-relaxed',
          reasoningFrameOf(isStreaming)
        )}
      >
        <p>
          <StreamedWords
            words={words}
            shown={shown}
            isStreaming={isStreaming}
            keepsPlace={false}
          />
        </p>
      </div>
    </div>
  );
}

function reasoningFrameOf(isStreaming: boolean) {
  if (isStreaming) {
    return 'max-h-[4.6lh] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_45%)]';
  }
  return '';
}

type ThinkingStepRowProps = {
  step: PlanStep;
  run: RunSnapshot;
  sites: ThinkingSite[];
  reasoningWords: string[];
};

function ThinkingStepRow({
  step,
  run,
  sites,
  reasoningWords,
}: ThinkingStepRowProps) {
  const siteCalls = siteCallsOf(run);
  const compareCall = compareCallOf(step, toolCallOf(run));
  const isSearch = step.id === 'search';
  const isReason = step.id === 'reason';
  const hasSites = siteCalls.length > 0;
  const showsSearch = isSearch && hasSites;
  const shownReasoning = run.usage.outputTokens;
  const hasReasoning = shownReasoning > 0;
  const showsReasoning = isReason && hasReasoning;
  const isStreaming = step.status === 'running';

  return (
    <li className='flex flex-col gap-1.5'>
      <span className='flex items-center gap-2 text-[13px]'>
        <Swap swapKey={step.status} className='size-4 shrink-0'>
          <StepGlyph status={step.status} />
        </Swap>
        <span className='min-w-0 truncate'>{stepTitleOf(step)}</span>
      </span>
      <AnimatedSize>
        {showsSearch && <SearchRow calls={siteCalls} sites={sites} />}
        {compareCall && <ToolRow call={compareCall} />}
        {showsReasoning && (
          <ReasoningRow
            words={reasoningWords}
            shown={shownReasoning}
            isStreaming={isStreaming}
          />
        )}
      </AnimatedSize>
    </li>
  );
}

export type ThinkingBlockProps = {
  run: RunSnapshot;
  sites: ThinkingSite[];
  reasoning: string;
  onAnswerNow?: () => void;
  className?: string;
};

export function ThinkingBlock({
  run,
  sites,
  reasoning,
  onAnswerNow,
  className,
}: ThinkingBlockProps) {
  const isThinking = isThinkingStatus(run);
  const [openChoice, setOpenChoice] = useState<boolean | null>(null);
  const [wasThinking, setWasThinking] = useState(isThinking);
  const panelId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const buttonMotion = buttonMotionOf(shouldReduceMotion);
  const reasoningWords = wordsOf(reasoning);
  const headline = thoughtWordsOf(run);
  const hasStarted = run.startedAt !== undefined;
  const showsClock = isThinking && hasStarted;
  const canAnswerNow = isThinking && onAnswerNow !== undefined;

  if (wasThinking !== isThinking) {
    setWasThinking(isThinking);
    setOpenChoice(null);
  }

  const isOpen = openChoice ?? isThinking;

  function toggle() {
    setOpenChoice(!isOpen);
  }

  return (
    <div
      className={cn(
        'bg-foreground/[0.03] dark:bg-foreground/[0.05] rounded-xl p-1.5',
        className
      )}
    >
      <div className='flex items-center gap-2'>
        <button
          type='button'
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={toggle}
          className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 text-start text-[13px] outline-none focus-visible:ring-[3px]'
        >
          <BrainIcon className='text-muted-foreground size-4 shrink-0' />
          <span
            className={cn(
              'min-w-0 truncate font-medium',
              isThinking && 'animate-pulse'
            )}
          >
            <WordRoll text={headline} />
          </span>
          {showsClock && (
            <LiveDuration
              item={run}
              isRunning={isThinking}
              className='text-muted-foreground text-xs'
            />
          )}
          <ChevronDownIcon
            className={cn(
              'text-muted-foreground ms-auto size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
              chevronTurnOf(isOpen)
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {canAnswerNow && (
            <motion.span key='answer-now' className='flex' {...buttonMotion}>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={onAnswerNow}
              >
                Answer now
              </Button>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <Fold open={isOpen} id={panelId}>
        <ol className='flex flex-col gap-2.5 px-2 pt-1.5 pb-2'>
          {run.plan.map((step) => (
            <ThinkingStepRow
              key={step.id}
              step={step}
              run={run}
              sites={sites}
              reasoningWords={reasoningWords}
            />
          ))}
        </ol>
      </Fold>
    </div>
  );
}

const BUTTON_ENTER = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] },
} as const;

const BUTTON_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function buttonMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return BUTTON_FADE;
  }
  return BUTTON_ENTER;
}

const QUESTION = 'Which supplier is cheapest for 50 pallets a month?';

const SITES: ThinkingSite[] = [
  { id: 'brightmoor', site: 'brightmoor-supply.example' },
  { id: 'harbourline', site: 'harbourline-freight.example' },
  { id: 'northgate', site: 'northgate-freight.example' },
  { id: 'palletwatch', site: 'palletwatch.example' },
  { id: 'freightdesk', site: 'freightdesk.example' },
];

const REASONING =
  'Fifty pallets a month sits above the 40 pallet line, so Brightmoor bills its flat 18.40 EUR. Harbourline still uses tiers, and 50 pallets land in tier two at 15.60 EUR. Northgate quotes 17.10 EUR flat but adds a 60 EUR monthly fee, which comes to 1.20 EUR on each of the 50 pallets. Harbourline stays the cheapest, Northgate and Brightmoor end up close.';

const ANSWER =
  'Harbourline is the cheapest for 50 pallets a month, at 780 EUR. Northgate comes to 915 EUR once its monthly fee is added, and Brightmoor to 920 EUR with its flat fee of 18.40 EUR per pallet.';

const PLAN: PlanStep[] = [
  { id: 'question', title: 'Read the question', status: 'upcoming' },
  { id: 'search', title: 'Search', status: 'upcoming' },
  { id: 'compare', title: 'Compare the price lists', status: 'upcoming' },
  { id: 'reason', title: 'Work out the cheapest', status: 'upcoming' },
];

const THINKING_RUN = emptyRun({
  id: 'thinking',
  title: 'Thinking',
  plan: PLAN,
});

const ANSWER_RUN = emptyRun({ id: 'answer', title: 'Answer' });

const SITE_MS = 340;

const REASON_WORD_MS = 60;

const ANSWER_WORD_MS = 45;

function stepEvent(id: string, status: StepStatus): RunEvent {
  return { type: 'step.updated', id, patch: { status } };
}

function thinkingScriptOf(): RunScriptStep[] {
  const steps: RunScriptStep[] = [
    { after: 400, event: { type: 'run.started' } },
    { after: 0, event: stepEvent('question', 'running') },
    { after: 500, event: stepEvent('question', 'done') },
    { after: 0, event: stepEvent('search', 'running') },
  ];
  for (const site of SITES) {
    steps.push({
      after: SITE_MS,
      event: {
        type: 'call.started',
        call: {
          id: site.id,
          tool: SEARCH_TOOL,
          label: site.site,
          status: 'done',
        },
      },
    });
  }
  steps.push({ after: 200, event: stepEvent('search', 'done') });
  steps.push({ after: 0, event: stepEvent('compare', 'running') });
  steps.push({
    after: 0,
    event: {
      type: 'call.started',
      call: {
        id: 'compare',
        tool: 'compare_prices',
        label: 'Compared 3 price lists for 50 pallets',
        status: 'running',
        input: { pallets: 50, suppliers: 3 },
      },
    },
  });
  steps.push({
    after: 1300,
    event: { type: 'call.updated', id: 'compare', patch: { status: 'done' } },
  });
  steps.push({ after: 0, event: stepEvent('compare', 'done') });
  steps.push({ after: 0, event: stepEvent('reason', 'running') });
  const reasoningWords = wordsOf(REASONING);
  for (let index = 0; index < reasoningWords.length; index += 1) {
    steps.push({
      after: REASON_WORD_MS,
      event: { type: 'usage.added', outputTokens: 1 },
    });
  }
  steps.push({ after: 0, event: stepEvent('reason', 'done') });
  steps.push({ after: 0, event: { type: 'run.finished', status: 'done' } });
  return steps;
}

function answerScriptOf(): RunScriptStep[] {
  const steps: RunScriptStep[] = [
    { after: 250, event: { type: 'run.started' } },
  ];
  const answerWords = wordsOf(ANSWER);
  for (let index = 0; index < answerWords.length; index += 1) {
    steps.push({
      after: ANSWER_WORD_MS,
      event: { type: 'usage.added', outputTokens: 1 },
    });
  }
  steps.push({ after: 0, event: { type: 'run.finished', status: 'done' } });
  return steps;
}

const THINKING_SCRIPT = thinkingScriptOf();

const ANSWER_SCRIPT = answerScriptOf();

const ANSWER_WORDS = wordsOf(ANSWER);

function hasThinkingEnded(run: RunSnapshot) {
  const isDone = run.status === 'done';
  const isCancelled = run.status === 'cancelled';
  return isDone || isCancelled;
}

function announcementOf(thinking: RunSnapshot, answer: RunSnapshot) {
  if (answer.status === 'done') {
    return 'Answer ready';
  }
  if (answer.status === 'running') {
    return `${thoughtWordsOf(thinking)}. Answering`;
  }
  const running = thinking.plan.find((step) => step.status === 'running');
  if (running?.id === 'search') {
    return 'Searching sources';
  }
  if (running?.id === 'reason') {
    return 'Reasoning';
  }
  if (thinking.status === 'running') {
    return 'Thinking';
  }
  return '';
}

export default function Answer04() {
  const [isCut, setIsCut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.3 });
  const isThinkingActive = isInView && !isCut;
  const thinking = useRunScript(THINKING_SCRIPT, {
    initial: THINKING_RUN,
    isActive: isThinkingActive,
  });
  const hasEnded = hasThinkingEnded(thinking.snapshot);
  const isAnswerActive = isInView && hasEnded;
  const answer = useRunScript(ANSWER_SCRIPT, {
    initial: ANSWER_RUN,
    isActive: isAnswerActive,
  });
  const answerShown = answer.snapshot.usage.outputTokens;
  const isAnswering = answer.snapshot.status === 'running';
  const hasAnswer = answerShown > 0;
  const canReplay = answer.isFinished;
  const announcement = announcementOf(thinking.snapshot, answer.snapshot);

  function answerNow() {
    const snapshot = thinking.store.getSnapshot();
    const unfinished = snapshot.plan.filter((step) => {
      const isUpcoming = step.status === 'upcoming';
      const isRunning = step.status === 'running';
      return isUpcoming || isRunning;
    });
    for (const step of unfinished) {
      thinking.store.dispatch(stepEvent(step.id, 'skipped'));
    }
    const runningCalls = snapshot.calls.filter(
      (call) => call.status === 'running'
    );
    for (const call of runningCalls) {
      thinking.store.dispatch({
        type: 'call.updated',
        id: call.id,
        patch: { status: 'done' },
      });
    }
    thinking.store.dispatch({ type: 'run.finished', status: 'cancelled' });
    setIsCut(true);
  }

  function replay() {
    setIsCut(false);
    thinking.restart();
    answer.restart();
  }

  useKeptHeight(rootRef);

  return (
    <div
      ref={rootRef}
      className='bg-card hairline-ring ring-border flex w-full max-w-[34rem] flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex justify-end'>
        <p className='bg-foreground/[0.05] dark:bg-foreground/[0.07] max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed text-balance'>
          {QUESTION}
        </p>
      </div>
      <div className='flex items-start gap-2.5'>
        <LabTile lab='anthropic' className='mt-1.5' />
        <div className='flex min-w-0 flex-1 flex-col gap-3'>
          <ClockGate isActive={isInView}>
            <ThinkingBlock
              run={thinking.snapshot}
              sites={SITES}
              reasoning={REASONING}
              onAnswerNow={answerNow}
            />
          </ClockGate>
          <AnimatedSize>
            {hasAnswer && (
              <p className='text-sm leading-relaxed'>
                <StreamedWords
                  words={ANSWER_WORDS}
                  shown={answerShown}
                  isStreaming={isAnswering}
                  keepsPlace={false}
                />
              </p>
            )}
          </AnimatedSize>
        </div>
      </div>
      <div className='-mt-2 flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={replay} label='Ask again' />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
