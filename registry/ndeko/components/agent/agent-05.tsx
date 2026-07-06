'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  emptyRun,
  formatCost,
  pendingApprovalsOf,
  reduceRun,
  type AgentStatus as AgentState,
  type ApprovalRequest,
  type RunAgent,
  type RunEvent,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { applyBatchAt, restingOf } from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { AgentActions, pendingApprovalOf } from './_parts/agent-actions';
import { AgentClock } from './_parts/agent-clock';
import {
  AGENT_STATUS_WORD,
  AgentStatusDot,
  pulsingIdsOf,
} from './_parts/agent-status';
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
import { DECIDE_AFTER_MS, pressedIdOf } from './_parts/demo';
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

/**
 * The branch that ties a sub-agent to the one that started it draws itself when the row arrives:
 * the stem grows down from the parent, then the twig reaches the row. Two transitions on `scale`.
 */
const STEM_DRAW =
  'origin-top transition-[scale] duration-300 ease-(--ease-out-strong) starting:scale-y-0';

const TWIG = 'bg-border absolute top-[18px] h-px w-2';

const TWIG_DRAW =
  'origin-left transition-[scale] delay-150 duration-200 ease-(--ease-out-strong) rtl:origin-right starting:scale-x-0';

function stemOf(isOwnBranch: boolean, drawsBranch: boolean) {
  if (isOwnBranch && drawsBranch) {
    return STEM_DRAW;
  }
  return undefined;
}

function twigOf(drawsBranch: boolean) {
  if (drawsBranch) {
    return TWIG_DRAW;
  }
  return undefined;
}

type TreeRowContentProps = {
  row: TreeRow;
  attempt: number;
  approvals: ApprovalRequest[];
  isStill: boolean;
  /** False for the rows the tree was first shown with: they are there, they do not arrive. */
  drawsBranch: boolean;
  isApprovePressed: boolean;
  isRetryPressed: boolean;
  onApprove?: (approvalId: string) => void;
  onRetry?: (agentId: string) => void;
};

function TreeRowContent({
  row,
  attempt,
  approvals,
  isStill,
  drawsBranch,
  isApprovePressed,
  isRetryPressed,
  onApprove,
  onRetry,
}: TreeRowContentProps) {
  const { agent } = row;
  const isOpen = !row.isFolded;
  const guides = Array.from({ length: row.depth }, (_, level) => level);
  const ownLevel = row.depth - 1;
  const hasBranch = row.depth > 0;
  const branchStart = ownLevel * INDENT_PX + GUIDE_OFFSET_PX;
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
          className={cn(
            'bg-border absolute inset-y-0 w-px',
            stemOf(level === ownLevel, drawsBranch)
          )}
          style={{ insetInlineStart: level * INDENT_PX + GUIDE_OFFSET_PX }}
        />
      ))}
      {hasBranch && (
        <span
          aria-hidden='true'
          className={cn(TWIG, twigOf(drawsBranch))}
          style={{ insetInlineStart: branchStart }}
        />
      )}
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
          isStill={isStill}
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
          isApprovePressed={isApprovePressed}
          isRetryPressed={isRetryPressed}
        />
      </div>
      <div className='shrink-0 text-end'>
        <p className='text-[13px] leading-5'>
          <CostFigure usd={row.subtreeCost} />
        </p>
        <p className='text-muted-foreground text-xs leading-5'>
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

/** Once a person folds or unfolds, every row that shows up arrives: none is quiet any more. */
const NO_IDS = new Set<string>();

export type AgentTreeProps = {
  agents: RunAgent[];
  approvals?: ApprovalRequest[];
  /** How many times each agent ran. From the second, its row says it was retried. */
  attempts?: Record<string, number>;
  onApprove?: (approvalId: string) => void;
  onRetry?: (agentId: string) => void;
  defaultFolded?: string[];
  /** The agent whose Approve a demonstration holds down. */
  pressedApproveId?: string | null;
  /** The agent whose Retry a demonstration holds down. */
  pressedRetryId?: string | null;
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
  pressedApproveId = null,
  pressedRetryId = null,
  label = 'Agents',
  className,
}: AgentTreeProps) {
  const [folded, setFolded] = useState<Folded>(() =>
    foldedRecordOf(defaultFolded)
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [quietIds, setQuietIds] = useState(() => idsOf(agents));
  const treeRef = useRef<HTMLUListElement>(null);
  const hintPrefix = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const rows = visibleRowsOf(agents, folded);
  const tabbableId = tabbableIdOf(focusedId, rows);
  const pulsingIds = pulsingIdsOf(agents);

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
    setQuietIds(NO_IDS);
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
                isStill={!pulsingIds.has(agentId)}
                drawsBranch={!quietIds.has(agentId)}
                isApprovePressed={pressedApproveId === agentId}
                isRetryPressed={pressedRetryId === agentId}
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

function patch(id: string, changes: Partial<RunAgent>): RunEvent {
  return { type: 'agent.updated', id, patch: changes };
}

function added(agent: RunAgent): RunEvent {
  return { type: 'agent.added', agent };
}

/** An agent joins idle and starts in the same batch, so its clock is stamped from the moment it shows up. */
function joined(agent: RunAgent): RunEvent[] {
  const idle: RunAgent = { ...agent, status: 'idle' };
  const starting = patch(agent.id, { status: 'running' });
  return [added(idle), starting];
}

type TreeState = {
  run: RunSnapshot;
  attempts: Record<string, number>;
};

type TreeAction =
  | { type: 'events'; events: RunEvent[] }
  | { type: 'approve'; approvalId: string }
  | { type: 'retry'; agentId: string }
  | { type: 'retried'; agentId: string };

type TreeStep = SessionStep<TreeState, TreeAction>;

const INITIAL: TreeState = { run: INITIAL_RUN, attempts: {} };

function agentOf(state: TreeState, agentId: string) {
  return state.run.agents.find((agent) => agent.id === agentId);
}

function attemptOf(state: TreeState, agentId: string) {
  return state.attempts[agentId] ?? 1;
}

function withApproval(state: TreeState, approvalId: string, now: number) {
  const resolved = reduceRun(
    state.run,
    { type: 'approval.resolved', id: approvalId, decision: 'approved' },
    now
  );
  const sending = patch(WRITER.id, {
    status: 'running',
    task: 'Sending the credit request',
  });
  const run = reduceRun(resolved, sending, now);
  return { ...state, run };
}

function withRetry(state: TreeState, agentId: string, now: number) {
  const agent = agentOf(state, agentId);
  const isFailed = agent?.status === 'failed';
  if (!isFailed) {
    return state;
  }
  const previous = attemptOf(state, agentId);
  const attempts = { ...state.attempts, [agentId]: previous + 1 };
  const secondTry = patch(agentId, {
    status: 'running',
    task: 'Second try through the cached copy',
    startedAt: undefined,
    endedAt: undefined,
  });
  const run = reduceRun(state.run, secondTry, now);
  return { run, attempts };
}

/** The script and the hand of a person may both land the same retry: only the first one counts. */
function withRetryLanded(state: TreeState, agentId: string, now: number) {
  const agent = agentOf(state, agentId);
  const isRunning = agent?.status === 'running';
  const wasRetried = attemptOf(state, agentId) > 1;
  const isRetrying = isRunning && wasRetried;
  if (!isRetrying) {
    return state;
  }
  const landed = patch(agentId, {
    status: 'done',
    task: 'Read the cached pricing page',
    costUsd: 0.01,
  });
  const run = reduceRun(state.run, landed, now);
  return { ...state, run };
}

function applyAt(state: TreeState, action: TreeAction, now: number): TreeState {
  if (action.type === 'approve') {
    return withApproval(state, action.approvalId, now);
  }
  if (action.type === 'retry') {
    return withRetry(state, action.agentId, now);
  }
  if (action.type === 'retried') {
    return withRetryLanded(state, action.agentId, now);
  }
  const run = applyBatchAt(state.run, action, now);
  return { ...state, run };
}

/** Times are stamped when an action lands, as a backend would stream it. */
function reducer(state: TreeState, action: TreeAction) {
  return applyAt(state, action, Date.now());
}

function landing(after: number, ...events: RunEvent[]): TreeStep {
  return { after, action: { type: 'events', events } };
}

function hasRetriedPageReader(state: TreeState) {
  return attemptOf(state, PAGE_READER.id) > 1;
}

function hasDecided(state: TreeState) {
  const pending = pendingApprovalsOf(state.run);
  return pending.length === 0;
}

const SCRIPT: TreeStep[] = [
  landing(
    400,
    { type: 'run.started' },
    patch(PLANNER.id, {
      status: 'running',
      task: 'Splitting the review between three agents',
      costUsd: 0.006,
    })
  ),
  landing(
    900,
    ...joined({ ...RESEARCHER, task: 'Collecting the price lists' })
  ),
  landing(
    300,
    patch(PLANNER.id, { task: 'Watching the agents', costUsd: 0.011 })
  ),
  landing(600, ...joined(PAGE_READER)),
  landing(200, ...joined(SHEET_READER)),
  landing(
    1300,
    patch(SHEET_READER.id, {
      status: 'done',
      task: 'Read 117 invoice lines',
      costUsd: 0.018,
    })
  ),
  landing(
    500,
    patch(PAGE_READER.id, {
      status: 'failed',
      task: PAGE_ERROR,
      costUsd: 0.004,
    })
  ),
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'retry',
    action: { type: 'retry', agentId: PAGE_READER.id },
    isAnswered: hasRetriedPageReader,
  },
  landing(
    700,
    patch(RESEARCHER.id, {
      status: 'done',
      task: 'Found 14 vendors with prices',
      costUsd: 0.031,
    })
  ),
  landing(
    300,
    ...joined({ ...CODER, task: 'Comparing invoices with list prices' })
  ),
  { after: 600, action: { type: 'retried', agentId: PAGE_READER.id } },
  landing(100, ...joined(CHECKER)),
  landing(
    1400,
    patch(CHECKER.id, {
      status: 'done',
      task: 'The script holds on 10 lines',
      costUsd: 0.009,
    })
  ),
  landing(
    900,
    patch(CODER.id, {
      status: 'done',
      task: 'Six lines above the list price',
      costUsd: 0.052,
    })
  ),
  landing(300, ...joined({ ...WRITER, task: 'Drafting the credit request' })),
  landing(
    1600,
    patch(WRITER.id, {
      status: 'waiting',
      task: 'Waits for you before sending',
      costUsd: 0.014,
    }),
    { type: 'approval.requested', approval: SEND_APPROVAL }
  ),
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'approve',
    action: { type: 'approve', approvalId: SEND_APPROVAL.id },
    isAnswered: hasDecided,
  },
  landing(
    900,
    patch(WRITER.id, {
      status: 'done',
      task: 'Sent the credit request',
      costUsd: 0.019,
    })
  ),
  landing(
    400,
    patch(PLANNER.id, {
      status: 'done',
      task: 'Review finished',
      costUsd: 0.016,
    }),
    { type: 'run.finished', status: 'done' }
  ),
];

/** How long the second try of an agent takes: the script lands it that long after the retry. */
const RETRY_MS = 1600;

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, applyAt),
  script: SCRIPT,
  loopAfter: 3000,
};

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
  const { schedule, clearAll } = useTimeouts();
  const { ref, isInView, isAutoplaying, state, act, pressed, restart } =
    useSession(SESSION);
  const { run, attempts } = state;
  const agents = run.agents;
  const message = useAgentAnnouncement(agents, announcementOf);
  const totalCost = totalCostOf(agents);
  const isEnded = run.endedAt !== undefined;
  const canReplay = isEnded && !isAutoplaying;

  function approve(approvalId: string) {
    act({ type: 'approve', approvalId });
  }

  function retry(agentId: string) {
    act({ type: 'retry', agentId });
    schedule(() => act({ type: 'retried', agentId }), RETRY_MS);
  }

  function replay() {
    clearAll();
    restart();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[35rem] w-full max-w-[34rem] flex-col gap-2'
    >
      <section
        aria-label='Who started whom'
        className='bg-card hairline-ring ring-border flex flex-col gap-2 rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <header className='flex items-baseline justify-between gap-3 px-2 pt-1.5'>
          <div className='min-w-0'>
            <h3 className='truncate text-sm font-medium'>{run.title}</h3>
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
            approvals={run.approvals}
            attempts={attempts}
            onApprove={approve}
            onRetry={retry}
            pressedApproveId={pressedIdOf(pressed, 'approve', WRITER.id)}
            pressedRetryId={pressedIdOf(pressed, 'retry', PAGE_READER.id)}
            label={`Agents on the ${run.title}`}
          />
        </ClockGate>
      </section>
      <div className='flex h-7 items-center justify-between gap-2 px-1'>
        <span className='text-muted-foreground text-xs'>
          Costs are illustrative
        </span>
        <ReplayButton isShown={canReplay} onReplay={replay} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, message)} />
    </div>
  );
}
