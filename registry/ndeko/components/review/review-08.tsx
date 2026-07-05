'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  emptyRun,
  seriesColorOf,
  type RunEvent,
  type RunSnapshot,
  type SeriesSlot,
} from '@/registry/ndeko/lib/agent-run';
import {
  CheckIcon,
  ChevronDownIcon,
  GitMergeIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { countOf, pathPartsOf } from './_parts/words';

export type MatrixAgent = {
  id: string;
  name: string;
  initial: string;
  series: SeriesSlot;
};

export type MatrixFile = {
  id: string;
  path: string;
};

export type EditState = 'untouched' | 'writing' | 'changed';

export type Approach = {
  summary: string;
  lines: string[];
};

export type Conflict = {
  fileId: string;
  /** Where the two edits overlap: "lines 16 to 19". */
  where: string;
  agents: [string, string];
  approaches: Record<string, Approach>;
  combined: Approach;
};

export type Settlement = {
  /** The agent whose approach was kept, or "combined". */
  choice: string;
};

const CELL_WORD: Record<EditState, string> = {
  untouched: 'untouched',
  writing: 'writing',
  changed: 'changed',
};

function callIdOf(agentId: string, fileId: string) {
  return `${agentId}:${fileId}`;
}

export function editStateOf(
  run: RunSnapshot,
  agentId: string,
  fileId: string
): EditState {
  const callId = callIdOf(agentId, fileId);
  const call = run.calls.find((candidate) => candidate.id === callId);
  if (!call) {
    return 'untouched';
  }
  if (call.status === 'done') {
    return 'changed';
  }
  return 'writing';
}

function hasChanged(run: RunSnapshot, agentId: string, fileId: string) {
  const state = editStateOf(run, agentId, fileId);
  return state === 'changed';
}

/** Two agents changed the same lines once both of their edits have landed. */
function isConflictVisible(conflict: Conflict, run: RunSnapshot) {
  const [first, second] = conflict.agents;
  const isFirstDone = hasChanged(run, first, conflict.fileId);
  const isSecondDone = hasChanged(run, second, conflict.fileId);
  return isFirstDone && isSecondDone;
}

function isConflictOpen(
  conflict: Conflict,
  run: RunSnapshot,
  settlements: Record<string, Settlement>
) {
  const isVisible = isConflictVisible(conflict, run);
  const isSettled = settlements[conflict.fileId] !== undefined;
  return isVisible && !isSettled;
}

function KeptMark({ color }: { color: string }) {
  const style = { '--gem': color } as React.CSSProperties;

  return (
    <span
      aria-hidden='true'
      style={style}
      className='gem-plate inline-flex size-3.5 items-center justify-center rounded-[4px]'
    >
      <CheckIcon className='size-2.5' strokeWidth={3} />
    </span>
  );
}

function EditCell({
  state,
  agent,
  isKept,
}: {
  state: EditState;
  agent: MatrixAgent;
  isKept: boolean;
}) {
  const color = seriesColorOf(agent.series);
  const style = { backgroundColor: color } as React.CSSProperties;
  const markKey = cellKeyOf(state, isKept);

  return (
    <span className='flex h-9 items-center justify-center'>
      <Swap swapKey={markKey} className='size-3.5 justify-center'>
        {isKept && <KeptMark color={color} />}
        {!isKept && <CellMark state={state} style={style} />}
      </Swap>
      <span className='sr-only'>
        {agent.name}: {CELL_WORD[state]}
        {isKept && ', kept'}
      </span>
    </span>
  );
}

function cellKeyOf(state: EditState, isKept: boolean) {
  if (isKept) {
    return 'kept';
  }
  return state;
}

function CellMark({
  state,
  style,
}: {
  state: EditState;
  style: React.CSSProperties;
}) {
  if (state === 'writing') {
    return (
      <span
        aria-hidden='true'
        style={style}
        className='size-2.5 animate-pulse rounded-full'
      />
    );
  }
  if (state === 'changed') {
    return (
      <span
        aria-hidden='true'
        style={style}
        className='size-2.5 rounded-[3px]'
      />
    );
  }
  return (
    <span
      aria-hidden='true'
      className='bg-foreground/15 size-1.5 rounded-full'
    />
  );
}

type ApproachCardProps = {
  agent: MatrixAgent;
  approach: Approach;
  where: string;
  onUse: () => void;
};

function ApproachCard({ agent, approach, where, onUse }: ApproachCardProps) {
  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex min-w-0 flex-col gap-2 rounded-lg p-3'>
      <div className='flex items-center gap-2'>
        <LetterTile initial={agent.initial} series={agent.series} />
        <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
          {agent.name}&rsquo;s approach
        </span>
        <span className='text-muted-foreground shrink-0 text-xs'>{where}</span>
      </div>
      <p className='text-muted-foreground text-xs leading-5'>
        {approach.summary}
      </p>
      <pre className='bg-card hairline-ring ring-border overflow-x-auto rounded-md p-2 font-mono text-xs leading-5'>
        <code>{approach.lines.join('\n')}</code>
      </pre>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={onUse}
        className='self-start'
      >
        Use {agent.name}&rsquo;s
      </Button>
    </div>
  );
}

type ConflictPanelProps = {
  conflict: Conflict;
  agents: MatrixAgent[];
  onSettle: (choice: string) => void;
};

type Side = {
  agent: MatrixAgent;
  approach: Approach;
};

function sidesOf(conflict: Conflict, agents: MatrixAgent[]) {
  const sides: Side[] = [];
  for (const agentId of conflict.agents) {
    const agent = agents.find((candidate) => candidate.id === agentId);
    const approach = conflict.approaches[agentId];
    if (!agent) {
      continue;
    }
    if (!approach) {
      continue;
    }
    sides.push({ agent, approach });
  }
  return sides;
}

function ConflictPanel({ conflict, agents, onSettle }: ConflictPanelProps) {
  const [isCombining, setIsCombining] = useState(false);
  const sides = sidesOf(conflict, agents);

  return (
    <AnimatedSize>
      <div className='flex flex-col gap-3 px-1 pt-1 pb-3'>
        {!isCombining && (
          <>
            <div className='grid grid-cols-1 gap-2 @xl:grid-cols-2'>
              {sides.map((side) => (
                <ApproachCard
                  key={side.agent.id}
                  agent={side.agent}
                  approach={side.approach}
                  where={conflict.where}
                  onUse={() => onSettle(side.agent.id)}
                />
              ))}
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setIsCombining(true)}
              className='self-start'
            >
              <GitMergeIcon />
              Combine
            </Button>
          </>
        )}
        {isCombining && (
          <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col gap-2 rounded-lg p-3 transition-opacity duration-200 starting:opacity-0'>
            <span className='text-[13px] font-medium'>Combined</span>
            <p className='text-muted-foreground text-xs leading-5'>
              {conflict.combined.summary}
            </p>
            <pre className='bg-card hairline-ring ring-border overflow-x-auto rounded-md p-2 font-mono text-xs leading-5'>
              <code>{conflict.combined.lines.join('\n')}</code>
            </pre>
            <span className='flex flex-wrap items-center gap-2'>
              <Button
                type='button'
                size='sm'
                onClick={() => onSettle('combined')}
              >
                Keep combined
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setIsCombining(false)}
              >
                Back to both
              </Button>
            </span>
          </div>
        )}
      </div>
    </AnimatedSize>
  );
}

function keptWordsOf(settlement: Settlement, agents: MatrixAgent[]) {
  if (settlement.choice === 'combined') {
    return 'Combined';
  }
  const agent = agents.find((candidate) => candidate.id === settlement.choice);
  const name = agent?.name ?? 'One';
  return `${name}’s kept`;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type FileCellProps = {
  file: MatrixFile;
  conflict: Conflict | undefined;
  isConflictShown: boolean;
  settlement: Settlement | undefined;
  agents: MatrixAgent[];
  isOpen: boolean;
  panelId: string;
  onToggle: () => void;
};

function FileCell({
  file,
  conflict,
  isConflictShown,
  settlement,
  agents,
  isOpen,
  panelId,
  onToggle,
}: FileCellProps) {
  const { folder, name } = pathPartsOf(file.path);
  const isSelectable = conflict !== undefined && isConflictShown;
  const isOpenConflict = isSelectable && settlement === undefined;
  const path = (
    <span className='min-w-0 truncate font-mono text-xs'>
      <span className='text-muted-foreground hidden @md:inline'>{folder}</span>
      {name}
    </span>
  );

  if (!isSelectable) {
    return <span className='flex h-9 min-w-0 items-center px-2'>{path}</span>;
  }

  return (
    <button
      type='button'
      aria-expanded={isOpen}
      aria-controls={panelId}
      onClick={onToggle}
      className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 flex h-9 w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-start outline-none focus-visible:ring-[3px]'
    >
      <Swap swapKey={String(isOpenConflict)} className='size-3.5 shrink-0'>
        {isOpenConflict && (
          <TriangleAlertIcon className='text-warning-foreground size-3.5' />
        )}
        {!isOpenConflict && (
          <CheckIcon className='text-success-foreground size-3.5' />
        )}
      </Swap>
      {path}
      <span className='text-muted-foreground ms-auto hidden shrink-0 text-[11px] @sm:inline'>
        {settlement && keptWordsOf(settlement, agents)}
        {!settlement && 'Conflict'}
      </span>
      <ChevronDownIcon
        className={cn(
          'text-muted-foreground size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
          chevronTurnOf(isOpen)
        )}
      />
    </button>
  );
}

function mergeLabelsOf(
  writingCount: number,
  openCount: number,
  branchCount: number
): Record<MorphState, string> {
  const idle = idleMergeLabelOf(writingCount, openCount, branchCount);
  return { idle, busy: 'Merging', done: 'Merged' };
}

function idleMergeLabelOf(
  writingCount: number,
  openCount: number,
  branchCount: number
) {
  if (writingCount > 0) {
    return 'Merge when the agents finish';
  }
  if (openCount > 0) {
    const conflicts = countOf(openCount, 'conflict');
    return `Merge, ${conflicts} open`;
  }
  const branches = countOf(branchCount, 'branch', 'branches');
  return `Merge ${branches}`;
}

function mergeVariantOf(canMerge: boolean) {
  if (canMerge) {
    return 'default';
  }
  return 'outline';
}

function writingCountOf(run: RunSnapshot) {
  const writing = run.calls.filter((call) => call.status === 'running');
  return writing.length;
}

function activityWordsOf(writingCount: number, openCount: number) {
  if (writingCount > 0) {
    const agents = countOf(writingCount, 'agent');
    return `${agents} writing`;
  }
  if (openCount > 0) {
    return 'Agents done, conflicts to settle';
  }
  return 'Every change settled';
}

export type ConflictMatrixProps = {
  agents: MatrixAgent[];
  files: MatrixFile[];
  conflicts: Conflict[];
  run: RunSnapshot;
  settlements: Record<string, Settlement>;
  onSettle: (fileId: string, choice: string) => void;
};

export function ConflictMatrix({
  agents,
  files,
  conflicts,
  run,
  settlements,
  onSettle,
}: ConflictMatrixProps) {
  const [openFileId, setOpenFileId] = useState<string | null>(null);
  const baseId = useId();

  function toggle(fileId: string) {
    setOpenFileId((current) => {
      if (current === fileId) {
        return null;
      }
      return fileId;
    });
  }

  function settle(fileId: string, choice: string) {
    onSettle(fileId, choice);
    setOpenFileId(null);
  }

  return (
    <table className='w-full table-fixed border-separate border-spacing-0'>
      <caption className='sr-only'>
        Files each agent is editing, with conflicts between them
      </caption>
      <colgroup>
        <col />
        {agents.map((agent) => (
          <col key={agent.id} className='w-11 @md:w-20' />
        ))}
      </colgroup>
      <thead>
        <tr className='text-muted-foreground text-xs'>
          <th scope='col' className='h-8 px-2 text-start font-normal'>
            File
          </th>
          {agents.map((agent) => (
            <th key={agent.id} scope='col' className='h-8 font-normal'>
              <span className='flex items-center justify-center gap-1.5'>
                <LetterTile initial={agent.initial} series={agent.series} />
                <span className='hidden truncate @md:inline'>{agent.name}</span>
                <span className='sr-only @md:hidden'>{agent.name}</span>
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {files.map((file) => {
          const conflict = conflicts.find((entry) => entry.fileId === file.id);
          const isShown = conflictShownOf(conflict, run);
          const settlement = settlements[file.id];
          const isOpen = openFileId === file.id;
          const panelId = `${baseId}-${file.id}`;
          return (
            <FileRows
              key={file.id}
              file={file}
              agents={agents}
              conflict={conflict}
              isConflictShown={isShown}
              settlement={settlement}
              isOpen={isOpen}
              panelId={panelId}
              run={run}
              onToggle={() => toggle(file.id)}
              onSettle={(choice) => settle(file.id, choice)}
            />
          );
        })}
      </tbody>
    </table>
  );
}

function conflictShownOf(conflict: Conflict | undefined, run: RunSnapshot) {
  if (!conflict) {
    return false;
  }
  return isConflictVisible(conflict, run);
}

function rowToneOf(isOpenConflict: boolean) {
  if (isOpenConflict) {
    return 'bg-warning/[0.07]';
  }
  return '';
}

type FileRowsProps = {
  file: MatrixFile;
  agents: MatrixAgent[];
  conflict: Conflict | undefined;
  isConflictShown: boolean;
  settlement: Settlement | undefined;
  isOpen: boolean;
  panelId: string;
  run: RunSnapshot;
  onToggle: () => void;
  onSettle: (choice: string) => void;
};

function FileRows({
  file,
  agents,
  conflict,
  isConflictShown,
  settlement,
  isOpen,
  panelId,
  run,
  onToggle,
  onSettle,
}: FileRowsProps) {
  const isOpenConflict = isConflictShown && settlement === undefined;
  const panelConflict = panelConflictOf(conflict, isConflictShown);
  const columnCount = agents.length + 1;

  return (
    <>
      <tr
        className={cn(
          'transition-colors duration-200',
          rowToneOf(isOpenConflict)
        )}
      >
        <th scope='row' className='p-0 text-start font-normal'>
          <FileCell
            file={file}
            conflict={conflict}
            isConflictShown={isConflictShown}
            settlement={settlement}
            agents={agents}
            isOpen={isOpen}
            panelId={panelId}
            onToggle={onToggle}
          />
        </th>
        {agents.map((agent) => {
          const state = editStateOf(run, agent.id, file.id);
          const isKept = isKeptBy(settlement, agent.id);
          return (
            <td key={agent.id} className='p-0'>
              <EditCell state={state} agent={agent} isKept={isKept} />
            </td>
          );
        })}
      </tr>
      {panelConflict && (
        <tr>
          <td colSpan={columnCount} className='p-0'>
            <Fold open={isOpen} id={panelId}>
              <ConflictPanel
                conflict={panelConflict}
                agents={agents}
                onSettle={onSettle}
              />
            </Fold>
          </td>
        </tr>
      )}
    </>
  );
}

function panelConflictOf(conflict: Conflict | undefined, isShown: boolean) {
  if (!isShown) {
    return undefined;
  }
  return conflict;
}

function isKeptBy(settlement: Settlement | undefined, agentId: string) {
  if (!settlement) {
    return false;
  }
  const isChosen = settlement.choice === agentId;
  const isCombined = settlement.choice === 'combined';
  return isChosen || isCombined;
}

const AGENTS: MatrixAgent[] = [
  { id: 'coder', name: 'Coder', initial: 'C', series: 5 },
  { id: 'reviewer', name: 'Reviewer', initial: 'R', series: 4 },
  { id: 'writer', name: 'Writer', initial: 'W', series: 3 },
];

const FILES: MatrixFile[] = [
  { id: 'fee', path: 'src/billing/pallet-fee.ts' },
  { id: 'tiers', path: 'src/billing/pallet-tiers.ts' },
  { id: 'checkout', path: 'src/orders/checkout.ts' },
  { id: 'test', path: 'src/billing/pallet-fee.test.ts' },
  { id: 'docs', path: 'docs/pricing.md' },
];

const CONFLICTS: Conflict[] = [
  {
    fileId: 'fee',
    where: 'lines 16 to 18',
    agents: ['coder', 'reviewer'],
    approaches: {
      coder: {
        summary: 'Checks the pallet count where the fee is billed.',
        lines: [
          'if (order.pallets >= FLAT_FROM_PALLETS) {',
          '  return money(order.pallets * FLAT_FEE_EUR);',
          '}',
        ],
      },
      reviewer: {
        summary:
          'Moves the check into isFlatOrder, which also looks at the start date.',
        lines: [
          'if (isFlatOrder(order)) {',
          '  return money(order.pallets * FLAT_FEE_EUR);',
          '}',
        ],
      },
    },
    combined: {
      summary:
        'Keeps the helper from Reviewer and names the result as Coder did.',
      lines: [
        'const isFlat = isFlatOrder(order);',
        'if (isFlat) {',
        '  return money(order.pallets * FLAT_FEE_EUR);',
        '}',
      ],
    },
  },
  {
    fileId: 'docs',
    where: 'line 3',
    agents: ['writer', 'reviewer'],
    approaches: {
      writer: {
        summary: 'Leads with the date the change starts.',
        lines: [
          'From 1 October, orders of 40 pallets or more pay a flat 18.40 EUR per pallet.',
        ],
      },
      reviewer: {
        summary: 'Adds the year so the page still reads right next autumn.',
        lines: [
          'Orders of 40 pallets or more pay 18.40 EUR per pallet from 1 October 2026.',
        ],
      },
    },
    combined: {
      summary: 'The order of Writer with the year of Reviewer.',
      lines: [
        'From 1 October 2026, orders of 40 pallets or more pay a flat 18.40 EUR per pallet.',
      ],
    },
  },
];

function startEdit(agentId: string, fileId: string): RunEvent {
  return {
    type: 'call.started',
    call: {
      id: callIdOf(agentId, fileId),
      tool: 'edit_file',
      label: fileId,
      agentId,
      status: 'running',
    },
  };
}

function finishEdit(agentId: string, fileId: string): RunEvent {
  return {
    type: 'call.updated',
    id: callIdOf(agentId, fileId),
    patch: { status: 'done' },
  };
}

const SCRIPT: RunScriptStep[] = [
  { after: 400, event: { type: 'run.started' } },
  { after: 0, event: startEdit('coder', 'fee') },
  { after: 150, event: startEdit('reviewer', 'checkout') },
  { after: 150, event: startEdit('writer', 'docs') },
  { after: 900, event: finishEdit('coder', 'fee') },
  { after: 0, event: startEdit('coder', 'tiers') },
  { after: 500, event: finishEdit('reviewer', 'checkout') },
  { after: 0, event: startEdit('reviewer', 'fee') },
  { after: 600, event: finishEdit('writer', 'docs') },
  { after: 0, event: finishEdit('coder', 'tiers') },
  { after: 0, event: startEdit('coder', 'test') },
  { after: 700, event: finishEdit('reviewer', 'fee') },
  { after: 200, event: startEdit('reviewer', 'docs') },
  { after: 700, event: finishEdit('coder', 'test') },
  { after: 500, event: finishEdit('reviewer', 'docs') },
  { after: 0, event: { type: 'run.finished', status: 'done' } },
];

const INITIAL_RUN = emptyRun({ id: 'conflicts', title: 'Flat fee branches' });

const MERGING_MS = 900;

function openCountOf(
  run: RunSnapshot,
  settlements: Record<string, Settlement>
) {
  const open = CONFLICTS.filter((conflict) =>
    isConflictOpen(conflict, run, settlements)
  );
  return open.length;
}

function settleNoticeOf(fileId: string, choice: string) {
  const file = FILES.find((candidate) => candidate.id === fileId);
  const { name } = pathPartsOf(file?.path ?? fileId);
  if (choice === 'combined') {
    return `Kept the combined change in ${name}`;
  }
  const agent = AGENTS.find((candidate) => candidate.id === choice);
  return `Kept the change from ${agent?.name ?? 'one agent'} in ${name}`;
}

export default function Review08() {
  const [settlements, setSettlements] = useState<Record<string, Settlement>>(
    {}
  );
  const [mergeState, setMergeState] = useState<MorphState>('idle');
  const [notice, setNotice] = useState('');
  const shouldReduceMotion = usePrefersReducedMotion();
  const risePresence = risePresenceOf(shouldReduceMotion);
  const { schedule, clearAll } = useTimeouts();
  const { ref, snapshot, restart } = useDemoRun(SCRIPT, {
    initial: INITIAL_RUN,
  });
  const writingCount = writingCountOf(snapshot);
  const openCount = openCountOf(snapshot, settlements);
  const isQuiet = writingCount === 0;
  const hasNoConflict = openCount === 0;
  const isRunDone = snapshot.status === 'done';
  const isReady = isQuiet && hasNoConflict;
  const canMerge = isReady && isRunDone;
  const isMerged = mergeState === 'done';
  const activity = activityWordsOf(writingCount, openCount);
  const branchCount = AGENTS.length;
  const labels = mergeLabelsOf(writingCount, openCount, branchCount);

  function settle(fileId: string, choice: string) {
    setSettlements((current) => ({ ...current, [fileId]: { choice } }));
    setNotice(settleNoticeOf(fileId, choice));
  }

  function merge() {
    if (!canMerge) {
      return;
    }
    setMergeState('busy');
    schedule(() => {
      setMergeState('done');
      const branches = countOf(branchCount, 'branch', 'branches');
      setNotice(`Merged ${branches} into main`);
    }, MERGING_MS);
  }

  function replay() {
    clearAll();
    setSettlements({});
    setMergeState('idle');
    setNotice('');
    restart();
  }

  return (
    <div
      ref={ref}
      className='bg-card hairline-ring ring-border @container flex w-full max-w-[44rem] flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1'>
        <span className='text-[13px] font-medium'>
          Flat fee, three branches
        </span>
        <span className='text-muted-foreground text-xs'>
          <WordRoll text={activity} />
        </span>
      </header>
      <ConflictMatrix
        agents={AGENTS}
        files={FILES}
        conflicts={CONFLICTS}
        run={snapshot}
        settlements={settlements}
        onSettle={settle}
      />
      <footer className='flex flex-wrap items-center justify-end gap-2 px-1'>
        <AnimatePresence initial={false}>
          {isMerged && (
            <motion.p
              key='merged'
              className='text-muted-foreground me-auto text-xs'
              {...risePresence}
            >
              main now holds every kept change
            </motion.p>
          )}
        </AnimatePresence>
        <ReplayButton isShown={isMerged} onReplay={replay} label='Run again' />
        <MorphButton
          type='button'
          size='sm'
          variant={mergeVariantOf(canMerge)}
          state={mergeState}
          labels={labels}
          disabled={!canMerge}
          idleIcon={<GitMergeIcon />}
          onClick={merge}
        />
      </footer>
      <LiveRegion message={notice} />
    </div>
  );
}
