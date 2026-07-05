'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  emptyRun,
  formatCost,
  pendingApprovalsOf,
  type AgentStatus as AgentState,
  type ApprovalRequest,
  type RunAgent,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';

import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { AgentActions, pendingApprovalOf } from './_parts/agent-actions';
import { AGENT_STATUS_WORD, AgentStatusDot } from './_parts/agent-status';
import { AgentTile } from './_parts/agent-tile';
import { CostFigure } from './_parts/cost-figure';
import {
  CODER,
  PAGE_ERROR,
  PLANNER,
  RESEARCHER,
  RUN_TITLE,
  WRITER,
} from './_parts/crew';
import { focusLater } from './_parts/focus-later';
import { useAgentAnnouncement } from './_parts/use-agent-announcement';
import { countOf } from './_parts/words';

const INDENT_PX = 18;

const GUIDE_OFFSET_PX = 12;

type TreeRow = {
  agent: RunAgent;
  depth: number;
  position: number;
  setSize: number;
  parentId?: string;
  hasChildren: boolean;
  isFolded: boolean;
  subtreeCost: number;
  hidden: RunAgent[];
};

type Folded = Record<string, boolean>;

function idsOf(agents: RunAgent[]) {
  const ids = agents.map((agent) => agent.id);
  return new Set(ids);
}

function isRootOf(agent: RunAgent, ids: Set<string>) {
  if (!agent.parentId) {
    return true;
  }
  return !ids.has(agent.parentId);
}

function childrenOf(agents: RunAgent[], parentId: string) {
  return agents.filter((agent) => agent.parentId === parentId);
}

function descendantsOf(agents: RunAgent[], agentId: string) {
  const descendants: RunAgent[] = [];
  const children = childrenOf(agents, agentId);
  for (const child of children) {
    descendants.push(child);
    const deeper = descendantsOf(agents, child.id);
    descendants.push(...deeper);
  }
  return descendants;
}

function costOf(agent: RunAgent) {
  return agent.costUsd ?? 0;
}

function subtreeCostOf(agent: RunAgent, descendants: RunAgent[]) {
  let total = costOf(agent);
  for (const descendant of descendants) {
    total += costOf(descendant);
  }
  return total;
}

function hiddenOf(isFolded: boolean, descendants: RunAgent[]) {
  if (isFolded) {
    return descendants;
  }
  return [];
}

function appendRows(
  rows: TreeRow[],
  agents: RunAgent[],
  siblings: RunAgent[],
  depth: number,
  folded: Folded
) {
  siblings.forEach((agent, index) => {
    const children = childrenOf(agents, agent.id);
    const descendants = descendantsOf(agents, agent.id);
    const hasChildren = children.length > 0;
    const isFolded = folded[agent.id] === true;
    rows.push({
      agent,
      depth,
      position: index + 1,
      setSize: siblings.length,
      parentId: agent.parentId,
      hasChildren,
      isFolded,
      subtreeCost: subtreeCostOf(agent, descendants),
      hidden: hiddenOf(isFolded, descendants),
    });
    const showsChildren = hasChildren && !isFolded;
    if (showsChildren) {
      appendRows(rows, agents, children, depth + 1, folded);
    }
  });
}

function visibleRowsOf(agents: RunAgent[], folded: Folded) {
  const ids = idsOf(agents);
  const roots = agents.filter((agent) => isRootOf(agent, ids));
  const rows: TreeRow[] = [];
  appendRows(rows, agents, roots, 0, folded);
  return rows;
}

function countWithStatus(agents: RunAgent[], status: AgentState) {
  const matching = agents.filter((agent) => agent.status === status);
  return matching.length;
}

function foldedSummaryOf(hidden: RunAgent[]) {
  const inside = `${countOf(hidden.length, 'agent')} inside`;
  const waitingCount = countWithStatus(hidden, 'waiting');
  const failedCount = countWithStatus(hidden, 'failed');
  const notes: string[] = [];
  if (waitingCount > 0) {
    notes.push(`${waitingCount} waiting on you`);
  }
  if (failedCount > 0) {
    notes.push(`${failedCount} failed`);
  }
  if (notes.length === 0) {
    return inside;
  }
  const noteText = notes.join(', ');
  return `${inside}: ${noteText}`;
}

function taskToneOf(status: AgentState) {
  if (status === 'failed') {
    return 'text-destructive-ink';
  }
  if (status === 'waiting') {
    return 'text-warning-foreground';
  }
  return 'text-muted-foreground';
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-90';
  }
  return 'rotate-0';
}

function tabIndexOf(isTabbable: boolean) {
  if (isTabbable) {
    return 0;
  }
  return -1;
}

function expandedOf(row: TreeRow) {
  if (!row.hasChildren) {
    return undefined;
  }
  return !row.isFolded;
}

function tabbableIdOf(focusedId: string | null, rows: TreeRow[]) {
  const isVisible = rows.some((row) => row.agent.id === focusedId);
  if (isVisible) {
    return focusedId;
  }
  return rows[0]?.agent.id ?? null;
}

function isLiveAgent(agent: RunAgent) {
  const isRunning = agent.status === 'running';
  const isWaiting = agent.status === 'waiting';
  return isRunning || isWaiting;
}

function rowLabelOf(row: TreeRow) {
  const { agent } = row;
  const word = AGENT_STATUS_WORD[agent.status];
  const cost = formatCost(row.subtreeCost);
  const parts = [agent.name, word, agent.task ?? '', `${cost} for this branch`];
  if (row.isFolded) {
    parts.push(foldedSummaryOf(row.hidden));
  }
  return parts.join('. ');
}

function shortcutsOf(canApprove: boolean, canRetry: boolean) {
  if (canApprove) {
    return 'A';
  }
  if (canRetry) {
    return 'R';
  }
  return undefined;
}

function hintOf(canApprove: boolean, canRetry: boolean) {
  if (canApprove) {
    return 'Press A to approve';
  }
  if (canRetry) {
    return 'Press R to retry';
  }
  return '';
}

function describedByOf(hasHint: boolean, hintId: string) {
  if (hasHint) {
    return hintId;
  }
  return undefined;
}

function hasModifierKey(event: React.KeyboardEvent) {
  const hasCommandKey = event.metaKey || event.ctrlKey;
  return hasCommandKey || event.altKey;
}

function AgentClock({ agent }: { agent: RunAgent }) {
  const hasStarted = agent.startedAt !== undefined;
  if (!hasStarted) {
    return <span>Not started</span>;
  }
  return <LiveDuration item={agent} isRunning={isLiveAgent(agent)} />;
}

type TreeRowContentProps = {
  row: TreeRow;
  attempt: number;
  approvals: ApprovalRequest[];
  onApprove?: (approvalId: string) => void;
  onRetry?: (agentId: string) => void;
};

function TreeRowContent({
  row,
  attempt,
  approvals,
  onApprove,
  onRetry,
}: TreeRowContentProps) {
  const { agent } = row;
  const isOpen = !row.isFolded;
  const guides = Array.from({ length: row.depth }, (_, level) => level);
  const startPadding = row.depth * INDENT_PX + 4;
  const wasRetried = attempt > 1;
  const hasHidden = row.hidden.length > 0;
  const showsSummary = row.isFolded && hasHidden;

  return (
    <div
      className='relative flex items-start gap-1.5 py-2 pe-2.5'
      style={{ paddingInlineStart: startPadding }}
    >
      {guides.map((level) => (
        <span
          key={level}
          aria-hidden='true'
          className='bg-border absolute inset-y-0 w-px'
          style={{ insetInlineStart: level * INDENT_PX + GUIDE_OFFSET_PX }}
        />
      ))}
      <span className='flex size-4 shrink-0 items-center justify-center pt-1'>
        {row.hasChildren && (
          <ChevronRightIcon
            className={cn(
              'text-muted-foreground size-3.5 transition-transform duration-200 ease-(--ease-out-strong) rtl:-scale-x-100',
              chevronTurnOf(isOpen)
            )}
          />
        )}
      </span>
      <span className='relative mt-px shrink-0'>
        <AgentTile name={agent.name} series={agent.series} size='sm' />
        <AgentStatusDot
          status={agent.status}
          className='ring-card absolute -end-1 -bottom-1 rounded-full ring-2'
        />
      </span>
      <div className='min-w-0 flex-1 ps-1.5'>
        <p className='flex items-center gap-2'>
          <span className='truncate text-[13px] leading-5 font-medium'>
            {agent.name}
          </span>
          {wasRetried && <Badge variant='secondary'>Retried</Badge>}
        </p>
        <p
          className={cn('truncate text-xs leading-5', taskToneOf(agent.status))}
        >
          {agent.task}
        </p>
        <AnimatePresence initial={false}>
          {showsSummary && (
            <motion.p
              key='summary'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='text-muted-foreground text-xs leading-5'
            >
              {foldedSummaryOf(row.hidden)}
            </motion.p>
          )}
        </AnimatePresence>
        <AgentActions
          agent={agent}
          approvals={approvals}
          onApprove={onApprove}
          onRetry={onRetry}
          hasKeyHints
        />
      </div>
      <div className='shrink-0 text-end'>
        <p className='text-[13px] leading-5'>
          <CostFigure usd={row.subtreeCost} />
        </p>
        <p className='text-muted-foreground text-xs leading-5 tabular-nums'>
          <AgentClock agent={agent} />
        </p>
      </div>
    </div>
  );
}

function foldedRecordOf(agentIds: string[]): Folded {
  const folded: Folded = {};
  for (const agentId of agentIds) {
    folded[agentId] = true;
  }
  return folded;
}

const NO_APPROVALS: ApprovalRequest[] = [];

const NO_ATTEMPTS: Record<string, number> = {};

const NO_FOLDED: string[] = [];

export type AgentTreeProps = {
  agents: RunAgent[];
  approvals?: ApprovalRequest[];
  /** How many times each agent ran. From the second, its row says it was retried. */
  attempts?: Record<string, number>;
  onApprove?: (approvalId: string) => void;
  onRetry?: (agentId: string) => void;
  defaultFolded?: string[];
  label?: string;
  className?: string;
};

export function AgentTree({
  agents,
  approvals = NO_APPROVALS,
  attempts = NO_ATTEMPTS,
  onApprove,
  onRetry,
  defaultFolded = NO_FOLDED,
  label = 'Agents',
  className,
}: AgentTreeProps) {
  const [folded, setFolded] = useState<Folded>(() =>
    foldedRecordOf(defaultFolded)
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const treeRef = useRef<HTMLUListElement>(null);
  const hintPrefix = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const rows = visibleRowsOf(agents, folded);
  const tabbableId = tabbableIdOf(focusedId, rows);

  function focusRow(agentId: string) {
    setFocusedId(agentId);
    focusLater(treeRef, `[data-agent-row="${agentId}"]`);
  }

  function focusIndex(index: number) {
    const row = rows[index];
    if (row) {
      focusRow(row.agent.id);
    }
  }

  function setFold(agentId: string, isFolded: boolean) {
    setFolded((current) => ({ ...current, [agentId]: isFolded }));
  }

  function toggle(row: TreeRow) {
    if (row.hasChildren) {
      setFold(row.agent.id, !row.isFolded);
    }
  }

  function openOrEnter(row: TreeRow, index: number) {
    if (!row.hasChildren) {
      return;
    }
    if (row.isFolded) {
      setFold(row.agent.id, false);
      return;
    }
    focusIndex(index + 1);
  }

  function foldOrLeave(row: TreeRow) {
    const canFold = row.hasChildren && !row.isFolded;
    if (canFold) {
      setFold(row.agent.id, true);
      return;
    }
    if (row.parentId) {
      focusRow(row.parentId);
    }
  }

  function decide(row: TreeRow, key: string) {
    const pending = pendingApprovalOf(approvals, row.agent.id);
    const isFailed = row.agent.status === 'failed';
    if (key === 'a' && pending) {
      onApprove?.(pending.id);
      return true;
    }
    if (key === 'r' && isFailed) {
      onRetry?.(row.agent.id);
      return true;
    }
    return false;
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLLIElement>,
    row: TreeRow
  ) {
    const isOnRow = event.target === event.currentTarget;
    if (!isOnRow) {
      return;
    }
    const index = rows.findIndex(
      (candidate) => candidate.agent.id === row.agent.id
    );
    const key = event.key;
    if (key === 'ArrowDown') {
      event.preventDefault();
      focusIndex(index + 1);
      return;
    }
    if (key === 'ArrowUp') {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }
    if (key === 'Home') {
      event.preventDefault();
      focusIndex(0);
      return;
    }
    if (key === 'End') {
      event.preventDefault();
      focusIndex(rows.length - 1);
      return;
    }
    if (key === 'ArrowRight') {
      event.preventDefault();
      openOrEnter(row, index);
      return;
    }
    if (key === 'ArrowLeft') {
      event.preventDefault();
      foldOrLeave(row);
      return;
    }
    const isToggleKey = key === 'Enter' || key === ' ';
    if (isToggleKey) {
      event.preventDefault();
      toggle(row);
      return;
    }
    if (hasModifierKey(event)) {
      return;
    }
    const isDecided = decide(row, key.toLowerCase());
    if (isDecided) {
      event.preventDefault();
    }
  }

  return (
    <ul
      ref={treeRef}
      role='tree'
      aria-label={label}
      className={cn('flex flex-col', className)}
    >
      <AnimatePresence initial={false}>
        {rows.map((row) => {
          const agentId = row.agent.id;
          const pending = pendingApprovalOf(approvals, agentId);
          const canApprove = pending !== undefined;
          const canRetry = row.agent.status === 'failed';
          const hint = hintOf(canApprove, canRetry);
          const hintId = `${hintPrefix}-${agentId}`;
          const hasHint = hint !== '';

          return (
            <motion.li
              key={agentId}
              role='treeitem'
              aria-level={row.depth + 1}
              aria-setsize={row.setSize}
              aria-posinset={row.position}
              aria-expanded={expandedOf(row)}
              aria-label={rowLabelOf(row)}
              aria-describedby={describedByOf(hasHint, hintId)}
              aria-keyshortcuts={shortcutsOf(canApprove, canRetry)}
              tabIndex={tabIndexOf(agentId === tabbableId)}
              data-agent-row={agentId}
              onKeyDown={(event) => handleKeyDown(event, row)}
              onFocus={() => setFocusedId(agentId)}
              onClick={() => toggle(row)}
              className='group/row hover:bg-foreground/[0.025] focus-visible:ring-ring/25 overflow-hidden rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
              {...rowPresence}
            >
              <TreeRowContent
                row={row}
                attempt={attempts[agentId] ?? 1}
                approvals={approvals}
                onApprove={onApprove}
                onRetry={onRetry}
              />
              {hasHint && (
                <span id={hintId} className='sr-only'>
                  {hint}
                </span>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

const PAGE_READER: RunAgent = {
  id: 'page-reader',
  name: 'Page reader',
  series: 2,
  status: 'running',
  model: 'Claude Haiku',
  parentId: RESEARCHER.id,
  task: 'Reading brightmoor-supply.example/pricing',
};

const SHEET_READER: RunAgent = {
  id: 'sheet-reader',
  name: 'Sheet reader',
  series: 2,
  status: 'running',
  model: 'Claude Haiku',
  parentId: RESEARCHER.id,
  task: 'Reading q3-invoices.xlsx',
};

const CHECKER: RunAgent = {
  id: 'checker',
  name: 'Checker',
  series: 5,
  status: 'running',
  model: 'Claude Haiku',
  parentId: CODER.id,
  task: 'Trying compare_prices.py on 10 lines',
};

const SEND_APPROVAL: ApprovalRequest = {
  id: 'send-credit-request',
  title: 'Send the credit request to accounts@brightmoor-supply.example',
  risk: 'medium',
  status: 'pending',
  agentId: WRITER.id,
};

const INITIAL_RUN = emptyRun({
  id: 'brightmoor-tree',
  title: RUN_TITLE,
  agents: [{ ...PLANNER, task: 'Waits to start' }],
});

function patch(id: string, changes: Partial<RunAgent>): RunScriptStep['event'] {
  return { type: 'agent.updated', id, patch: changes };
}

function added(agent: RunAgent): RunScriptStep['event'] {
  return { type: 'agent.added', agent };
}

const SCRIPT: RunScriptStep[] = [
  { after: 400, event: { type: 'run.started' } },
  {
    after: 0,
    event: patch(PLANNER.id, {
      status: 'running',
      task: 'Splitting the review between three agents',
      costUsd: 0.006,
    }),
  },
  {
    after: 900,
    event: added({
      ...RESEARCHER,
      status: 'running',
      task: 'Collecting the price lists',
    }),
  },
  {
    after: 300,
    event: patch(PLANNER.id, { task: 'Watching the agents', costUsd: 0.011 }),
  },
  { after: 600, event: added(PAGE_READER) },
  { after: 200, event: added(SHEET_READER) },
  {
    after: 1300,
    event: patch(SHEET_READER.id, {
      status: 'done',
      task: 'Read 117 invoice lines',
      costUsd: 0.018,
    }),
  },
  {
    after: 500,
    event: patch(PAGE_READER.id, {
      status: 'failed',
      task: PAGE_ERROR,
      costUsd: 0.004,
    }),
  },
  {
    after: 700,
    event: patch(RESEARCHER.id, {
      status: 'done',
      task: 'Found 14 vendors with prices',
      costUsd: 0.031,
    }),
  },
  {
    after: 300,
    event: added({
      ...CODER,
      status: 'running',
      task: 'Comparing invoices with list prices',
    }),
  },
  { after: 700, event: added(CHECKER) },
  {
    after: 1400,
    event: patch(CHECKER.id, {
      status: 'done',
      task: 'The script holds on 10 lines',
      costUsd: 0.009,
    }),
  },
  {
    after: 900,
    event: patch(CODER.id, {
      status: 'done',
      task: 'Six lines above the list price',
      costUsd: 0.052,
    }),
  },
  {
    after: 300,
    event: added({
      ...WRITER,
      status: 'running',
      task: 'Drafting the credit request',
    }),
  },
  {
    after: 1600,
    event: patch(WRITER.id, {
      status: 'waiting',
      task: 'Waits for you before sending',
      costUsd: 0.014,
    }),
  },
  { after: 0, event: { type: 'approval.requested', approval: SEND_APPROVAL } },
  {
    after: 900,
    event: patch(WRITER.id, {
      status: 'done',
      task: 'Sent the credit request',
      costUsd: 0.019,
    }),
  },
  {
    after: 400,
    event: patch(PLANNER.id, {
      status: 'done',
      task: 'Review finished',
      costUsd: 0.016,
    }),
  },
  { after: 0, event: { type: 'run.finished', status: 'done' } },
];

const RETRY_MS = 1600;

function hasFailedAgent(run: RunSnapshot) {
  return run.agents.some((agent) => agent.status === 'failed');
}

/** The run waits on the person: for an approval, or for a Retry on a failed agent. */
function isWaitingOnPerson(run: RunSnapshot) {
  const pending = pendingApprovalsOf(run);
  const hasPending = pending.length > 0;
  return hasPending || hasFailedAgent(run);
}

function announcementOf(agent: RunAgent) {
  const word = AGENT_STATUS_WORD[agent.status];
  return `${agent.name}: ${word}. ${agent.task ?? ''}`;
}

function totalCostOf(agents: RunAgent[]) {
  let total = 0;
  for (const agent of agents) {
    total += costOf(agent);
  }
  return total;
}

export default function Agent05() {
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const { schedule, clearAll } = useTimeouts();
  const { ref, isInView, snapshot, store, restart } = useDemoRun(SCRIPT, {
    initial: INITIAL_RUN,
    holdWhile: isWaitingOnPerson,
  });
  const agents = snapshot.agents;
  const message = useAgentAnnouncement(agents, announcementOf);
  const totalCost = totalCostOf(agents);
  const isEnded = snapshot.endedAt !== undefined;

  function approve(approvalId: string) {
    store.dispatch({
      type: 'approval.resolved',
      id: approvalId,
      decision: 'approved',
    });
    store.dispatch(
      patch(WRITER.id, {
        status: 'running',
        task: 'Sending the credit request',
      })
    );
  }

  function retry(agentId: string) {
    setAttempts((current) => {
      const previous = current[agentId] ?? 1;
      return { ...current, [agentId]: previous + 1 };
    });
    store.dispatch(
      patch(agentId, {
        status: 'running',
        task: 'Second try through the cached copy',
        startedAt: undefined,
        endedAt: undefined,
      })
    );
    schedule(() => {
      store.dispatch(
        patch(agentId, {
          status: 'done',
          task: 'Read the cached pricing page',
          costUsd: 0.01,
        })
      );
    }, RETRY_MS);
  }

  function replay() {
    clearAll();
    setAttempts({});
    restart();
  }

  return (
    <div ref={ref} className='flex w-full max-w-[34rem] flex-col gap-2'>
      <section
        aria-label='Who started whom'
        className='bg-card hairline-ring ring-border flex flex-col gap-2 rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <header className='flex items-baseline justify-between gap-3 px-2 pt-1.5'>
          <div className='min-w-0'>
            <h3 className='truncate text-sm font-medium'>{snapshot.title}</h3>
            <p className='text-muted-foreground text-xs'>
              {countOf(agents.length, 'agent')}, arrows to move and fold
            </p>
          </div>
          <p className='shrink-0 text-[13px] font-medium'>
            <CostFigure usd={totalCost} />
          </p>
        </header>
        <ClockGate isActive={isInView}>
          <AgentTree
            agents={agents}
            approvals={snapshot.approvals}
            attempts={attempts}
            onApprove={approve}
            onRetry={retry}
            label={`Agents on the ${snapshot.title}`}
          />
        </ClockGate>
      </section>
      <div className='flex h-7 items-center justify-between gap-2 px-1'>
        <span className='text-muted-foreground text-xs'>
          Costs are illustrative
        </span>
        <ReplayButton isShown={isEnded} onReplay={replay} />
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
