'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  emptyRun,
  type AgentStatus as AgentState,
  type ApprovalRequest,
  type RunAgent,
} from '@/registry/ndeko/lib/agent-run';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { risePresenceOf, springOf } from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { AgentActions, pendingApprovalOf } from './_parts/agent-actions';
import { AGENT_STATUS_WORD, AgentStatus } from './_parts/agent-status';
import { AgentTile } from './_parts/agent-tile';
import { CostFigure } from './_parts/cost-figure';
import { focusLater } from './_parts/focus-later';
import { CODER, PLANNER, RESEARCHER, REVIEWER, WRITER } from './_parts/crew';
import { useAgentAnnouncement } from './_parts/use-agent-announcement';
import { countOf } from './_parts/words';

export type FleetView = 'rows' | 'cards';

export type FleetFilter = 'all' | 'needs-you' | 'failed';

type FleetEntry = {
  agent: RunAgent;
  subAgents: RunAgent[];
  spend: number;
};

const VIEWS: Segment<FleetView>[] = [
  { value: 'rows', label: 'Rows' },
  { value: 'cards', label: 'Cards' },
];

const FILTER_LABEL: Record<FleetFilter, string> = {
  all: 'All',
  'needs-you': 'Needs you',
  failed: 'Failed',
};

const FILTERS: FleetFilter[] = ['all', 'needs-you', 'failed'];

const EMPTY_LINE: Record<FleetFilter, string> = {
  all: 'No agents are running',
  'needs-you': 'Nothing waits on you right now',
  failed: 'No agent has failed',
};

const ROW_GRID: React.CSSProperties = {
  gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
  gridTemplateAreas: "'tile title figures toggle' 'tile meta figures toggle'",
};

const CARD_GRID: React.CSSProperties = {
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  gridTemplateAreas:
    "'tile title toggle' 'meta meta meta' 'figures figures figures'",
};

const LIST_SURFACE: Record<FleetView, string> = {
  rows: 'm-0 bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
  cards: 'rounded-xl',
};

const LIST_LAYOUT: Record<FleetView, string> = {
  rows: 'flex flex-col gap-0.5 p-0.5',
  cards: 'grid grid-cols-1 gap-3 @md:grid-cols-2',
};

const QUICK_EXIT = { duration: 0.14 };

const CARD_PRESENCE = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98, transition: QUICK_EXIT },
};

const FADE_ONLY = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: QUICK_EXIT },
};

function itemPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_ONLY;
  }
  return CARD_PRESENCE;
}

const ITEM_CLASS: Record<FleetView, string> = {
  rows: 'rounded-lg px-2 py-2',
  cards:
    'bg-card hairline-ring ring-border rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
};

const FIGURES_CLASS: Record<FleetView, string> = {
  rows: 'flex flex-col items-end text-end',
  cards: 'flex items-baseline justify-between gap-3 pt-1',
};

const SUB_LIST_CLASS: Record<FleetView, string> = {
  rows: 'ps-9',
  cards: 'ps-0',
};

function isMainAgent(agent: RunAgent) {
  return agent.parentId === undefined;
}

function costOf(agent: RunAgent) {
  return agent.costUsd ?? 0;
}

function totalCostOf(agents: RunAgent[]) {
  let total = 0;
  for (const agent of agents) {
    total += costOf(agent);
  }
  return total;
}

function spendOf(agent: RunAgent, subAgents: RunAgent[]) {
  const ownCost = costOf(agent);
  const subAgentCost = totalCostOf(subAgents);
  return ownCost + subAgentCost;
}

function entriesOf(agents: RunAgent[]): FleetEntry[] {
  const mainAgents = agents.filter(isMainAgent);
  return mainAgents.map((agent) => {
    const subAgents = agents.filter(
      (candidate) => candidate.parentId === agent.id
    );
    const spend = spendOf(agent, subAgents);
    return { agent, subAgents, spend };
  });
}

function membersOf(entry: FleetEntry) {
  return [entry.agent, ...entry.subAgents];
}

function needsPerson(entry: FleetEntry, approvals: ApprovalRequest[]) {
  const members = membersOf(entry);
  return members.some((member) => {
    const pending = pendingApprovalOf(approvals, member.id);
    return pending !== undefined;
  });
}

function hasFailure(entry: FleetEntry) {
  const members = membersOf(entry);
  return members.some((member) => member.status === 'failed');
}

function matchesFilter(
  entry: FleetEntry,
  filter: FleetFilter,
  approvals: ApprovalRequest[]
) {
  if (filter === 'needs-you') {
    return needsPerson(entry, approvals);
  }
  if (filter === 'failed') {
    return hasFailure(entry);
  }
  return true;
}

function countWithStatus(agents: RunAgent[], status: AgentState) {
  const matching = agents.filter((agent) => agent.status === status);
  return matching.length;
}

function pendingCountOf(approvals: ApprovalRequest[]) {
  const pending = approvals.filter((approval) => approval.status === 'pending');
  return pending.length;
}

function attentionOf(entry: FleetEntry, approvals: ApprovalRequest[]) {
  const waitingSubAgents = entry.subAgents.filter((subAgent) => {
    const pending = pendingApprovalOf(approvals, subAgent.id);
    return pending !== undefined;
  });
  const failedCount = countWithStatus(entry.subAgents, 'failed');
  if (waitingSubAgents.length > 0) {
    const waitingWord = countOf(waitingSubAgents.length, 'sub-agent');
    return { tone: 'text-warning-foreground', text: `${waitingWord} waiting` };
  }
  if (failedCount > 0) {
    const failedWord = countOf(failedCount, 'sub-agent');
    return { tone: 'text-destructive-ink', text: `${failedWord} failed` };
  }
  return null;
}

function isLiveAgent(agent: RunAgent) {
  const isRunning = agent.status === 'running';
  const isWaiting = agent.status === 'waiting';
  return isRunning || isWaiting;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function toggleLabelOf(entry: FleetEntry, isOpen: boolean) {
  const subAgents = countOf(entry.subAgents.length, 'sub-agent');
  if (isOpen) {
    return `Hide the ${subAgents} of ${entry.agent.name}`;
  }
  return `Show the ${subAgents} of ${entry.agent.name}`;
}

function AgentClock({ agent }: { agent: RunAgent }) {
  const hasStarted = agent.startedAt !== undefined;
  if (!hasStarted) {
    return <span>Not started</span>;
  }
  return <LiveDuration item={agent} isRunning={isLiveAgent(agent)} />;
}

type SubAgentListProps = {
  owner: RunAgent;
  subAgents: RunAgent[];
  approvals: ApprovalRequest[];
  onApprove?: (approvalId: string) => void;
  onRetry?: (agentId: string) => void;
};

function SubAgentList({
  owner,
  subAgents,
  approvals,
  onApprove,
  onRetry,
}: SubAgentListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  function focusRow(agentId: string) {
    focusLater(listRef, `[data-sub-agent="${agentId}"]`);
  }

  return (
    <ul
      ref={listRef}
      aria-label={`Sub-agents of ${owner.name}`}
      className='flex flex-col gap-1 pt-2'
    >
      {subAgents.map((subAgent) => (
        <li
          key={subAgent.id}
          tabIndex={-1}
          data-sub-agent={subAgent.id}
          className='bg-foreground/[0.025] dark:bg-foreground/[0.04] focus-visible:ring-ring/25 flex items-start gap-2.5 rounded-lg px-2.5 py-2 outline-none focus-visible:ring-[3px]'
        >
          <AgentTile
            name={subAgent.name}
            series={subAgent.series}
            size='sm'
            className='mt-px'
          />
          <div className='min-w-0 flex-1'>
            <p className='flex flex-wrap items-center gap-x-2'>
              <span className='text-[13px] leading-5 font-medium'>
                {subAgent.name}
              </span>
              <AgentStatus status={subAgent.status} size='sm' />
            </p>
            <p className='text-muted-foreground truncate text-xs leading-5'>
              {subAgent.task}
            </p>
            <AgentActions
              agent={subAgent}
              approvals={approvals}
              onApprove={onApprove}
              onRetry={onRetry}
              onDecided={focusRow}
            />
          </div>
          <div className='shrink-0 text-end text-xs leading-5'>
            <p>
              <CostFigure usd={costOf(subAgent)} />
            </p>
            <p className='text-muted-foreground tabular-nums'>
              <AgentClock agent={subAgent} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

type FleetItemProps = {
  entry: FleetEntry;
  view: FleetView;
  approvals: ApprovalRequest[];
  isOpen: boolean;
  onToggle: (agentId: string) => void;
  onApprove?: (approvalId: string) => void;
  onRetry?: (agentId: string) => void;
};

function gridOf(view: FleetView) {
  if (view === 'cards') {
    return CARD_GRID;
  }
  return ROW_GRID;
}

function FleetItem({
  entry,
  view,
  approvals,
  isOpen,
  onToggle,
  onApprove,
  onRetry,
}: FleetItemProps) {
  const panelId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const spring = springOf(shouldReduceMotion);
  const presence = itemPresenceOf(shouldReduceMotion);
  const { agent, subAgents } = entry;
  const hasSubAgents = subAgents.length > 0;
  const attention = attentionOf(entry, approvals);

  function toggle() {
    onToggle(agent.id);
  }

  return (
    <motion.li
      layout
      transition={{ layout: spring }}
      {...presence}
      className={cn(
        'transition-[background-color,box-shadow] duration-300 ease-(--ease-out-strong)',
        ITEM_CLASS[view]
      )}
    >
      <div className='grid items-start gap-x-3 gap-y-1' style={gridOf(view)}>
        <motion.span
          layout='position'
          transition={spring}
          className='[grid-area:tile]'
        >
          <AgentTile name={agent.name} series={agent.series} />
        </motion.span>
        <motion.p
          layout='position'
          transition={spring}
          className='flex min-w-0 items-baseline gap-2 [grid-area:title]'
        >
          <span className='truncate text-[13px] leading-6 font-medium'>
            {agent.name}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {agent.model}
          </span>
        </motion.p>
        <motion.div
          layout='position'
          transition={spring}
          className='flex min-w-0 flex-col gap-0.5 [grid-area:meta]'
        >
          <p className='text-foreground/85 line-clamp-2 text-xs leading-5'>
            {agent.task}
          </p>
          <p className='flex flex-wrap items-center gap-x-3 gap-y-0.5'>
            <AgentStatus status={agent.status} />
            {attention && (
              <span className={cn('text-xs', attention.tone)}>
                {attention.text}
              </span>
            )}
          </p>
        </motion.div>
        <motion.div
          layout='position'
          transition={spring}
          className={cn('text-[13px] [grid-area:figures]', FIGURES_CLASS[view])}
        >
          <span className='leading-6 font-medium'>
            <CostFigure usd={entry.spend} />
          </span>
          <span className='text-muted-foreground text-xs leading-5 tabular-nums'>
            <AgentClock agent={agent} />
          </span>
        </motion.div>
        <div className='[grid-area:toggle]'>
          {hasSubAgents && (
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={toggleLabelOf(entry, isOpen)}
              onClick={toggle}
              className='text-muted-foreground'
            >
              <ChevronDownIcon
                className={cn(
                  'transition-transform duration-200 ease-(--ease-out-strong)',
                  chevronTurnOf(isOpen)
                )}
              />
            </Button>
          )}
        </div>
      </div>
      {hasSubAgents && (
        <motion.div layout='position' transition={spring}>
          <Fold open={isOpen} id={panelId} className={SUB_LIST_CLASS[view]}>
            <SubAgentList
              owner={agent}
              subAgents={subAgents}
              approvals={approvals}
              onApprove={onApprove}
              onRetry={onRetry}
            />
          </Fold>
        </motion.div>
      )}
    </motion.li>
  );
}

function FleetTotal({
  label,
  children,
  note,
}: {
  label: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col gap-0.5 rounded-lg px-3 py-2.5'>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd className='text-lg leading-7 font-medium tabular-nums'>{children}</dd>
      {note && <dd className='text-muted-foreground text-[11px]'>{note}</dd>}
    </div>
  );
}

function changeFilter(
  values: unknown[],
  onFilterChange: (filter: FleetFilter) => void
) {
  const [next] = values;
  const filter = FILTERS.find((candidate) => candidate === next);
  if (filter) {
    onFilterChange(filter);
  }
}

const NO_APPROVALS: ApprovalRequest[] = [];

export type AgentFleetProps = {
  agents: RunAgent[];
  approvals?: ApprovalRequest[];
  /** What was spent today before these agents, added to theirs in the total. */
  earlierSpend?: number;
  onApprove?: (approvalId: string) => void;
  onRetry?: (agentId: string) => void;
  defaultView?: FleetView;
  className?: string;
};

export function AgentFleet({
  agents,
  approvals = NO_APPROVALS,
  earlierSpend = 0,
  onApprove,
  onRetry,
  defaultView = 'rows',
  className,
}: AgentFleetProps) {
  const [view, setView] = useState<FleetView>(defaultView);
  const [filter, setFilter] = useState<FleetFilter>('all');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const shouldReduceMotion = usePrefersReducedMotion();
  const risePresence = risePresenceOf(shouldReduceMotion);
  const entries = entriesOf(agents);
  const visibleEntries = entries.filter((entry) =>
    matchesFilter(entry, filter, approvals)
  );
  const isEmpty = visibleEntries.length === 0;
  const runningCount = countWithStatus(agents, 'running');
  const waitingCount = pendingCountOf(approvals);
  const failedCount = countWithStatus(agents, 'failed');
  const agentSpend = totalCostOf(agents);
  const spendToday = earlierSpend + agentSpend;

  function countFor(candidate: FleetFilter) {
    const matching = entries.filter((entry) =>
      matchesFilter(entry, candidate, approvals)
    );
    return matching.length;
  }

  function toggle(agentId: string) {
    setOpenIds((current) => ({ ...current, [agentId]: !current[agentId] }));
  }

  function showAll() {
    setFilter('all');
  }

  return (
    <section
      aria-label='Agent fleet'
      className={cn('@container flex flex-col gap-3', className)}
    >
      <dl className='grid grid-cols-2 gap-2 @md:grid-cols-4'>
        <FleetTotal label='Running'>
          <MotionNumber value={runningCount} />
        </FleetTotal>
        <FleetTotal label='Waiting on you'>
          <MotionNumber value={waitingCount} />
        </FleetTotal>
        <FleetTotal label='Failed'>
          <MotionNumber value={failedCount} />
        </FleetTotal>
        <FleetTotal label='Spend today' note='Illustrative'>
          <CostFigure usd={spendToday} />
        </FleetTotal>
      </dl>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <ToggleGroup
          aria-label='Show agents'
          value={[filter]}
          onValueChange={(values) => changeFilter(values, setFilter)}
          travel
          size='sm'
          className='gap-1'
        >
          {FILTERS.map((candidate) => (
            <ToggleGroupItem
              key={candidate}
              value={candidate}
              className='rounded-full px-3 text-xs'
            >
              {FILTER_LABEL[candidate]}
              <span className='text-muted-foreground tabular-nums'>
                <MotionNumber value={countFor(candidate)} />
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Segments
          value={view}
          segments={VIEWS}
          onValueChange={setView}
          label='Layout'
          className='w-32'
        />
      </div>
      <AnimatedSize
        className={cn(
          'transition-[background-color,box-shadow] duration-300 ease-(--ease-out-strong)',
          LIST_SURFACE[view],
          isEmpty && 'hidden'
        )}
      >
        <ul
          aria-label='Main agents'
          className={cn('relative', LIST_LAYOUT[view])}
        >
          <AnimatePresence mode='popLayout' initial={false}>
            {visibleEntries.map((entry) => (
              <FleetItem
                key={entry.agent.id}
                entry={entry}
                view={view}
                approvals={approvals}
                isOpen={openIds[entry.agent.id] === true}
                onToggle={toggle}
                onApprove={onApprove}
                onRetry={onRetry}
              />
            ))}
          </AnimatePresence>
        </ul>
      </AnimatedSize>
      <AnimatePresence initial={false}>
        {isEmpty && (
          <motion.div
            key={filter}
            className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col items-center gap-3 rounded-xl px-4 py-8 text-center'
            {...risePresence}
          >
            <p className='text-muted-foreground text-[13px]'>
              {EMPTY_LINE[filter]}
            </p>
            <Button type='button' variant='outline' size='sm' onClick={showAll}>
              Show all agents
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const MINUTE_MS = 60_000;

const LOADED_AT = Date.now();

function since(minutes: number) {
  return LOADED_AT - minutes * MINUTE_MS;
}

const FLEET: RunAgent[] = [
  {
    ...RESEARCHER,
    parentId: undefined,
    status: 'running',
    task: 'Watching competitor prices for the spring catalogue',
    costUsd: 0.412,
    startedAt: since(12),
  },
  {
    id: 'price-reader',
    name: 'Price reader',
    series: 2,
    status: 'running',
    model: 'Claude Haiku',
    parentId: RESEARCHER.id,
    task: 'Reading 6 product pages on Larkfield Goods',
    costUsd: 0.061,
    startedAt: since(3),
  },
  {
    id: 'feed-reader',
    name: 'Feed reader',
    series: 2,
    status: 'done',
    model: 'Claude Haiku',
    parentId: RESEARCHER.id,
    task: 'Read the Ostrava Supply price feed',
    costUsd: 0.034,
    startedAt: since(9),
    endedAt: since(7),
  },
  {
    ...WRITER,
    parentId: undefined,
    status: 'running',
    task: 'Writing the release notes for version 4.2',
    costUsd: 0.188,
    startedAt: since(4),
  },
  {
    ...CODER,
    parentId: undefined,
    status: 'running',
    task: 'Fixing the flaky checkout test',
    costUsd: 1.204,
    startedAt: since(21),
  },
  {
    id: 'test-runner',
    name: 'Test runner',
    series: 5,
    status: 'running',
    model: 'Claude Haiku',
    parentId: CODER.id,
    task: 'Running checkout.spec.ts 20 times',
    costUsd: 0.092,
    startedAt: since(2),
  },
  {
    id: 'log-reader',
    name: 'Log reader',
    series: 5,
    status: 'done',
    model: 'Claude Haiku',
    parentId: CODER.id,
    task: 'Found the timeout in the payment mock',
    costUsd: 0.047,
    startedAt: since(15),
    endedAt: since(11),
  },
  {
    ...REVIEWER,
    parentId: undefined,
    status: 'running',
    task: 'Checking the Fernhill Foods supply contract',
    costUsd: 0.356,
    startedAt: since(7),
  },
  {
    id: 'clause-finder',
    name: 'Clause finder',
    series: 4,
    status: 'running',
    model: 'Claude Sonnet',
    parentId: REVIEWER.id,
    task: 'Listing the renewal and penalty clauses',
    costUsd: 0.073,
    startedAt: since(5),
  },
  {
    ...PLANNER,
    status: 'done',
    task: 'Drafted the Q4 roadmap in 9 themes',
    costUsd: 0.884,
    startedAt: since(26),
    endedAt: since(2),
  },
];

const SHARE_APPROVAL: ApprovalRequest = {
  id: 'share-summary',
  title: 'Share the contract summary with legal@fernhill.example',
  risk: 'medium',
  status: 'pending',
  agentId: 'clause-finder',
};

const INITIAL_RUN = emptyRun({ id: 'fleet', agents: FLEET });

const EARLIER_SPEND = 9.42;

function patch(id: string, changes: Partial<RunAgent>): RunScriptStep['event'] {
  return { type: 'agent.updated', id, patch: changes };
}

const SCRIPT: RunScriptStep[] = [
  { after: 1600, event: patch('price-reader', { costUsd: 0.083 }) },
  {
    after: 1400,
    event: patch('test-runner', {
      status: 'failed',
      task: 'Run 7 of 20 timed out on the payment step',
      costUsd: 0.118,
    }),
  },
  {
    after: 1200,
    event: patch(CODER.id, {
      task: 'Waits for the test runner',
      costUsd: 1.231,
    }),
  },
  {
    after: 1500,
    event: patch(WRITER.id, {
      status: 'done',
      task: 'Release notes ready: 12 changes, 3 fixes',
      costUsd: 0.214,
    }),
  },
  {
    after: 1600,
    event: patch('clause-finder', {
      status: 'waiting',
      task: 'Wants to share its summary with legal',
      costUsd: 0.091,
    }),
  },
  {
    after: 0,
    event: { type: 'approval.requested', approval: SHARE_APPROVAL },
  },
  {
    after: 300,
    event: patch(REVIEWER.id, {
      status: 'waiting',
      task: 'Waits on the clause finder',
    }),
  },
  {
    after: 1800,
    event: patch('price-reader', {
      status: 'done',
      task: 'Read 6 product pages, 2 prices changed',
      costUsd: 0.104,
    }),
  },
  {
    after: 600,
    event: patch(RESEARCHER.id, {
      status: 'done',
      task: 'Found 2 price changes on Larkfield Goods',
      costUsd: 0.437,
    }),
  },
];

const RETRY_MS = 1800;

const SHARE_MS = 1400;

function announcementOf(agent: RunAgent) {
  const word = AGENT_STATUS_WORD[agent.status];
  return `${agent.name}: ${word}. ${agent.task ?? ''}`;
}

export default function Agent06() {
  const { schedule, clearAll } = useTimeouts();
  const { ref, isInView, snapshot, store, restart, isFinished } = useDemoRun(
    SCRIPT,
    { initial: INITIAL_RUN }
  );
  const agents = snapshot.agents;
  const message = useAgentAnnouncement(agents, announcementOf);

  function approve(approvalId: string) {
    store.dispatch({
      type: 'approval.resolved',
      id: approvalId,
      decision: 'approved',
    });
    store.dispatch(
      patch('clause-finder', {
        status: 'running',
        task: 'Sharing the summary with legal',
      })
    );
    store.dispatch(
      patch(REVIEWER.id, {
        status: 'running',
        task: 'Checking the Fernhill Foods supply contract',
      })
    );
    schedule(() => {
      store.dispatch(
        patch('clause-finder', {
          status: 'done',
          task: 'Shared the summary with legal',
          costUsd: 0.097,
        })
      );
    }, SHARE_MS);
  }

  function retry(agentId: string) {
    store.dispatch(
      patch(agentId, {
        status: 'running',
        task: 'Second try with a longer payment timeout',
        startedAt: undefined,
        endedAt: undefined,
      })
    );
    store.dispatch(patch(CODER.id, { task: 'Fixing the flaky checkout test' }));
    schedule(() => {
      store.dispatch(
        patch(agentId, {
          status: 'done',
          task: 'checkout.spec.ts passed 20 times in a row',
          costUsd: 0.141,
        })
      );
    }, RETRY_MS);
  }

  function replay() {
    clearAll();
    restart();
  }

  useKeptHeight(ref);

  return (
    <div ref={ref} className='flex w-full max-w-[44rem] flex-col gap-2'>
      <ClockGate isActive={isInView}>
        <AgentFleet
          agents={agents}
          approvals={snapshot.approvals}
          earlierSpend={EARLIER_SPEND}
          onApprove={approve}
          onRetry={retry}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={isFinished} onReplay={replay} />
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
