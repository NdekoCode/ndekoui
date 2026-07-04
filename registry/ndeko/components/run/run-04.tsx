'use client';

import { useEffect, useRef, useState } from 'react';

import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import {
  emptyRun,
  seriesColorOf,
  type RunAgent,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  ChevronDownIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
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

type ShellOutput = {
  lines: string[];
  exitCode?: number;
  skipped?: boolean;
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
  onApprove?: (commandId: string) => void;
  onSkip?: (commandId: string) => void;
};

function ApprovalBar({ command, onApprove, onSkip }: ApprovalBarProps) {
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
    <div
      role='group'
      tabIndex={0}
      aria-label={`${command.command} needs your approval. Enter runs it, Escape skips it.`}
      onKeyDown={decideFromKeys}
      className='bg-warning/10 focus-visible:ring-ring/25 mt-2 flex flex-col gap-2.5 rounded-lg p-2.5 font-sans outline-none focus-visible:ring-[3px] sm:flex-row sm:items-center'
    >
      <p className='text-warning-foreground flex min-w-0 flex-1 items-start gap-2 text-xs leading-5'>
        <TriangleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
        {command.reason}
      </p>
      <div className='flex shrink-0 items-center gap-2'>
        <Button type='button' size='sm' onClick={approve}>
          Run
          <Kbd className='ms-0.5'>Enter</Kbd>
        </Button>
        <Button type='button' variant='outline' size='sm' onClick={skip}>
          Skip
          <Kbd className='ms-0.5'>Esc</Kbd>
        </Button>
      </div>
    </div>
  );
}

type CommandBlockProps = {
  command: TerminalCommand;
  onApprove?: (commandId: string) => void;
  onSkip?: (commandId: string) => void;
  onRerun?: (commandId: string) => void;
};

function CommandBlock({
  command,
  onApprove,
  onSkip,
  onRerun,
}: CommandBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const foldable = isFoldable(command);
  const isFolded = foldable && !isExpanded;
  const hiddenCount = command.lines.length - FOLDED_LINES;
  const isWaiting = command.status === 'waiting';
  const isFinished = isFinishedStatus(command.status);
  const canRerun = isFinished && onRerun !== undefined;
  const isEmptyFinished = isFinished && command.lines.length === 0;
  const visibleLines = visibleLinesOf(command.lines, isFolded);
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
      <AnimatedSize>
        <div className='flex flex-col'>
          {visibleLines.map((line, index) => (
            <span
              key={index}
              className={cn(
                'block min-h-[1lh] break-words whitespace-pre-wrap transition-opacity duration-150 starting:opacity-0',
                lineToneOf(line)
              )}
            >
              {line}
            </span>
          ))}
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
          {isWaiting && (
            <ApprovalBar
              command={command}
              onApprove={onApprove}
              onSkip={onSkip}
            />
          )}
        </div>
      </AnimatedSize>
    </div>
  );
}

function visibleLinesOf(lines: string[], isFolded: boolean) {
  if (isFolded) {
    return lines.slice(0, FOLDED_LINES);
  }
  return lines;
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
  className?: string;
};

export function AgentTerminal({
  commands,
  agent,
  cwd,
  onApprove,
  onSkip,
  onRerun,
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

const SPECS: Record<string, CommandSpec> = {
  test: NPM_TEST,
  diff: GIT_DIFF,
  cache: CLEAR_CACHE,
};

const CODER: Pick<RunAgent, 'name' | 'series'> = { name: 'Coder', series: 5 };

const LINE_MS = 110;

const SETTLE_MS = 250;

function shellCall(
  id: string,
  spec: CommandSpec,
  status: 'running' | 'waiting'
): ToolCall {
  return {
    id,
    tool: 'shell',
    label: spec.command,
    status,
    input: { command: spec.command },
    output: { lines: [] },
  };
}

function finishedStatusOf(spec: CommandSpec) {
  if (spec.exitCode === 0) {
    return 'done';
  }
  return 'failed';
}

function streamSteps(id: string, spec: CommandSpec): RunScriptStep[] {
  const steps: RunScriptStep[] = [
    {
      after: 300,
      event: { type: 'call.started', call: shellCall(id, spec, 'running') },
    },
  ];
  for (let index = 1; index <= spec.lines.length; index += 1) {
    const lines = spec.lines.slice(0, index);
    steps.push({
      after: LINE_MS,
      event: { type: 'call.updated', id, patch: { output: { lines } } },
    });
  }
  steps.push({
    after: SETTLE_MS,
    event: {
      type: 'call.updated',
      id,
      patch: {
        status: finishedStatusOf(spec),
        output: { lines: spec.lines, exitCode: spec.exitCode },
      },
    },
  });
  return steps;
}

const SCRIPT: RunScriptStep[] = [
  { after: 400, event: { type: 'run.started' } },
  ...streamSteps('test', NPM_TEST),
  ...streamSteps('diff', GIT_DIFF),
  {
    after: 500,
    event: {
      type: 'call.started',
      call: shellCall('cache', CLEAR_CACHE, 'waiting'),
    },
  },
];

const INITIAL_RUN = emptyRun({
  id: 'brightmoor-shell',
  title: 'Fix the Q3 price test',
});

function isShellOutput(value: unknown): value is ShellOutput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Array.isArray((value as ShellOutput).lines);
}

function shellOutputOf(value: unknown): ShellOutput {
  if (isShellOutput(value)) {
    return value;
  }
  return { lines: [] };
}

function terminalStatusOf(call: ToolCall, output: ShellOutput): TerminalStatus {
  if (call.status === 'waiting') {
    return 'waiting';
  }
  const isQueued = call.status === 'queued';
  const isRunning = call.status === 'running';
  if (isQueued || isRunning) {
    return 'running';
  }
  if (output.skipped) {
    return 'skipped';
  }
  return 'done';
}

function commandOf(call: ToolCall): TerminalCommand {
  const output = shellOutputOf(call.output);
  const spec = SPECS[call.id];
  return {
    id: call.id,
    command: call.label,
    status: terminalStatusOf(call, output),
    lines: output.lines,
    exitCode: output.exitCode,
    reason: spec?.reason,
  };
}

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
  const { ref, snapshot, store, restart, isFinished } = useDemoRun(SCRIPT, {
    initial: INITIAL_RUN,
  });
  const commands = snapshot.calls.map(commandOf);
  const announcement = announcementOf(commands);
  const isSettled = commands.every((command) =>
    isFinishedStatus(command.status)
  );
  const canReplay = isFinished && isSettled;

  function stream(commandId: string) {
    const spec = SPECS[commandId];
    if (!spec) {
      return;
    }
    store.dispatch({
      type: 'call.updated',
      id: commandId,
      patch: {
        status: 'running',
        startedAt: undefined,
        endedAt: undefined,
        output: { lines: [] },
      },
    });
    for (let index = 1; index <= spec.lines.length; index += 1) {
      const lines = spec.lines.slice(0, index);
      const delay = index * LINE_MS;
      schedule(() => {
        store.dispatch({
          type: 'call.updated',
          id: commandId,
          patch: { output: { lines } },
        });
      }, delay);
    }
    const linesTime = spec.lines.length * LINE_MS;
    const finishDelay = linesTime + SETTLE_MS;
    schedule(() => {
      store.dispatch({
        type: 'call.updated',
        id: commandId,
        patch: {
          status: finishedStatusOf(spec),
          output: { lines: spec.lines, exitCode: spec.exitCode },
        },
      });
    }, finishDelay);
  }

  function skip(commandId: string) {
    store.dispatch({
      type: 'call.updated',
      id: commandId,
      patch: { status: 'done', output: { lines: [], skipped: true } },
    });
  }

  /** A command that needed approval asks again before it runs a second time. */
  function rerun(commandId: string) {
    const spec = SPECS[commandId];
    const needsApproval = spec?.reason !== undefined;
    if (!needsApproval) {
      stream(commandId);
      return;
    }
    store.dispatch({
      type: 'call.updated',
      id: commandId,
      patch: {
        status: 'waiting',
        startedAt: undefined,
        endedAt: undefined,
        output: { lines: [] },
      },
    });
  }

  function replay() {
    clearAll();
    restart();
  }

  return (
    <div ref={ref} className='flex w-full max-w-[40rem] flex-col gap-2'>
      <AgentTerminal
        commands={commands}
        agent={CODER}
        cwd='~/work/brightmoor-review'
        onApprove={stream}
        onSkip={skip}
        onRerun={rerun}
      />
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={replay} />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
