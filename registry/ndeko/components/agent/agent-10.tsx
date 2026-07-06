'use client';

import { AnimatePresence, motion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  emptyRun,
  type AgentStatus as AgentState,
  type RunAgent,
} from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import {
  applyBatchAt,
  batch,
  reduceBatch,
  restingOf,
  type RunStep,
} from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import {
  AGENT_STATES,
  AGENT_STATUS_WORD,
  AgentStatus,
  pulsingIdsOf,
} from './_parts/agent-status';
import { AgentTile } from './_parts/agent-tile';
import { CODER, PLANNER, RESEARCHER, REVIEWER, WRITER } from './_parts/crew';
import { useAgentAnnouncement } from './_parts/use-agent-announcement';

export {
  AGENT_STATUS_WORD,
  AgentStatus,
  AgentStatusDot,
  AgentStatusMark,
  type AgentStatusProps,
} from './_parts/agent-status';

const TASK_SWAP = {
  initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -4, filter: 'blur(2px)' },
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
} as const;

const TASK_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function taskMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return TASK_FADE;
  }
  return TASK_SWAP;
}

function TaskLine({ task }: { task: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const taskMotion = taskMotionOf(shouldReduceMotion);

  return (
    <span className='text-muted-foreground relative block min-w-0 text-xs leading-5'>
      <AnimatePresence initial={false} mode='popLayout'>
        <motion.span key={task} className='block truncate' {...taskMotion}>
          {task}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type SummaryPart = {
  key: string;
  count: number;
  words: string[];
};

const SUMMARY_PARTS: { status: AgentState; words: string[] }[] = [
  { status: 'running', words: ['running'] },
  { status: 'waiting', words: ['waiting', 'on', 'you'] },
  { status: 'failed', words: ['failed'] },
];

function countWithStatus(agents: RunAgent[], status: AgentState) {
  const matching = agents.filter((agent) => agent.status === status);
  return matching.length;
}

function summaryPartsOf(agents: RunAgent[]) {
  const parts: SummaryPart[] = [];
  for (const part of SUMMARY_PARTS) {
    const count = countWithStatus(agents, part.status);
    if (count > 0) {
      parts.push({ key: part.status, count, words: part.words });
    }
  }
  return parts;
}

function withTrailingComma(words: string[]) {
  const last = words.length - 1;
  return words.map((word, index) => {
    if (index === last) {
      return `${word},`;
    }
    return word;
  });
}

function settledWordsOf(agents: RunAgent[]): WordRollWord[] {
  const doneCount = countWithStatus(agents, 'done');
  const isAllDone = doneCount === agents.length;
  if (isAllDone) {
    return ['All', 'done'];
  }
  return ['All', 'idle'];
}

function summaryWordsOf(agents: RunAgent[]): WordRollWord[] {
  const parts = summaryPartsOf(agents);
  if (parts.length === 0) {
    return settledWordsOf(agents);
  }
  const words: WordRollWord[] = [];
  const lastIndex = parts.length - 1;
  parts.forEach((part, index) => {
    const countWord = {
      key: `${part.key}-count`,
      text: String(part.count),
      node: <MotionNumber value={part.count} />,
    };
    words.push(countWord);
    const isLast = index === lastIndex;
    if (isLast) {
      words.push(...part.words);
      return;
    }
    const wordsWithComma = withTrailingComma(part.words);
    words.push(...wordsWithComma);
  });
  return words;
}

export type AgentRosterProps = {
  title: string;
  agents: RunAgent[];
  className?: string;
};

export function AgentRoster({ title, agents, className }: AgentRosterProps) {
  const summaryWords = summaryWordsOf(agents);
  const pulsingIds = pulsingIdsOf(agents);

  return (
    <section
      aria-label={title}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-2 rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex items-baseline justify-between gap-3 px-2 pt-1.5'>
        <h3 className='text-sm font-medium'>{title}</h3>
        <span className='text-muted-foreground text-xs'>
          <WordRoll words={summaryWords} />
        </span>
      </header>
      <ul aria-label='Agents' className='flex flex-col'>
        {agents.map((agent) => (
          <li
            key={agent.id}
            className='flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5'
          >
            <AgentTile name={agent.name} series={agent.series} />
            <div className='min-w-0 flex-1'>
              <p className='text-[13px] leading-5 font-medium'>{agent.name}</p>
              <TaskLine task={agent.task ?? ''} />
            </div>
            <AgentStatus
              status={agent.status}
              reserveWidth
              isStill={!pulsingIds.has(agent.id)}
              className='shrink-0'
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A legend names the states, it runs nothing: its running mark holds still. */
export function AgentStatusLegend({ className }: { className?: string }) {
  return (
    <ul
      aria-label='What each state means'
      className={cn('flex flex-wrap gap-x-4 gap-y-2', className)}
    >
      {AGENT_STATES.map((state) => (
        <li key={state}>
          <AgentStatus status={state} isStill />
        </li>
      ))}
    </ul>
  );
}

function update(
  after: number,
  id: string,
  status: AgentState,
  task: string
): RunStep {
  return batch(after, { type: 'agent.updated', id, patch: { status, task } });
}

const ROSTER: RunAgent[] = [
  { ...PLANNER, status: 'running', task: 'Splitting the review into tasks' },
  { ...RESEARCHER, task: 'Waits for a brief' },
  { ...CODER, task: 'Waits for the price lists' },
  { ...WRITER, task: 'Waits for the findings' },
  { ...REVIEWER, task: 'Waits for a draft' },
];

const INITIAL_RUN = emptyRun({ id: 'crew-status', agents: ROSTER });

/**
 * The round stops while the review is still under way, with one agent in each of the five states:
 * that is the picture the crew rests on, under reduced motion too.
 */
const SCRIPT: RunStep[] = [
  update(1400, 'researcher', 'running', 'Collecting vendor price lists'),
  update(1400, 'planner', 'waiting', 'Asks to raise the budget to $40'),
  update(2600, 'planner', 'running', 'Budget raised, tracking progress'),
  update(1200, 'researcher', 'done', 'Found 14 vendors with prices'),
  update(200, 'coder', 'running', 'Comparing invoices with list prices'),
  update(1600, 'writer', 'running', 'Drafting the credit request'),
  update(1600, 'coder', 'failed', 'The invoice sheet lacks a SKU column'),
  update(1400, 'planner', 'waiting', 'Asks if items may be matched by name'),
];

const SESSION = {
  reducer: reduceBatch,
  initial: INITIAL_RUN,
  resting: restingOf(INITIAL_RUN, SCRIPT, applyBatchAt),
  script: SCRIPT,
  loopAfter: 3200,
};

function announcementOf(agent: RunAgent) {
  const word = AGENT_STATUS_WORD[agent.status];
  return `${agent.name}: ${word}. ${agent.task ?? ''}`;
}

export default function Agent10() {
  const { ref, isInView, isAutoplaying, state, isFinished, restart } =
    useSession(SESSION);
  const agents = state.agents;
  const message = useAgentAnnouncement(agents, announcementOf);
  const canReplay = isFinished && !isAutoplaying;

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[23.5rem] w-full max-w-[26rem] flex-col gap-3'
    >
      <ClockGate isActive={isInView}>
        <AgentRoster title='Brightmoor review crew' agents={agents} />
      </ClockGate>
      <AgentStatusLegend className='px-2' />
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton
          isShown={canReplay}
          onReplay={restart}
          label='Replay the crew'
        />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, message)} />
    </div>
  );
}
