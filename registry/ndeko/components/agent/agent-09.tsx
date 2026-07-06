'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  emptyRun,
  reduceRun,
  seriesColorOf,
  type RunAgent,
  type RunEvent,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  LifeBuoyIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  UploadIcon,
} from '@/registry/ndeko/lib/icons';
import {
  fadePresence,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { applyBatchAt, restingOf } from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { Progress, ProgressLabel } from '@/registry/ndeko/ui/progress';

import { AgentTile } from './_parts/agent-tile';
import { RESEARCHER } from './_parts/crew';

import { RelativeTime } from './_parts/relative-time';
import { countOf } from './_parts/words';

export type SourceKind = 'file' | 'site' | 'drive' | 'helpdesk';

export type SourceState =
  'queued' | 'indexing' | 'ready' | 'syncing' | 'failed';

export type KnowledgeSource = {
  id: string;
  kind: SourceKind;
  name: string;
  /** What it is, in a few words: "PDF, 2.4 MB", "312 pages". */
  detail: string;
  /** Chunks indexed at the last finished sync. */
  chunks: number;
  lastSyncAt?: number;
  /** The latest sync job. Its output carries `{ chunks, expected }` while it indexes. */
  job?: ToolCall;
};

/** An answer being written, and the sources it has read so far. */
export type SourceAnswer = {
  /** Who answers: its name is shown and its colour is the light of the sources it uses. */
  agent: Pick<RunAgent, 'name' | 'series'>;
  question: string;
  /** The sources the answer draws on, in the order it reached them. */
  usedIds: string[];
  isDone: boolean;
};

const KIND_GLYPH: Record<SourceKind, React.ReactNode> = {
  file: <FileTextIcon />,
  site: <GlobeIcon />,
  drive: <FolderIcon />,
  helpdesk: <LifeBuoyIcon />,
};

const KIND_WORD: Record<SourceKind, string> = {
  file: 'Uploaded file',
  site: 'Docs site',
  drive: 'Shared drive folder',
  helpdesk: 'Help center',
};

const RESYNC_LABELS: Record<MorphState, string> = {
  idle: 'Re-sync',
  busy: 'Syncing',
  done: 'Synced',
};

const RETRY_LABELS: Record<MorphState, string> = {
  idle: 'Retry',
  busy: 'Retrying',
  done: 'Synced',
};

const CONFIRM_MS = 1600;

const COUNT = new Intl.NumberFormat('en-US');

type JobProgress = {
  chunks: number;
  expected?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === 'object';
  return isObject && value !== null;
}

function numberAt(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value === 'number') {
    return value;
  }
  return undefined;
}

function progressOf(job: ToolCall | undefined): JobProgress | null {
  const output = job?.output;
  if (!isRecord(output)) {
    return null;
  }
  const chunks = numberAt(output, 'chunks');
  if (chunks === undefined) {
    return null;
  }
  return { chunks, expected: numberAt(output, 'expected') };
}

export function sourceStateOf(source: KnowledgeSource): SourceState {
  const job = source.job;
  const hasSynced = source.lastSyncAt !== undefined;
  if (!job) {
    if (hasSynced) {
      return 'ready';
    }
    return 'queued';
  }
  if (job.status === 'failed') {
    return 'failed';
  }
  if (job.status === 'running') {
    if (hasSynced) {
      return 'syncing';
    }
    return 'indexing';
  }
  if (job.status === 'done') {
    return 'ready';
  }
  return 'queued';
}

function chunksOf(source: KnowledgeSource) {
  const progress = progressOf(source.job);
  return progress?.chunks ?? source.chunks;
}

/**
 * What a source holds for good: the count of its last finished sync. A sync under way does not
 * count yet, so the total of the header moves once, when the sync ends.
 */
function settledChunksOf(source: KnowledgeSource) {
  const isDone = source.job?.status === 'done';
  if (isDone) {
    return chunksOf(source);
  }
  return source.chunks;
}

function shareOf(part: number, total: number | undefined) {
  if (!total) {
    return 0;
  }
  const ratio = part / total;
  const share = ratio * 100;
  return Math.min(100, share);
}

function lastSyncOf(source: KnowledgeSource) {
  const job = source.job;
  const isDone = job?.status === 'done';
  if (isDone) {
    return job?.endedAt;
  }
  return source.lastSyncAt;
}

function morphStateOf(isSyncing: boolean, isConfirming: boolean): MorphState {
  if (isSyncing) {
    return 'busy';
  }
  if (isConfirming) {
    return 'done';
  }
  return 'idle';
}

function SyncButton({
  source,
  state,
  isPressed,
  onSync,
}: {
  source: KnowledgeSource;
  state: SourceState;
  isPressed: boolean;
  onSync?: (sourceId: string) => void;
}) {
  const isSyncing = state === 'syncing';
  const isFailed = state === 'failed';
  const [shownSyncing, setShownSyncing] = useState(isSyncing);
  const [isConfirming, setIsConfirming] = useState(false);

  const hasSyncChanged = shownSyncing !== isSyncing;
  if (hasSyncChanged) {
    setShownSyncing(isSyncing);
    const hasFinished = !isSyncing && !isFailed;
    if (hasFinished) {
      setIsConfirming(true);
    }
  }

  useEffect(() => {
    if (!isConfirming) {
      return;
    }
    const timer = setTimeout(() => setIsConfirming(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [isConfirming]);

  const morphState = morphStateOf(isSyncing, isConfirming);
  const labels = labelsOf(isFailed);
  const idleIcon = idleIconOf(isFailed);
  const accessibleLabel = accessibleLabelOf(morphState, isFailed, source.name);

  function sync() {
    onSync?.(source.id);
  }

  return (
    <MorphButton
      type='button'
      variant='outline'
      size='sm'
      state={morphState}
      labels={labels}
      idleIcon={idleIcon}
      onClick={sync}
      aria-label={accessibleLabel}
      className={pressedQuietOf(isPressed)}
    />
  );
}

function labelsOf(isFailed: boolean) {
  if (isFailed) {
    return RETRY_LABELS;
  }
  return RESYNC_LABELS;
}

function idleIconOf(isFailed: boolean) {
  if (isFailed) {
    return <RotateCcwIcon />;
  }
  return <RefreshCwIcon />;
}

function accessibleLabelOf(
  morphState: MorphState,
  isFailed: boolean,
  name: string
) {
  const labels = labelsOf(isFailed);
  const word = labels[morphState];
  return `${word} ${name}`;
}

/**
 * A count that climbs while a source is indexed is plain text in a box of fixed width: it changes
 * too often for digits that roll, and nothing beside it moves when it gains a digit.
 */
function IndexingSignal({ source }: { source: KnowledgeSource }) {
  const progress = progressOf(source.job);
  const chunks = progress?.chunks ?? 0;
  const expected = progress?.expected;
  const value = shareOf(chunks, expected);
  const hasExpected = expected !== undefined;

  return (
    <Progress value={value} className='gap-1.5 pb-0.5'>
      <ProgressLabel className='text-muted-foreground text-xs leading-5 font-normal'>
        Indexing{' '}
        <span className='inline-block min-w-[5ch] text-end tabular-nums'>
          {COUNT.format(chunks)}
        </span>
        {hasExpected && (
          <span className='tabular-nums'> of {COUNT.format(expected)}</span>
        )}{' '}
        chunks
      </ProgressLabel>
    </Progress>
  );
}

function SourceSignal({
  source,
  state,
}: {
  source: KnowledgeSource;
  state: SourceState;
}) {
  const chunks = chunksOf(source);
  const lastSyncAt = lastSyncOf(source);
  const hasSynced = lastSyncAt !== undefined;

  if (state === 'indexing') {
    return <IndexingSignal source={source} />;
  }
  if (state === 'failed') {
    return (
      <p className='text-destructive-ink text-xs leading-5'>
        {source.job?.error}
      </p>
    );
  }
  if (state === 'queued') {
    return (
      <p className='text-muted-foreground text-xs leading-5'>
        Waits its turn to be indexed
      </p>
    );
  }
  return (
    <p className='text-muted-foreground text-xs leading-5'>
      <MotionNumber value={chunks} /> chunks
      {hasSynced && (
        <>
          , synced <RelativeTime at={lastSyncAt ?? 0} />
        </>
      )}
    </p>
  );
}

function signalKeyOf(state: SourceState) {
  if (state === 'syncing') {
    return 'ready';
  }
  return state;
}

function showsButtonIn(state: SourceState) {
  const isReady = state === 'ready';
  const isSyncing = state === 'syncing';
  const isFailed = state === 'failed';
  return isReady || isSyncing || isFailed;
}

type LitStyle = React.CSSProperties & { '--lit': string };

const UNLIT: LitStyle = { '--lit': 'transparent' };

function litStyleOf(color: string | null): LitStyle {
  if (color === null) {
    return UNLIT;
  }
  return { '--lit': color };
}

function rowTintOf(isLit: boolean) {
  if (isLit) {
    return 'bg-(--lit)/8';
  }
  return undefined;
}

/** The ring settles around the tile from a little larger, once, when the source lights. */
function haloOf(isLit: boolean) {
  if (isLit) {
    return 'scale-100 opacity-100';
  }
  return 'scale-110 opacity-0';
}

function SourceRow({
  source,
  litColor,
  isSyncPressed,
  onSync,
}: {
  source: KnowledgeSource;
  /** The colour of the agent whose answer uses the source now, or null while nothing reads it. */
  litColor: string | null;
  isSyncPressed: boolean;
  onSync?: (sourceId: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const fade = fadePresence();
  const state = sourceStateOf(source);
  const showsButton = showsButtonIn(state);
  const isLit = litColor !== null;

  return (
    <div
      data-lit={isLit}
      className={cn(
        'flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors duration-300 ease-(--ease-out-strong)',
        rowTintOf(isLit)
      )}
      style={litStyleOf(litColor)}
    >
      <span className='relative shrink-0'>
        <span
          aria-hidden='true'
          className={cn(
            'absolute -inset-1 rounded-[10px] shadow-[0_0_0_2px_color-mix(in_oklab,var(--lit)_55%,transparent)] transition-[opacity,scale] duration-300 ease-(--ease-out-strong)',
            haloOf(isLit)
          )}
        />
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground relative flex size-8 items-center justify-center rounded-lg [&_svg]:size-4'
        >
          {KIND_GLYPH[source.kind]}
        </span>
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[13px] leading-5 font-medium'>
          {source.name}
        </p>
        <p className='text-muted-foreground truncate text-xs leading-5'>
          <span className='sr-only'>{KIND_WORD[source.kind]}, </span>
          {source.detail}
          {isLit && <span className='sr-only'>, used by the answer</span>}
        </p>
        <AnimatePresence initial={false}>
          <motion.div
            key={signalKeyOf(state)}
            className='overflow-hidden'
            {...rowPresence}
          >
            <SourceSignal source={source} state={state} />
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {showsButton && (
          <motion.span key='sync' className='shrink-0' {...fade}>
            <SyncButton
              source={source}
              state={state}
              isPressed={isSyncPressed}
              onSync={onSync}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function answerLineOf(answer: SourceAnswer) {
  const name = answer.agent.name;
  const usedCount = answer.usedIds.length;
  if (!answer.isDone) {
    return `${name} is answering`;
  }
  if (usedCount === 0) {
    return `${name} answered without a source`;
  }
  return `${name} answered from ${countOf(usedCount, 'source')}`;
}

function AnswerTrace({ answer }: { answer: SourceAnswer }) {
  const { agent, question } = answer;

  return (
    <div className='bg-foreground/[0.04] mt-2 flex flex-col gap-1 rounded-lg p-3'>
      <p className='text-muted-foreground flex items-center gap-2 text-xs leading-5'>
        <AgentTile name={agent.name} series={agent.series} size='sm' />
        <WordRoll text={answerLineOf(answer)} />
      </p>
      <p className='text-[13px] leading-5 text-pretty'>
        &ldquo;{question}&rdquo;
      </p>
    </div>
  );
}

export type SourceKindChoice = {
  kind: SourceKind;
  label: string;
  isAvailable: boolean;
};

export type KnowledgeSourcesProps = {
  sources: KnowledgeSource[];
  /** Re-sync for a ready source, Retry for a failed one. */
  onSync?: (sourceId: string) => void;
  /** The Add source menu: one entry per way in. */
  addChoices?: SourceKindChoice[];
  onAdd?: (kind: SourceKind) => void;
  /** The answer being written from these sources: each source it uses lights in the colour of its agent. */
  answer?: SourceAnswer | null;
  /** The source whose sync button a demonstration holds down. */
  pressedSyncId?: string | null;
  title?: string;
  description?: string;
  className?: string;
};

const ADD_GLYPH: Partial<Record<SourceKind, React.ReactNode>> = {
  file: <UploadIcon />,
  site: <GlobeIcon />,
};

const NO_CHOICES: SourceKindChoice[] = [];

function totalChunksOf(sources: KnowledgeSource[]) {
  let total = 0;
  for (const source of sources) {
    total += settledChunksOf(source);
  }
  return total;
}

function litColorOf(answer: SourceAnswer | null, sourceId: string) {
  if (!answer) {
    return null;
  }
  const isUsed = answer.usedIds.includes(sourceId);
  if (!isUsed) {
    return null;
  }
  return seriesColorOf(answer.agent.series);
}

export function KnowledgeSources({
  sources,
  onSync,
  addChoices = NO_CHOICES,
  onAdd,
  answer = null,
  pressedSyncId = null,
  title = 'Knowledge',
  description,
  className,
}: KnowledgeSourcesProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const totalChunks = totalChunksOf(sources);
  const hasChoices = addChoices.length > 0;
  const isEmpty = sources.length === 0;

  return (
    <section
      aria-label={title}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-1 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex items-start justify-between gap-3 pb-1'>
        <div className='min-w-0'>
          <h3 className='text-sm font-medium'>{title}</h3>
          <p className='text-muted-foreground text-xs leading-5'>
            {countOf(sources.length, 'source')},{' '}
            <MotionNumber value={totalChunks} /> chunks
            {description && <>. {description}</>}
          </p>
        </div>
        {hasChoices && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button type='button' variant='outline' size='sm' />}
            >
              <PlusIcon />
              Add source
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {addChoices.map((choice) => (
                <DropdownMenuItem
                  key={choice.kind}
                  disabled={!choice.isAvailable}
                  onClick={() => onAdd?.(choice.kind)}
                >
                  {ADD_GLYPH[choice.kind]}
                  {choice.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      {isEmpty && (
        <p className='text-muted-foreground py-6 text-center text-[13px]'>
          No sources yet. Add a file or a site to start.
        </p>
      )}
      <ul aria-label='Sources' className='-mx-2 flex flex-col'>
        <AnimatePresence initial={false}>
          {sources.map((source) => (
            <motion.li
              key={source.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <SourceRow
                source={source}
                litColor={litColorOf(answer, source.id)}
                isSyncPressed={pressedSyncId === source.id}
                onSync={onSync}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <AnimatePresence initial={false}>
        {answer && (
          <motion.div key='answer' className='overflow-hidden' {...rowPresence}>
            <AnswerTrace answer={answer} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

type SourceDefinition = Omit<KnowledgeSource, 'job'>;

type AddableKind = 'file' | 'site';

const MINUTE_MS = 60_000;

const LOADED_AT = Date.now();

function minutesAgo(minutes: number) {
  return LOADED_AT - minutes * MINUTE_MS;
}

const SOURCES: SourceDefinition[] = [
  {
    id: 'contract',
    kind: 'file',
    name: 'Brightmoor supply contract.pdf',
    detail: 'PDF, 2.4 MB, 38 pages',
    chunks: 412,
    lastSyncAt: minutesAgo(2 * 24 * 60),
  },
  {
    id: 'docs',
    kind: 'site',
    name: 'docs.fernhill.example',
    detail: 'Docs site, 312 pages',
    chunks: 0,
  },
  {
    id: 'drive',
    kind: 'drive',
    name: 'Finance drive / Vendors',
    detail: 'Shared folder, 86 files',
    chunks: 2340,
    lastSyncAt: minutesAgo(64),
  },
  {
    id: 'help',
    kind: 'helpdesk',
    name: 'Brightmoor help center',
    detail: 'Help center, 140 articles',
    chunks: 968,
    lastSyncAt: minutesAgo(12),
  },
];

const ADDABLE: Record<AddableKind, SourceDefinition> = {
  file: {
    id: 'price-list',
    kind: 'file',
    name: 'Larkfield price list 2026.pdf',
    detail: 'PDF, 860 KB, 9 pages',
    chunks: 0,
  },
  site: {
    id: 'larkfield-site',
    kind: 'site',
    name: 'help.larkfield.example',
    detail: 'Docs site, 74 pages',
    chunks: 0,
  },
};

const DRIVE_ERROR =
  'Access to the drive expired. Retry reconnects with your account.';

function jobStarted(id: string, sourceId: string, expected: number): RunEvent {
  return {
    type: 'call.started',
    call: {
      id,
      tool: 'index',
      label: `Index ${sourceId}`,
      status: 'running',
      input: { sourceId },
      output: { chunks: 0, expected },
    },
  };
}

function syncStarted(id: string, sourceId: string): RunEvent {
  return {
    type: 'call.started',
    call: {
      id,
      tool: 'index',
      label: `Sync ${sourceId}`,
      status: 'running',
      input: { sourceId },
    },
  };
}

function jobProgress(id: string, chunks: number, expected: number): RunEvent {
  return { type: 'call.updated', id, patch: { output: { chunks, expected } } };
}

function jobDone(id: string, chunks: number): RunEvent {
  return {
    type: 'call.updated',
    id,
    patch: { status: 'done', output: { chunks } },
  };
}

const DOCS_CHUNKS = 1820;

const ADDED_CHUNKS = 640;

/** What a re-sync of the drive finds: sixteen chunks more than before. */
const DRIVE_GAIN = 16;

const QUESTION = 'Which discount applies when we order more than 500 units?';

type KnowledgeState = {
  run: RunSnapshot;
  added: SourceDefinition[];
  answer: SourceAnswer | null;
};

type KnowledgeAction =
  | { type: 'events'; events: RunEvent[] }
  | { type: 'sync'; sourceId: string; jobId: string }
  | { type: 'synced'; jobId: string; chunks: number }
  | { type: 'add'; kind: AddableKind; jobId: string }
  | { type: 'ask' }
  | { type: 'use'; sourceId: string }
  | { type: 'answered' };

type KnowledgeStep = SessionStep<KnowledgeState, KnowledgeAction>;

const INITIAL: KnowledgeState = {
  run: emptyRun({ id: 'knowledge' }),
  added: [],
  answer: null,
};

function sourceIdOf(call: ToolCall) {
  const input = call.input ?? {};
  const sourceId = input.sourceId;
  if (typeof sourceId === 'string') {
    return sourceId;
  }
  return '';
}

function latestJobOf(calls: ToolCall[], sourceId: string) {
  const jobs = calls.filter((call) => sourceIdOf(call) === sourceId);
  return jobs.at(-1);
}

function withJobs(definitions: SourceDefinition[], calls: ToolCall[]) {
  return definitions.map((definition) => {
    const job = latestJobOf(calls, definition.id);
    return { ...definition, job };
  });
}

function sourcesOf(state: KnowledgeState) {
  const definitions = [...SOURCES, ...state.added];
  return withJobs(definitions, state.run.calls);
}

function withSync(
  state: KnowledgeState,
  sourceId: string,
  jobId: string,
  now: number
) {
  const job = latestJobOf(state.run.calls, sourceId);
  const isBusy = job?.status === 'running';
  if (isBusy) {
    return state;
  }
  const started = syncStarted(jobId, sourceId);
  const run = reduceRun(state.run, started, now);
  return { ...state, run };
}

/** The script and the timer a person's click starts may both land the same sync: only the first one counts. */
function withSyncLanded(
  state: KnowledgeState,
  jobId: string,
  chunks: number,
  now: number
) {
  const job = state.run.calls.find((call) => call.id === jobId);
  const isRunning = job?.status === 'running';
  if (!isRunning) {
    return state;
  }
  const landed = jobDone(jobId, chunks);
  const run = reduceRun(state.run, landed, now);
  return { ...state, run };
}

function withAdded(
  state: KnowledgeState,
  kind: AddableKind,
  jobId: string,
  now: number
) {
  const definition = ADDABLE[kind];
  const isKnown = state.added.some((source) => source.id === definition.id);
  if (isKnown) {
    return state;
  }
  const added = [...state.added, definition];
  const started = jobStarted(jobId, definition.id, ADDED_CHUNKS);
  const run = reduceRun(state.run, started, now);
  return { ...state, added, run };
}

function withUse(state: KnowledgeState, sourceId: string) {
  const answer = state.answer;
  if (!answer) {
    return state;
  }
  const isUsed = answer.usedIds.includes(sourceId);
  if (isUsed) {
    return state;
  }
  const usedIds = [...answer.usedIds, sourceId];
  return { ...state, answer: { ...answer, usedIds } };
}

function withAnswered(state: KnowledgeState) {
  const answer = state.answer;
  if (!answer) {
    return state;
  }
  return { ...state, answer: { ...answer, isDone: true } };
}

function applyAt(
  state: KnowledgeState,
  action: KnowledgeAction,
  now: number
): KnowledgeState {
  if (action.type === 'sync') {
    return withSync(state, action.sourceId, action.jobId, now);
  }
  if (action.type === 'synced') {
    return withSyncLanded(state, action.jobId, action.chunks, now);
  }
  if (action.type === 'add') {
    return withAdded(state, action.kind, action.jobId, now);
  }
  if (action.type === 'ask') {
    const answer: SourceAnswer = {
      agent: RESEARCHER,
      question: QUESTION,
      usedIds: [],
      isDone: false,
    };
    return { ...state, answer };
  }
  if (action.type === 'use') {
    return withUse(state, action.sourceId);
  }
  if (action.type === 'answered') {
    return withAnswered(state);
  }
  const run = applyBatchAt(state.run, action, now);
  return { ...state, run };
}

/** Times are stamped when an action lands, as a backend would stream it. */
function reducer(state: KnowledgeState, action: KnowledgeAction) {
  return applyAt(state, action, Date.now());
}

/** The sources were synced minutes or days ago, so the resting state is stamped on the same clock. */
function applyAfterLoading(
  state: KnowledgeState,
  action: KnowledgeAction,
  sinceStart: number
) {
  return applyAt(state, action, LOADED_AT + sinceStart);
}

function landing(after: number, ...events: RunEvent[]): KnowledgeStep {
  return { after, action: { type: 'events', events } };
}

const SYNC_MS = 1500;

const INDEX_STEPS = 4;

const INDEX_STEP_MS = 650;

const DRIVE_RETRY_ID = 'drive-2';

const DRIVE_SYNCED_CHUNKS = 2340 + DRIVE_GAIN;

/** The failed drive is retried by the demonstration after this long; a person who took over finds it waiting. */
const RETRY_AFTER_MS = 2200;

const SCRIPT: KnowledgeStep[] = [
  landing(700, jobStarted('docs-1', 'docs', DOCS_CHUNKS)),
  landing(700, jobProgress('docs-1', 240, DOCS_CHUNKS)),
  landing(700, jobProgress('docs-1', 610, DOCS_CHUNKS)),
  landing(300, syncStarted('drive-1', 'drive')),
  landing(400, jobProgress('docs-1', 980, DOCS_CHUNKS)),
  landing(700, jobProgress('docs-1', 1340, DOCS_CHUNKS)),
  landing(500, {
    type: 'call.updated',
    id: 'drive-1',
    patch: { status: 'failed', error: DRIVE_ERROR },
  }),
  landing(300, jobProgress('docs-1', 1620, DOCS_CHUNKS)),
  landing(700, jobDone('docs-1', DOCS_CHUNKS)),
  {
    after: RETRY_AFTER_MS,
    by: 'demo',
    press: 'drive',
    action: { type: 'sync', sourceId: 'drive', jobId: DRIVE_RETRY_ID },
  },
  {
    after: SYNC_MS,
    action: {
      type: 'synced',
      jobId: DRIVE_RETRY_ID,
      chunks: DRIVE_SYNCED_CHUNKS,
    },
  },
  { after: 1400, action: { type: 'ask' } },
  { after: 1100, action: { type: 'use', sourceId: 'contract' } },
  { after: 1000, action: { type: 'use', sourceId: 'help' } },
  { after: 1200, action: { type: 'answered' } },
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, applyAfterLoading),
  script: SCRIPT,
  loopAfter: 3400,
};

function lastChangeOf(job: ToolCall | undefined) {
  if (job?.endedAt !== undefined) {
    return job.endedAt;
  }
  if (job?.startedAt !== undefined) {
    return job.startedAt;
  }
  return -Infinity;
}

function announcementOf(sources: KnowledgeSource[]) {
  let latest: KnowledgeSource | undefined;
  let latestTime = -Infinity;
  for (const source of sources) {
    const time = lastChangeOf(source.job);
    if (time >= latestTime) {
      latest = source;
      latestTime = time;
    }
  }
  if (!latest?.job) {
    return '';
  }
  const state = sourceStateOf(latest);
  const chunks = chunksOf(latest);
  if (state === 'failed') {
    return `${latest.name} failed to sync: ${latest.job.error ?? ''}`;
  }
  if (state === 'ready') {
    return `${latest.name} is up to date, ${chunks} chunks`;
  }
  return `${latest.name} is syncing`;
}

function answerAnnouncementOf(
  answer: SourceAnswer | null,
  sources: KnowledgeSource[]
) {
  if (!answer) {
    return '';
  }
  const lastId = answer.usedIds.at(-1);
  const last = sources.find((source) => source.id === lastId);
  if (answer.isDone) {
    return answerLineOf(answer);
  }
  if (!last) {
    return `${answer.agent.name} is answering: ${answer.question}`;
  }
  return `${answer.agent.name} reads ${last.name}`;
}

function syncedChunksOf(source: KnowledgeSource) {
  const chunks = chunksOf(source);
  if (source.id === 'drive') {
    return chunks + DRIVE_GAIN;
  }
  return chunks;
}

function isAddable(kind: SourceKind): kind is AddableKind {
  return kind === 'file' || kind === 'site';
}

/** A job started by a click is named after the moment of the click, so two syncs of one source never share an id. */
function nextJobIdOf(sourceId: string) {
  return `${sourceId}-job-${Date.now()}`;
}

export default function Agent09() {
  const { schedule, clearAll } = useTimeouts();
  const { ref, isInView, isAutoplaying, state, act, pressed, restart } =
    useSession(SESSION);
  const sources = sourcesOf(state);
  const announcement = announcementOf(sources);
  const answerAnnouncement = answerAnnouncementOf(state.answer, sources);
  const hasAddedFile = state.added.some((source) => source.kind === 'file');
  const hasAddedSite = state.added.some((source) => source.kind === 'site');
  const addChoices: SourceKindChoice[] = [
    { kind: 'file', label: 'Upload files', isAvailable: !hasAddedFile },
    { kind: 'site', label: 'Connect a site', isAvailable: !hasAddedSite },
  ];

  function sync(sourceId: string) {
    const source = sources.find((candidate) => candidate.id === sourceId);
    if (!source) {
      return;
    }
    const jobId = nextJobIdOf(sourceId);
    const chunks = syncedChunksOf(source);
    act({ type: 'sync', sourceId, jobId });
    schedule(() => act({ type: 'synced', jobId, chunks }), SYNC_MS);
  }

  function add(kind: SourceKind) {
    if (!isAddable(kind)) {
      return;
    }
    const definition = ADDABLE[kind];
    const jobId = nextJobIdOf(definition.id);
    act({ type: 'add', kind, jobId });
    for (let step = 1; step <= INDEX_STEPS; step += 1) {
      const reached = ADDED_CHUNKS * step;
      const chunks = Math.round(reached / INDEX_STEPS);
      const isLast = step === INDEX_STEPS;
      schedule(() => {
        if (isLast) {
          act({ type: 'events', events: [jobDone(jobId, chunks)] });
          return;
        }
        const progress = jobProgress(jobId, chunks, ADDED_CHUNKS);
        act({ type: 'events', events: [progress] });
      }, step * INDEX_STEP_MS);
    }
  }

  function startOver() {
    clearAll();
    restart();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[33.5rem] w-full max-w-[30rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <KnowledgeSources
          sources={sources}
          onSync={sync}
          addChoices={addChoices}
          onAdd={add}
          answer={state.answer}
          pressedSyncId={pressed}
          description='Researcher searches these before it answers'
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={startOver}
          className='text-muted-foreground'
        >
          <RotateCcwIcon />
          Start over
        </Button>
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
      <LiveRegion message={spokenUnless(isAutoplaying, answerAnnouncement)} />
    </div>
  );
}
