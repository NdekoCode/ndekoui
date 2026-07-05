'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { seriesColorOf, type RunAgent } from '@/registry/ndeko/lib/agent-run';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  ChevronDownIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { restingOf } from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

export type TerminalStatus = 'waiting' | 'running' | 'done' | 'skipped';

export type TerminalCommand = {
  id: string;
  command: string;
  status: TerminalStatus;
  lines: string[];
  exitCode?: number;
  /** Why the command waits for a person before it runs. */
  reason?: string;
};

/** Long output folds to its first lines once the command finishes. */
const FOLD_AFTER_LINES = 8;

const FOLDED_LINES = 6;

const PINNED_SLACK_PX = 24;

function isFinishedStatus(status: TerminalStatus) {
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';
  return isDone || isSkipped;
}

function isFoldable(command: TerminalCommand) {
  const isFinished = isFinishedStatus(command.status);
  const isLong = command.lines.length > FOLD_AFTER_LINES;
  return isFinished && isLong;
}

function hiddenCountLabelOf(count: number) {
  if (count === 1) {
    return 'Show 1 more line';
  }
  return `Show ${count} more lines`;
}

function lineToneOf(line: string) {
  const trimmed = line.trimStart();
  if (trimmed.startsWith('FAIL')) {
    return 'text-destructive-ink';
  }
  if (trimmed.startsWith('npm ERR!')) {
    return 'text-destructive-ink';
  }
  if (trimmed.startsWith('>')) {
    return 'text-muted-foreground';
  }
  if (trimmed.startsWith('PASS')) {
    return 'text-success-foreground';
  }
  return 'text-foreground/85';
}

function copyTextOf(command: TerminalCommand) {
  const output = command.lines.join('\n');
  return `$ ${command.command}\n${output}`;
}

function statusKeyOf(command: TerminalCommand) {
  return `${command.status}-${command.exitCode ?? ''}`;
}

function CommandStatus({ command }: { command: TerminalCommand }) {
  if (command.status === 'running') {
    return (
      <span className='text-muted-foreground inline-flex items-center gap-1.5 font-sans text-xs'>
        <Spinner
          label={`${command.command} is running`}
          className='[&_svg]:size-3.5'
        />
        Running
      </span>
    );
  }
  if (command.status === 'waiting') {
    return <Badge variant='warning'>Needs approval</Badge>;
  }
  if (command.status === 'skipped') {
    return <Badge variant='secondary'>Skipped</Badge>;
  }
  const code = command.exitCode ?? 0;
  if (code === 0) {
    return (
      <Badge variant='secondary' className='font-mono'>
        exit 0
      </Badge>
    );
  }
  return (
    <Badge variant='destructive' className='font-mono'>
      exit {code}
    </Badge>
  );
}

type ApprovalBarProps = {
  command: TerminalCommand;
  isApprovePressed: boolean;
  onApprove?: (commandId: string) => void;
  onSkip?: (commandId: string) => void;
};

function ApprovalBar({
  command,
  isApprovePressed,
  onApprove,
  onSkip,
}: ApprovalBarProps) {
  function approve() {
    onApprove?.(command.id);
  }

  function skip() {
    onSkip?.(command.id);
  }

  function decideFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const isOnGroup = event.target === event.currentTarget;
    const isEnter = event.key === 'Enter';
    if (isEnter && isOnGroup) {
      event.preventDefault();
      approve();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      skip();
    }
  }

  return (
    <div className='@container'>
      <div
        role='group'
        tabIndex={0}
        aria-label={`${command.command} needs your approval. Enter runs it, Escape skips it.`}
        onKeyDown={decideFromKeys}
        className='bg-warning/10 focus-visible:ring-ring/25 mt-2 flex flex-col gap-2.5 rounded-lg p-2.5 font-sans outline-none focus-visible:ring-[3px] @lg:flex-row @lg:items-center'
      >
        <p className='text-warning-foreground flex min-w-0 flex-1 items-start gap-2 text-xs leading-5'>
          <TriangleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
          {command.reason}
        </p>
        <div className='flex shrink-0 items-center gap-2'>
          <Button
            type='button'
            size='sm'
            onClick={approve}
            className={pressedSolidOf(isApprovePressed)}
          >
            Run
            <Kbd className='ms-0.5'>Enter</Kbd>
          </Button>
          <Button type='button' variant='outline' size='sm' onClick={skip}>
            Skip
            <Kbd className='ms-0.5'>Esc</Kbd>
          </Button>
        </div>
      </div>
    </div>
  );
}

const LINE_CLASS =
  'block min-h-[1lh] break-words whitespace-pre-wrap transition-opacity duration-150 starting:opacity-0';

function OutputLines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <span key={index} className={cn(LINE_CLASS, lineToneOf(line))}>
          {line}
        </span>
      ))}
    </>
  );
}

type CommandBlockProps = {
  command: TerminalCommand;
  isApprovePressed: boolean;
  onApprove?: (commandId: string) => void;
  onSkip?: (commandId: string) => void;
  onRerun?: (commandId: string) => void;
};

/**
 * Lines stream straight into the block: nothing resizes it line by line. Only what a person or the
 * end of the command changes at once is animated, the lines that fold away and the approval bar.
 */
function CommandBlock({
  command,
  isApprovePressed,
  onApprove,
  onSkip,
  onRerun,
}: CommandBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const foldable = isFoldable(command);
  const isFolded = foldable && !isExpanded;
  const hiddenCount = command.lines.length - FOLDED_LINES;
  const isWaiting = command.status === 'waiting';
  const isFinished = isFinishedStatus(command.status);
  const canRerun = isFinished && onRerun !== undefined;
  const isEmptyFinished = isFinished && command.lines.length === 0;
  const firstLines = command.lines.slice(0, FOLDED_LINES);
  const laterLines = command.lines.slice(FOLDED_LINES);
  const hasLaterLines = laterLines.length > 0;
  const showsLaterLines = hasLaterLines && !isFolded;
  const toggleLabel = foldToggleLabelOf(isExpanded, hiddenCount);

  function toggleFold() {
    setIsExpanded((current) => !current);
  }

  function rerun() {
    setIsExpanded(false);
    onRerun?.(command.id);
  }

  return (
    <div className='flex flex-col px-3 py-2.5'>
      <div className='flex min-h-6 items-center gap-2'>
        <span aria-hidden='true' className='text-muted-foreground select-none'>
          $
        </span>
        <code className='min-w-0 flex-1 truncate'>{command.command}</code>
        <Swap swapKey={statusKeyOf(command)}>
          <CommandStatus command={command} />
        </Swap>
        <CopyButton
          text={copyTextOf(command)}
          label={`Copy ${command.command} and its output`}
        />
        {canRerun && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={`Run ${command.command} again`}
            onClick={rerun}
            className='text-muted-foreground size-6'
          >
            <RotateCcwIcon className='size-3.5' />
          </Button>
        )}
      </div>
      <div className='flex flex-col'>
        <OutputLines lines={firstLines} />
        <AnimatePresence initial={false}>
          {showsLaterLines && (
            <motion.div
              key='later'
              className='flex flex-col overflow-hidden'
              {...rowPresence}
            >
              <OutputLines lines={laterLines} />
            </motion.div>
          )}
        </AnimatePresence>
        {isEmptyFinished && (
          <span className='text-muted-foreground font-sans'>No output</span>
        )}
        {foldable && (
          <button
            type='button'
            aria-expanded={isExpanded}
            onClick={toggleFold}
            className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 mt-1 w-fit cursor-pointer rounded-md font-sans text-xs outline-none focus-visible:ring-[3px]'
          >
            <Swap swapKey={toggleLabel}>{toggleLabel}</Swap>
          </button>
        )}
        <AnimatePresence initial={false}>
          {isWaiting && (
            <motion.div
              key='approval'
              className='-m-1 overflow-hidden p-1'
              {...rowPresence}
            >
              <ApprovalBar
                command={command}
                isApprovePressed={isApprovePressed}
                onApprove={onApprove}
                onSkip={onSkip}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function foldToggleLabelOf(isExpanded: boolean, hiddenCount: number) {
  if (isExpanded) {
    return 'Show fewer lines';
  }
  return hiddenCountLabelOf(hiddenCount);
}

function distanceFromBottomOf(element: HTMLElement) {
  const bottom = element.scrollTop + element.clientHeight;
  return element.scrollHeight - bottom;
}

function useFollowBottom() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);
  const [isPinned, setIsPinned] = useState(true);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (isPinnedRef.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  function updatePinned(event: React.UIEvent<HTMLDivElement>) {
    const distance = distanceFromBottomOf(event.currentTarget);
    const nextPinned = distance <= PINNED_SLACK_PX;
    isPinnedRef.current = nextPinned;
    setIsPinned(nextPinned);
  }

  function jumpToBottom() {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    isPinnedRef.current = true;
    setIsPinned(true);
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }

  return { scrollerRef, contentRef, isPinned, updatePinned, jumpToBottom };
}

export type AgentTerminalProps = {
  commands: TerminalCommand[];
  agent: Pick<RunAgent, 'name' | 'series'>;
  cwd: string;
  onApprove?: (commandId: string) => void;
  onSkip?: (commandId: string) => void;
  onRerun?: (commandId: string) => void;
  /** Shows Run held down on the command that waits, for a demonstration that presses it. */
  isApprovePressed?: boolean;
  className?: string;
};

export function AgentTerminal({
  commands,
  agent,
  cwd,
  onApprove,
  onSkip,
  onRerun,
  isApprovePressed = false,
  className,
}: AgentTerminalProps) {
  const { scrollerRef, contentRef, isPinned, updatePinned, jumpToBottom } =
    useFollowBottom();
  const hasCommands = commands.length > 0;
  const chipColor = seriesColorOf(agent.series);

  return (
    <section
      aria-label={`${agent.name} terminal`}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex items-center gap-2 px-1'>
        <Chip color={chipColor}>{agent.name}</Chip>
        <span className='text-muted-foreground min-w-0 truncate font-mono text-xs'>
          {cwd}
        </span>
      </header>
      <div className='relative'>
        <div
          ref={scrollerRef}
          role='log'
          aria-label='Commands and their output'
          tabIndex={0}
          onScroll={updatePinned}
          className='bg-foreground/[0.03] dark:bg-foreground/[0.05] focus-visible:ring-ring/25 max-h-80 overflow-y-auto rounded-lg font-mono text-xs leading-5 outline-none focus-visible:ring-[3px]'
        >
          <div ref={contentRef} className='flex flex-col py-1'>
            {commands.map((command) => (
              <CommandBlock
                key={command.id}
                command={command}
                isApprovePressed={isApprovePressed}
                onApprove={onApprove}
                onSkip={onSkip}
                onRerun={onRerun}
              />
            ))}
            {!hasCommands && (
              <p className='text-muted-foreground px-3 py-2.5 font-sans'>
                Commands show here as the agent runs them
              </p>
            )}
          </div>
        </div>
        {!isPinned && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={jumpToBottom}
            className='absolute end-2 bottom-2'
          >
            <ChevronDownIcon />
            Latest output
          </Button>
        )}
      </div>
    </section>
  );
}

type CommandSpec = {
  command: string;
  lines: string[];
  exitCode: number;
  reason?: string;
};

const NPM_TEST: CommandSpec = {
  command: 'npm test',
  exitCode: 1,
  lines: [
    '> brightmoor-review@1.4.0 test',
    '> jest --ci',
    '',
    'FAIL src/pricing.test.ts',
    '  pricing > applies the Q3 list price to bulk lines',
    '    Expected: 17.9',
    '    Received: 18.4',
    '',
    "      42 |   const line = bulkLine('BM-2210', 400);",
    "    > 43 |   expect(priceOf(line, 'Q3')).toBe(17.9);",
    '      44 | });',
    '',
    'PASS src/invoices.test.ts',
    'PASS src/currency.test.ts',
    'PASS src/email.test.ts',
    'PASS src/vendors.test.ts',
    'PASS src/totals.test.ts',
    '',
    'Test Suites: 1 failed, 5 passed, 6 total',
    'Tests:       1 failed, 47 passed, 48 total',
    'Snapshots:   0 total',
    'Time:        3.12 s',
    'Ran all test suites.',
    'npm ERR! Test failed. See above for more details.',
  ],
};

const GIT_DIFF: CommandSpec = {
  command: 'git diff --stat',
  exitCode: 0,
  lines: [
    ' src/pricing.ts         | 14 +++++++-------',
    ' src/pricing.test.ts    |  6 ++++--',
    ' data/brightmoor-q3.csv | 42 ++++++++++++++++++++',
    ' 3 files changed, 53 insertions(+), 9 deletions(-)',
  ],
};

const CLEAR_CACHE: CommandSpec = {
  command: 'rm -rf ./tmp/cache',
  exitCode: 0,
  lines: [],
  reason:
    'Deletes 214 cached files. They are not in git, so this cannot be undone.',
};

const PRICING_TEST: CommandSpec = {
  command: 'npm test -- pricing',
  exitCode: 0,
  lines: [
    '> brightmoor-review@1.4.0 test',
    '> jest --ci pricing',
    '',
    'PASS src/pricing.test.ts',
    '',
    'Test Suites: 1 passed, 1 total',
    'Tests:       8 passed, 8 total',
    'Snapshots:   0 total',
    'Time:        0.94 s',
    'Ran all test suites matching /pricing/i.',
  ],
};

const SPECS: Record<string, CommandSpec> = {
  test: NPM_TEST,
  diff: GIT_DIFF,
  cache: CLEAR_CACHE,
  retest: PRICING_TEST,
};

const CODER: Pick<RunAgent, 'name' | 'series'> = { name: 'Coder', series: 5 };

/** Output lands a few lines at a time, the way a process flushes it: one render and one scroll per batch. */
const LINES_PER_BATCH = 3;

const BATCH_MS = 300;

const SETTLE_MS = 250;

/** A command that waits on a person is run by the demonstration after this long. */
const APPROVE_AFTER_MS = 2500;

/** Who prints a command: the script plays its first run, a person's rerun is played by their own click. */
type Source = 'script' | 'hand';

type ShellState = {
  commands: TerminalCommand[];
  /** The command the script is playing, if any. */
  scriptedId: string | null;
};

type ShellAction =
  | { type: 'start'; id: string }
  | { type: 'print'; id: string; count: number; by: Source }
  | { type: 'exit'; id: string; by: Source }
  | { type: 'approve'; id: string }
  | { type: 'skip'; id: string }
  | { type: 'rerun'; id: string };

type ShellStep = SessionStep<ShellState, ShellAction>;

const INITIAL: ShellState = { commands: [], scriptedId: null };

function firstStatusOf(spec: CommandSpec): TerminalStatus {
  if (spec.reason !== undefined) {
    return 'waiting';
  }
  return 'running';
}

function commandIn(state: ShellState, id: string) {
  return state.commands.find((command) => command.id === id);
}

function withCommand(state: ShellState, next: TerminalCommand): ShellState {
  const commands = state.commands.map((command) => {
    if (command.id === next.id) {
      return next;
    }
    return command;
  });
  return { ...state, commands };
}

function isPrintedBy(state: ShellState, id: string, by: Source) {
  const isScripted = state.scriptedId === id;
  if (by === 'script') {
    return isScripted;
  }
  return !isScripted;
}

function started(state: ShellState, id: string): ShellState {
  const spec = SPECS[id];
  const isKnown = commandIn(state, id) !== undefined;
  if (!spec || isKnown) {
    return state;
  }
  const command: TerminalCommand = {
    id,
    command: spec.command,
    status: firstStatusOf(spec),
    lines: [],
    reason: spec.reason,
  };
  return { commands: [...state.commands, command], scriptedId: id };
}

/** The running command, when the action comes from whoever is printing it. */
function printableIn(state: ShellState, id: string, by: Source) {
  const command = commandIn(state, id);
  const isRunning = command?.status === 'running';
  const isTheirs = isPrintedBy(state, id, by);
  if (isRunning && isTheirs) {
    return command;
  }
  return undefined;
}

function printed(state: ShellState, id: string, count: number, by: Source) {
  const command = printableIn(state, id, by);
  const spec = SPECS[id];
  if (!command || !spec) {
    return state;
  }
  const lines = spec.lines.slice(0, count);
  return withCommand(state, { ...command, lines });
}

function scriptedAfterExit(state: ShellState, by: Source) {
  if (by === 'script') {
    return null;
  }
  return state.scriptedId;
}

function exited(state: ShellState, id: string, by: Source): ShellState {
  const command = printableIn(state, id, by);
  const spec = SPECS[id];
  if (!command || !spec) {
    return state;
  }
  const done: TerminalCommand = {
    ...command,
    status: 'done',
    lines: spec.lines,
    exitCode: spec.exitCode,
  };
  const next = withCommand(state, done);
  return { ...next, scriptedId: scriptedAfterExit(state, by) };
}

function approved(state: ShellState, id: string) {
  const command = commandIn(state, id);
  if (command?.status !== 'waiting') {
    return state;
  }
  return withCommand(state, { ...command, status: 'running' });
}

function scriptedAfterSkip(state: ShellState, id: string) {
  if (state.scriptedId === id) {
    return null;
  }
  return state.scriptedId;
}

function skipped(state: ShellState, id: string): ShellState {
  const command = commandIn(state, id);
  if (command?.status !== 'waiting') {
    return state;
  }
  const next = withCommand(state, { ...command, status: 'skipped' });
  return { ...next, scriptedId: scriptedAfterSkip(state, id) };
}

/** A command that needed approval asks again before it runs a second time. */
function rerun(state: ShellState, id: string) {
  const command = commandIn(state, id);
  const spec = SPECS[id];
  if (!command || !spec) {
    return state;
  }
  if (!isFinishedStatus(command.status)) {
    return state;
  }
  const again: TerminalCommand = {
    ...command,
    status: firstStatusOf(spec),
    lines: [],
    exitCode: undefined,
  };
  return withCommand(state, again);
}

function reducer(state: ShellState, action: ShellAction): ShellState {
  switch (action.type) {
    case 'start':
      return started(state, action.id);
    case 'print':
      return printed(state, action.id, action.count, action.by);
    case 'exit':
      return exited(state, action.id, action.by);
    case 'approve':
      return approved(state, action.id);
    case 'skip':
      return skipped(state, action.id);
    case 'rerun':
      return rerun(state, action.id);
  }
}

/** How many lines show after each batch: 3, 6, 9 and so on up to all of them. */
function batchEndsOf(lineCount: number) {
  const ends: number[] = [];
  for (let end = LINES_PER_BATCH; end < lineCount; end += LINES_PER_BATCH) {
    ends.push(end);
  }
  if (lineCount > 0) {
    ends.push(lineCount);
  }
  return ends;
}

function printSteps(id: string): ShellStep[] {
  const spec = SPECS[id];
  const ends = batchEndsOf(spec.lines.length);
  return ends.map((count) => ({
    after: BATCH_MS,
    action: { type: 'print', id, count, by: 'script' },
  }));
}

function scriptedRun(id: string, startAfter: number): ShellStep[] {
  return [
    { after: startAfter, action: { type: 'start', id } },
    ...printSteps(id),
    { after: SETTLE_MS, action: { type: 'exit', id, by: 'script' } },
  ];
}

function isCacheDecided(state: ShellState) {
  const command = commandIn(state, 'cache');
  const isAsked = command !== undefined;
  const isWaiting = command?.status === 'waiting';
  return isAsked && !isWaiting;
}

const SCRIPT: ShellStep[] = [
  ...scriptedRun('test', 700),
  ...scriptedRun('diff', 300),
  { after: 500, action: { type: 'start', id: 'cache' } },
  {
    after: APPROVE_AFTER_MS,
    by: 'person',
    press: 'run',
    action: { type: 'approve', id: 'cache' },
    isAnswered: isCacheDecided,
  },
  { after: 700, action: { type: 'exit', id: 'cache', by: 'script' } },
  ...scriptedRun('retest', 400),
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, reducer),
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(commands: TerminalCommand[]) {
  const last = commands[commands.length - 1];
  if (!last) {
    return '';
  }
  if (last.status === 'waiting') {
    return `${last.command} needs your approval`;
  }
  if (last.status === 'skipped') {
    return `Skipped ${last.command}`;
  }
  if (last.status === 'running') {
    return `Running ${last.command}`;
  }
  return `${last.command} exited with code ${last.exitCode ?? 0}`;
}

export default function Run04() {
  const { schedule, clearAll } = useTimeouts();
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const commands = state.commands;
  const announcement = announcementOf(commands);
  const isSettled = commands.every((command) =>
    isFinishedStatus(command.status)
  );
  const isOver = isFinished && isSettled;
  const canReplay = isOver && !isAutoplaying;

  function stream(commandId: string) {
    const spec = SPECS[commandId];
    if (!spec) {
      return;
    }
    const ends = batchEndsOf(spec.lines.length);
    ends.forEach((count, index) => {
      const batchNumber = index + 1;
      const printDelay = batchNumber * BATCH_MS;
      schedule(() => {
        act({ type: 'print', id: commandId, count, by: 'hand' });
      }, printDelay);
    });
    const printTime = ends.length * BATCH_MS;
    const exitDelay = printTime + SETTLE_MS;
    schedule(() => {
      act({ type: 'exit', id: commandId, by: 'hand' });
    }, exitDelay);
  }

  /** The script prints the command it asked about. Any other approved command is printed from here. */
  function approve(commandId: string) {
    act({ type: 'approve', id: commandId });
    const isScripted = state.scriptedId === commandId;
    if (!isScripted) {
      stream(commandId);
    }
  }

  function skip(commandId: string) {
    act({ type: 'skip', id: commandId });
  }

  function rerunCommand(commandId: string) {
    act({ type: 'rerun', id: commandId });
    const needsApproval = SPECS[commandId]?.reason !== undefined;
    if (!needsApproval) {
      stream(commandId);
    }
  }

  function replay() {
    clearAll();
    restart();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[26.5rem] w-full max-w-[40rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <AgentTerminal
          commands={commands}
          agent={CODER}
          cwd='~/work/brightmoor-review'
          onApprove={approve}
          onSkip={skip}
          onRerun={rerunCommand}
          isApprovePressed={pressed === 'run'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={replay} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
