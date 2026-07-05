'use client';

import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from 'motion/react';
import { useContext, useEffect, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  ClockGateContext,
  useRunSnapshot,
} from '@/registry/ndeko/hooks/use-agent-run';
import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  createRunStore,
  elapsedOf,
  emptyRun,
  formatDuration,
  type PlanStep,
  type RunEvent,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import {
  ArrowUpIcon,
  BookOpenIcon,
  CircleCheckIcon,
  CircleXIcon,
  FileTextIcon,
  GlobeIcon,
  HandIcon,
  LoaderIcon,
  MicIcon,
  PaperclipIcon,
  RotateCcwIcon,
  SlidersIcon,
  TerminalIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG, SPRING } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { Textarea } from '@/registry/ndeko/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { ClockSince } from './_parts/clock';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from './_parts/demonstration';
import { LevelBars } from '@/registry/ndeko/ui/level-bars';
import {
  caretToEnd,
  isOwnKey,
  isSendKey,
  useAutosize,
} from './_parts/use-autosize';
import { appendWord, countOf, wordsOf } from './_parts/words';

export type TrayLine =
  | { kind: 'listening'; since: number }
  | { kind: 'working'; title: string; run: RunSnapshot }
  | { kind: 'waiting'; run: RunSnapshot }
  | { kind: 'answered'; run: RunSnapshot }
  | { kind: 'stopped'; run: RunSnapshot }
  | { kind: 'failed'; detail: string };

type TrayLineKind = TrayLine['kind'];

const LINE_PRESENCE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.14 } },
  transition: { duration: 0.2 },
};

const LANDING = { duration: 0.32, ease: EASE_OUT_STRONG };

const NUDGE = { duration: 0.28, ease: EASE_OUT_STRONG };

/** Wide enough for 1m 04s, so a tick never moves the words beside the clock. */
const CLOCK_BOX = 'text-muted-foreground w-12 shrink-0 text-end';

function runningStepOf(run: RunSnapshot) {
  return run.plan.find((step) => step.status === 'running');
}

function failedStepOf(run: RunSnapshot) {
  return run.plan.find((step) => step.status === 'failed');
}

function isWorking(run: RunSnapshot) {
  const isRunning = run.status === 'running';
  const isWaiting = run.status === 'waiting';
  return isRunning || isWaiting;
}

function finishedDurationOf(run: RunSnapshot) {
  const end = run.endedAt ?? run.startedAt ?? 0;
  const elapsed = elapsedOf(run, end);
  return formatDuration(elapsed);
}

/** Listening takes the tray before the answer does. */
export function trayLineOf(
  run: RunSnapshot,
  listeningSince: number | null
): TrayLine | null {
  if (listeningSince !== null) {
    return { kind: 'listening', since: listeningSince };
  }
  if (run.status === 'running') {
    const step = runningStepOf(run);
    const title = step?.title ?? 'Starting';
    return { kind: 'working', title, run };
  }
  if (run.status === 'waiting') {
    return { kind: 'waiting', run };
  }
  if (run.status === 'done') {
    return { kind: 'answered', run };
  }
  if (run.status === 'cancelled') {
    return { kind: 'stopped', run };
  }
  if (run.status === 'failed') {
    const step = failedStepOf(run);
    const detail = step?.detail ?? 'The answer failed';
    return { kind: 'failed', detail };
  }
  return null;
}

function lineTextOf(line: TrayLine) {
  if (line.kind === 'listening') {
    return 'Listening';
  }
  if (line.kind === 'working') {
    return line.title;
  }
  if (line.kind === 'waiting') {
    return 'Waiting on you';
  }
  if (line.kind === 'answered') {
    const duration = finishedDurationOf(line.run);
    return `Answered in ${duration}`;
  }
  if (line.kind === 'stopped') {
    const duration = finishedDurationOf(line.run);
    return `Stopped after ${duration}`;
  }
  return line.detail;
}

function StopGlyph({ className }: { className?: string }) {
  return (
    <span
      aria-hidden='true'
      className={cn('size-2.5 rounded-[2px] bg-current', className)}
    />
  );
}

function LineGlyph({
  kind,
  listeningIntensity,
}: {
  kind: TrayLineKind;
  listeningIntensity: number;
}) {
  const isOnScreen = useContext(ClockGateContext);

  if (kind === 'listening') {
    return (
      <LevelBars
        isActive={isOnScreen}
        intensity={listeningIntensity}
        count={4}
        seed={2}
        className='h-3.5 gap-[2px]'
        barClassName='w-[2px]'
      />
    );
  }
  if (kind === 'working') {
    return (
      <LoaderIcon className='text-muted-foreground size-3.5 animate-spin' />
    );
  }
  if (kind === 'waiting') {
    return <HandIcon className='text-warning-foreground size-3.5' />;
  }
  if (kind === 'answered') {
    return <CircleCheckIcon className='text-success-foreground size-3.5' />;
  }
  if (kind === 'stopped') {
    return <StopGlyph className='text-muted-foreground size-2' />;
  }
  return <CircleXIcon className='text-destructive-ink size-3.5' />;
}

function LineTime({ line }: { line: TrayLine }) {
  if (line.kind === 'listening') {
    return (
      <ClockSince startedAt={line.since} isRunning className={CLOCK_BOX} />
    );
  }
  if (line.kind === 'working') {
    return <LiveDuration item={line.run} isRunning className={CLOCK_BOX} />;
  }
  return null;
}

function textToneOf(kind: TrayLineKind) {
  if (kind === 'failed') {
    return 'text-destructive-ink';
  }
  return 'text-foreground/80';
}

function StatusLine({
  line,
  listeningIntensity,
  onRetry,
  isRetryPressed,
}: {
  line: TrayLine;
  listeningIntensity: number;
  onRetry?: () => void;
  isRetryPressed: boolean;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const shouldReduceMotion = useReducedMotion();
  const kind = line.kind;
  const lastKind = useRef(kind);
  const text = lineTextOf(line);
  const isFailed = kind === 'failed';
  const canRetry = isFailed && onRetry !== undefined;

  useEffect(() => {
    const isSameKind = lastKind.current === kind;
    lastKind.current = kind;
    if (isSameKind) {
      return;
    }
    if (shouldReduceMotion) {
      return;
    }
    if (kind === 'answered') {
      animate(scope.current, { scale: [1.04, 1] }, LANDING);
    }
    if (kind === 'failed') {
      animate(scope.current, { x: [0, 4, 0] }, NUDGE);
    }
  }, [kind, shouldReduceMotion, animate, scope]);

  return (
    <div
      ref={scope}
      className='flex h-9 origin-left items-center gap-2.5 ps-3 pe-1.5 text-xs'
    >
      <Swap swapKey={line.kind} className='size-3.5 shrink-0 justify-center'>
        <LineGlyph kind={line.kind} listeningIntensity={listeningIntensity} />
      </Swap>
      <span
        className={cn(
          'min-w-0 flex-1 truncate transition-colors duration-200',
          textToneOf(line.kind)
        )}
      >
        <WordRoll text={text} />
      </span>
      <LineTime line={line} />
      {canRetry && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onRetry}
          className={cn('h-6 px-2', pressedQuietOf(isRetryPressed))}
        >
          <RotateCcwIcon className='size-3.5' />
          Retry
        </Button>
      )}
    </div>
  );
}

export type StatusTrayProps = {
  /** The answer in progress or just finished. While it is idle, the tray stays folded under the card. */
  run: RunSnapshot;
  /** Set while the microphone listens: the tray says so with live levels and a clock. */
  listeningSince?: number | null;
  /** How loud the voice is while listening, from 0 for silence to 1. */
  listeningIntensity?: number;
  onRetry?: () => void;
  /** Shows Retry held down, for a demonstration that presses it. */
  isRetryPressed?: boolean;
  /** A demonstration drives the tray: its line is shown but not read aloud. */
  isDemonstrated?: boolean;
  children: React.ReactNode;
  className?: string;
};

function lineRoleOf(isDemonstrated: boolean) {
  if (isDemonstrated) {
    return undefined;
  }
  return 'status';
}

export function StatusTray({
  run,
  listeningSince = null,
  listeningIntensity = 1,
  onRetry,
  isRetryPressed = false,
  isDemonstrated = false,
  children,
  className,
}: StatusTrayProps) {
  const line = trayLineOf(run, listeningSince);

  return (
    <div
      className={cn(
        'bg-foreground/[0.04] dark:bg-foreground/[0.05] rounded-2xl p-1',
        className
      )}
    >
      <div className='relative z-10'>{children}</div>
      {/*
        The line is pinned to the bottom of a box that grows, so it comes out from under the card.
        It stays outside the resizing box because its clock ticks.
      */}
      <div className='relative overflow-hidden'>
        <AnimatedSize>
          {line && <div aria-hidden='true' className='h-9' />}
        </AnimatedSize>
        <AnimatePresence initial={false}>
          {line && (
            <motion.div
              key='status'
              role={lineRoleOf(isDemonstrated)}
              className='absolute inset-x-0 bottom-0'
              {...LINE_PRESENCE}
            >
              <StatusLine
                line={line}
                listeningIntensity={listeningIntensity}
                onRetry={onRetry}
                isRetryPressed={isRetryPressed}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export type TrayKeyMode = 'mic' | 'send' | 'stop' | 'stop-listening';

const KEY_LABEL: Record<TrayKeyMode, string> = {
  mic: 'Dictate a prompt',
  send: 'Send the prompt',
  stop: 'Stop the answer',
  'stop-listening': 'Stop listening',
};

function glyphKeyOf(mode: TrayKeyMode) {
  if (mode === 'stop-listening') {
    return 'stop';
  }
  return mode;
}

function KeyGlyph({ mode }: { mode: TrayKeyMode }) {
  if (mode === 'mic') {
    return <MicIcon />;
  }
  if (mode === 'send') {
    return <ArrowUpIcon />;
  }
  return <StopGlyph />;
}

export function trayKeyModeOf(
  isListening: boolean,
  isAnswering: boolean,
  hasText: boolean
): TrayKeyMode {
  if (isListening) {
    return 'stop-listening';
  }
  if (isAnswering) {
    return 'stop';
  }
  if (hasText) {
    return 'send';
  }
  return 'mic';
}

type TrayKeyProps = {
  mode: TrayKeyMode;
  onPress: (mode: TrayKeyMode) => void;
  disabled?: boolean;
  /** Shows the key held down, for a demonstration that presses it. */
  isPressed?: boolean;
};

export function TrayKey({
  mode,
  onPress,
  disabled,
  isPressed = false,
}: TrayKeyProps) {
  return (
    <Button
      type='button'
      size='icon'
      aria-label={KEY_LABEL[mode]}
      disabled={disabled}
      onClick={() => onPress(mode)}
      className={pressedSolidOf(isPressed)}
    >
      <Swap swapKey={glyphKeyOf(mode)}>
        <KeyGlyph mode={mode} />
      </Swap>
    </Button>
  );
}

type ToolId = 'docs' | 'web' | 'code';

type Tool = {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
  step: string;
  stepMs: number;
  failure: string;
};

const TOOLS: Tool[] = [
  {
    id: 'docs',
    label: 'Search the docs',
    icon: <BookOpenIcon />,
    step: 'Searching the docs',
    stepMs: 1500,
    failure: 'The docs search timed out',
  },
  {
    id: 'web',
    label: 'Search the web',
    icon: <GlobeIcon />,
    step: 'Searching the web',
    stepMs: 1300,
    failure: 'The web search was refused',
  },
  {
    id: 'code',
    label: 'Run code',
    icon: <TerminalIcon />,
    step: 'Running the code',
    stepMs: 1200,
    failure: 'The code ran past its time limit',
  },
];

const READ_MS = 1100;

const WRITE_MS = 1700;

const WRITE_FAILURE = 'Lumen stopped responding';

const ANSWERED_HOLD_MS = 1800;

const STOPPED_HOLD_MS = 1800;

const FIRST_WORD_MS = 450;

const WORD_GAP_MS = 260;

const QUIET_INTENSITY = 0.12;

const MAX_FIELD_HEIGHT = 168;

const DICTATION =
  'Summarize the open pull requests and flag any that touch billing';

const IDLE_RUN = emptyRun({ id: 'answer', title: 'Answer' });

/** The piece opens on an answer that just landed, so the tray shows before anything plays. */
const ANSWERED_RUN = emptyRun({
  id: 'answer',
  title: 'Answer',
  status: 'done',
  startedAt: 0,
  endedAt: 4300,
});

const DEMO_PROMPTS = [
  DICTATION,
  'Which Brightmoor invoices are still unpaid?',
  'Draft a reply to the pricing question from Ostrava',
];

/** One answer in three fails, so the tray shows its error and Retry. */
const FAILING_ROUND = 3;

type PressKey = 'key' | 'retry';

type TrayFile = {
  id: string;
  name: string;
};

const SEED_FILES: TrayFile[] = [
  { id: 'seed-invoices', name: 'q3-invoices.csv' },
  { id: 'seed-pricing', name: 'brightmoor-pricing.pdf' },
];

type Outcome = 'answers' | 'fails';

const OUTCOMES: Segment<Outcome>[] = [
  { value: 'answers', label: 'Answers' },
  { value: 'fails', label: 'Fails' },
];

type TimedEvent = {
  at: number;
  event: RunEvent;
};

type Timeline = {
  events: TimedEvent[];
  endsAt: number;
};

type SentPrompt = {
  text: string;
  steps: PlanStep[];
};

function readTitleOf(fileCount: number) {
  if (fileCount === 0) {
    return 'Reading the question';
  }
  const files = countOf(fileCount, 'file');
  return `Reading ${files}`;
}

function toolOf(id: string) {
  return TOOLS.find((tool) => tool.id === id);
}

function stepMsOf(step: PlanStep) {
  if (step.id === 'read') {
    return READ_MS;
  }
  if (step.id === 'write') {
    return WRITE_MS;
  }
  const tool = toolOf(step.id);
  return tool?.stepMs ?? WRITE_MS;
}

function failureOf(step: PlanStep) {
  const tool = toolOf(step.id);
  return tool?.failure ?? WRITE_FAILURE;
}

/** The answer only does what it was given: a step for the files, one per tool that is on, then the writing. */
function planOf(fileCount: number, tools: ToolId[]): PlanStep[] {
  const steps: PlanStep[] = [
    { id: 'read', title: readTitleOf(fileCount), status: 'upcoming' },
  ];
  for (const tool of TOOLS) {
    const isOn = tools.includes(tool.id);
    if (isOn) {
      steps.push({ id: tool.id, title: tool.step, status: 'upcoming' });
    }
  }
  steps.push({ id: 'write', title: 'Writing the answer', status: 'upcoming' });
  return steps;
}

/** A failing answer breaks on its last tool, or on the writing when no tool is on. */
function failingStepIdOf(steps: PlanStep[]) {
  const toolSteps = steps.filter((step) => toolOf(step.id) !== undefined);
  const lastTool = toolSteps.at(-1);
  return lastTool?.id ?? 'write';
}

function timelineOf(steps: PlanStep[], shouldFail: boolean): Timeline {
  const events: TimedEvent[] = [];
  const failingId = failingStepIdOf(steps);
  let at = 0;
  for (const step of steps) {
    events.push({
      at,
      event: {
        type: 'step.updated',
        id: step.id,
        patch: { status: 'running' },
      },
    });
    at += stepMsOf(step);
    const isFailing = shouldFail && step.id === failingId;
    if (isFailing) {
      events.push({
        at,
        event: {
          type: 'step.updated',
          id: step.id,
          patch: { status: 'failed', detail: failureOf(step) },
        },
      });
      events.push({ at, event: { type: 'run.finished', status: 'failed' } });
      return { events, endsAt: at };
    }
    events.push({
      at,
      event: { type: 'step.updated', id: step.id, patch: { status: 'done' } },
    });
  }
  events.push({ at, event: { type: 'run.finished', status: 'done' } });
  return { events, endsAt: at };
}

function announcementOf(line: TrayLine | null) {
  if (!line) {
    return '';
  }
  const text = lineTextOf(line);
  if (line.kind === 'stopped') {
    return `${text}. Your prompt is back in the field`;
  }
  return text;
}

function toolsLabelOf(count: number) {
  const tools = countOf(count, 'tool');
  return `Tools, ${tools} on`;
}

function FileChips({
  files,
  onRemove,
}: {
  files: TrayFile[];
  onRemove: (id: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const hasFiles = files.length > 0;
  const fileIds = files.map((file) => file.id);
  const order = fileIds.join(' ');

  return (
    <ul
      aria-label='Attached files'
      className={cn('flex flex-wrap gap-1.5', hasFiles && 'px-1 pt-1')}
    >
      <AnimatePresence initial={false} mode='popLayout'>
        {files.map((file) => (
          <motion.li
            key={file.id}
            layout
            layoutDependency={order}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={chipTransitionOf(shouldReduceMotion)}
            className='bg-foreground/[0.05] flex h-6 max-w-full items-center gap-1 rounded-md ps-1.5 pe-0.5 text-xs'
          >
            <FileTextIcon className='text-muted-foreground size-3.5 shrink-0' />
            <span className='max-w-36 truncate'>{file.name}</span>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`Remove ${file.name}`}
              onClick={() => onRemove(file.id)}
              className='text-muted-foreground size-5'
            >
              <XIcon className='size-3' />
            </Button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function chipTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { duration: 0 };
  }
  return SPRING;
}

function ToolsMenu({
  tools,
  onToggle,
  disabled,
}: {
  tools: ToolId[];
  onToggle: (id: ToolId, isOn: boolean) => void;
  disabled: boolean;
}) {
  const count = tools.length;
  const hasTools = count > 0;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              disabled={disabled}
              render={
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  aria-label={toolsLabelOf(count)}
                  className='relative'
                />
              }
            />
          }
        >
          <SlidersIcon />
          {hasTools && (
            <span
              aria-hidden='true'
              className='chip-3d absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium [--chip:var(--primary)]'
            >
              <MotionNumber value={count} />
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent>Tools</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side='top' align='start' className='min-w-52'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Tools for this answer</DropdownMenuGroupLabel>
          {TOOLS.map((tool) => (
            <DropdownMenuCheckboxItem
              key={tool.id}
              checked={tools.includes(tool.id)}
              onCheckedChange={(isOn) => onToggle(tool.id, isOn)}
            >
              {tool.icon}
              {tool.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function withTool(tools: ToolId[], id: ToolId, isOn: boolean) {
  const others = tools.filter((tool) => tool !== id);
  if (isOn) {
    return [...others, id];
  }
  return others;
}

export default function Prompt01() {
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<TrayFile[]>(SEED_FILES);
  const [tools, setTools] = useState<ToolId[]>(['docs']);
  const [outcome, setOutcome] = useState<Outcome>('answers');
  const [listeningSince, setListeningSince] = useState<number | null>(null);
  const [wordsLeft, setWordsLeft] = useState(0);
  const [round, setRound] = useState(0);
  const [store] = useState(() => createRunStore(ANSWERED_RUN));
  const run = useRunSnapshot(store);
  const { schedule, clearAll } = useTimeouts();
  const { pressed, press } = usePress<PressKey>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftBeforeListening = useRef('');
  const lastPrompt = useRef<SentPrompt | null>(null);
  const fileCounter = useRef(0);
  const isListening = listeningSince !== null;
  const isAnswering = isWorking(run);
  const isFailed = run.status === 'failed';
  const hasText = draft.trim().length > 0;
  const keyMode = trayKeyModeOf(isListening, isAnswering, hasText);
  const isSpeaking = wordsLeft > 0;
  const listeningIntensity = levelIntensityOf(isSpeaking);
  const line = trayLineOf(run, listeningSince);
  const announcement = announcementOf(line);
  useAutosize(textareaRef, draft, MAX_FIELD_HEIGHT);

  function fold() {
    store.dispatch({ type: 'reset', snapshot: IDLE_RUN });
  }

  function startAnswer(steps: PlanStep[], shouldFail: boolean) {
    clearAll();
    store.dispatch({ type: 'reset', snapshot: IDLE_RUN });
    store.dispatch({ type: 'plan.set', steps });
    store.dispatch({ type: 'run.started' });
    const timeline = timelineOf(steps, shouldFail);
    for (const timed of timeline.events) {
      schedule(() => store.dispatch(timed.event), timed.at);
    }
    if (shouldFail) {
      return;
    }
    // A demonstration folds the tray itself when its next round starts, so the answered line holds through the loop.
    if (isAutoplaying) {
      return;
    }
    const foldAt = timeline.endsAt + ANSWERED_HOLD_MS;
    schedule(fold, foldAt);
  }

  function endListening() {
    clearAll();
    setListeningSince(null);
    setWordsLeft(0);
  }

  function startListening() {
    clearAll();
    draftBeforeListening.current = draft;
    setListeningSince(Date.now());
    const words = wordsOf(DICTATION);
    setWordsLeft(words.length);
    words.forEach((word, index) => {
      const wordDelay = index * WORD_GAP_MS;
      const delay = FIRST_WORD_MS + wordDelay;
      schedule(() => {
        setDraft((current) => appendWord(current, word));
        setWordsLeft((current) => current - 1);
      }, delay);
    });
  }

  function stopListening() {
    endListening();
    caretToEnd(textareaRef);
  }

  function cancelListening() {
    endListening();
    setDraft(draftBeforeListening.current);
    caretToEnd(textareaRef);
  }

  function send() {
    if (!hasText) {
      return;
    }
    if (isAnswering) {
      return;
    }
    if (isListening) {
      endListening();
    }
    const steps = planOf(files.length, tools);
    const shouldFail = outcome === 'fails';
    lastPrompt.current = { text: draft, steps };
    setDraft('');
    startAnswer(steps, shouldFail);
  }

  function stop() {
    if (!isAnswering) {
      return;
    }
    clearAll();
    const step = runningStepOf(run);
    if (step) {
      store.dispatch({
        type: 'step.updated',
        id: step.id,
        patch: { status: 'skipped' },
      });
    }
    store.dispatch({ type: 'run.finished', status: 'cancelled' });
    setDraft(lastPrompt.current?.text ?? '');
    caretToEnd(textareaRef);
    schedule(fold, STOPPED_HOLD_MS);
  }

  function retry() {
    const sent = lastPrompt.current;
    if (!sent) {
      return;
    }
    startAnswer(sent.steps, false);
  }

  function pressKey(mode: TrayKeyMode) {
    if (mode === 'mic') {
      startListening();
      return;
    }
    if (mode === 'stop-listening') {
      stopListening();
      return;
    }
    if (mode === 'stop') {
      stop();
      return;
    }
    send();
  }

  function handleFieldKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    send();
  }

  function handleEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    if (!isOwnKey(event)) {
      return;
    }
    if (isListening) {
      event.preventDefault();
      cancelListening();
      return;
    }
    if (isAnswering) {
      event.preventDefault();
      stop();
      return;
    }
    if (isFailed) {
      event.preventDefault();
      fold();
    }
  }

  function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const list = event.target.files;
    if (!list) {
      return;
    }
    const added = Array.from(list, (file) => {
      fileCounter.current += 1;
      return { id: `file-${fileCounter.current}`, name: file.name };
    });
    setFiles((current) => [...current, ...added]);
    event.target.value = '';
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function toggleTool(id: ToolId, isOn: boolean) {
    setTools((current) => withTool(current, id, isOn));
  }

  function resetDemo() {
    clearAll();
    store.dispatch({ type: 'reset', snapshot: ANSWERED_RUN });
    setDraft('');
    setOutcome('answers');
    setRound((current) => current + 1);
  }

  const demoPrompt = DEMO_PROMPTS[round % DEMO_PROMPTS.length];
  const demoPlan = planOf(files.length, tools);
  const answerMs = timelineOf(demoPlan, false).endsAt;
  const failureMs = timelineOf(demoPlan, true).endsAt;
  const isFailingRound = round % FAILING_ROUND === FAILING_ROUND - 1;
  const typing = typingSteps(demoPrompt, setDraft, {
    startAfter: 800,
    characterMs: 34,
  });
  const passing: AutoplayStep[] = [
    { after: 560, run: () => press('key') },
    { after: PRESS_LEAD_MS, run: () => pressKey('send') },
    { after: answerMs + 400, run: hold },
  ];
  const failing: AutoplayStep[] = [
    { after: 450, run: () => setOutcome('fails') },
    { after: 600, run: () => press('key') },
    { after: PRESS_LEAD_MS, run: () => pressKey('send') },
    { after: failureMs + 1100, run: () => setOutcome('answers') },
    { after: 700, run: () => press('retry') },
    { after: PRESS_LEAD_MS, run: retry },
    { after: answerMs + 400, run: hold },
  ];
  let ending = passing;
  if (isFailingRound) {
    ending = failing;
  }
  const steps = [{ after: 1600, run: fold }, ...typing, ...ending];
  const { ref, isInView, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2200,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onKeyDown={handleEscape}
      className='flex w-full max-w-[26rem] flex-col gap-3'
    >
      <ClockGate isActive={isInView}>
        <StatusTray
          run={run}
          listeningSince={listeningSince}
          listeningIntensity={listeningIntensity}
          onRetry={retry}
          isRetryPressed={pressed === 'retry'}
          isDemonstrated={isAutoplaying}
        >
          <div className='bg-card hairline-ring ring-foreground/12 dark:ring-foreground/15 has-[textarea:focus]:ring-ring/25 flex flex-col gap-1 rounded-[calc(var(--radius-2xl)-0.25rem)] p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-150 has-[textarea:focus]:ring-[3px]'>
            <FileChips files={files} onRemove={removeFile} />
            <Textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleFieldKeys}
              readOnly={isListening}
              aria-label='Prompt'
              placeholder='Ask Lumen about this project'
              className='max-h-none min-h-10 border-0 bg-transparent px-2 py-1.5 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent'
            />
            <div className='flex items-center gap-1.5 px-0.5 pb-0.5'>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                tabIndex={-1}
                aria-hidden='true'
                className='hidden'
                onChange={addFiles}
              />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      aria-label='Attach files'
                      disabled={isAnswering}
                      onClick={() => fileInputRef.current?.click()}
                    />
                  }
                >
                  <PaperclipIcon />
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
              <ToolsMenu
                tools={tools}
                onToggle={toggleTool}
                disabled={isAnswering}
              />
              <span className='flex-1' />
              <TrayKey
                mode={keyMode}
                onPress={pressKey}
                isPressed={pressed === 'key'}
              />
            </div>
          </div>
        </StatusTray>
        <div className='flex items-center justify-between gap-3 px-1'>
          <p className='text-muted-foreground text-xs'>Next answer</p>
          <Segments
            value={outcome}
            segments={OUTCOMES}
            onValueChange={setOutcome}
            label='Next answer'
            className='w-36'
          />
        </div>
      </ClockGate>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}

function levelIntensityOf(isSpeaking: boolean) {
  if (isSpeaking) {
    return 1;
  }
  return QUIET_INTENSITY;
}
