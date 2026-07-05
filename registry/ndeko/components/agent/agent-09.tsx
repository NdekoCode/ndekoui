'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { emptyRun, type ToolCall } from '@/registry/ndeko/lib/agent-run';
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
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Progress, ProgressLabel } from '@/registry/ndeko/ui/progress';

import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  fadePresence,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
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
  onSync,
}: {
  source: KnowledgeSource;
  state: SourceState;
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

function IndexingSignal({ source }: { source: KnowledgeSource }) {
  const progress = progressOf(source.job);
  const chunks = progress?.chunks ?? 0;
  const expected = progress?.expected;
  const value = shareOf(chunks, expected);
  const hasExpected = expected !== undefined;

  return (
    <Progress value={value} className='gap-1.5 pt-1'>
      <ProgressLabel className='text-muted-foreground text-xs font-normal'>
        Indexing <MotionNumber value={chunks} />
        {hasExpected && (
          <>
            {' '}
            of <MotionNumber value={expected} />
          </>
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

function SourceRow({
  source,
  onSync,
}: {
  source: KnowledgeSource;
  onSync?: (sourceId: string) => void;
}) {
  const fade = fadePresence();
  const state = sourceStateOf(source);
  const showsButton = showsButtonIn(state);

  return (
    <div className='flex items-start gap-3 py-2.5'>
      <span
        aria-hidden='true'
        className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4'
      >
        {KIND_GLYPH[source.kind]}
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[13px] leading-5 font-medium'>
          {source.name}
        </p>
        <p className='text-muted-foreground truncate text-xs leading-5'>
          <span className='sr-only'>{KIND_WORD[source.kind]}, </span>
          {source.detail}
        </p>
        <AnimatedSize>
          <div className='relative'>
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.div key={signalKeyOf(state)} {...fade}>
                <SourceSignal source={source} state={state} />
              </motion.div>
            </AnimatePresence>
          </div>
        </AnimatedSize>
      </div>
      <AnimatePresence initial={false}>
        {showsButton && (
          <motion.span key='sync' className='shrink-0' {...fade}>
            <SyncButton source={source} state={state} onSync={onSync} />
          </motion.span>
        )}
      </AnimatePresence>
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
    total += chunksOf(source);
  }
  return total;
}

export function KnowledgeSources({
  sources,
  onSync,
  addChoices = NO_CHOICES,
  onAdd,
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
      <ul aria-label='Sources' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {sources.map((source) => (
            <motion.li
              key={source.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <SourceRow source={source} onSync={onSync} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

type SourceDefinition = Omit<KnowledgeSource, 'job'>;

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

const ADDABLE: Record<'file' | 'site', SourceDefinition> = {
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

function jobStarted(
  id: string,
  sourceId: string,
  expected: number
): RunScriptStep['event'] {
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

function jobProgress(
  id: string,
  chunks: number,
  expected: number
): RunScriptStep['event'] {
  return { type: 'call.updated', id, patch: { output: { chunks, expected } } };
}

function jobDone(id: string, chunks: number): RunScriptStep['event'] {
  return {
    type: 'call.updated',
    id,
    patch: { status: 'done', output: { chunks } },
  };
}

const DOCS_CHUNKS = 1820;

const SCRIPT: RunScriptStep[] = [
  { after: 700, event: jobStarted('docs-1', 'docs', DOCS_CHUNKS) },
  { after: 700, event: jobProgress('docs-1', 240, DOCS_CHUNKS) },
  { after: 700, event: jobProgress('docs-1', 610, DOCS_CHUNKS) },
  {
    after: 300,
    event: {
      type: 'call.started',
      call: {
        id: 'drive-1',
        tool: 'index',
        label: 'Sync drive',
        status: 'running',
        input: { sourceId: 'drive' },
      },
    },
  },
  { after: 400, event: jobProgress('docs-1', 980, DOCS_CHUNKS) },
  { after: 700, event: jobProgress('docs-1', 1340, DOCS_CHUNKS) },
  {
    after: 500,
    event: {
      type: 'call.updated',
      id: 'drive-1',
      patch: { status: 'failed', error: DRIVE_ERROR },
    },
  },
  { after: 300, event: jobProgress('docs-1', 1620, DOCS_CHUNKS) },
  { after: 700, event: jobDone('docs-1', DOCS_CHUNKS) },
];

const INITIAL_RUN = emptyRun({ id: 'knowledge' });

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

const SYNC_MS = 1500;

const INDEX_STEPS = 4;

const INDEX_STEP_MS = 650;

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

export default function Agent09() {
  const [added, setAdded] = useState<SourceDefinition[]>([]);
  const { schedule, clearAll } = useTimeouts();
  const { ref, isInView, snapshot, store, restart } = useDemoRun(SCRIPT, {
    initial: INITIAL_RUN,
  });
  const definitions = [...SOURCES, ...added];
  const sources = withJobs(definitions, snapshot.calls);
  const announcement = announcementOf(sources);
  const hasAddedFile = added.some((source) => source.kind === 'file');
  const hasAddedSite = added.some((source) => source.kind === 'site');
  const addChoices: SourceKindChoice[] = [
    { kind: 'file', label: 'Upload files', isAvailable: !hasAddedFile },
    { kind: 'site', label: 'Connect a site', isAvailable: !hasAddedSite },
  ];

  function nextJobId(sourceId: string) {
    return `${sourceId}-job-${Date.now()}`;
  }

  function sync(sourceId: string) {
    const source = sources.find((candidate) => candidate.id === sourceId);
    if (!source) {
      return;
    }
    const jobId = nextJobId(sourceId);
    const chunks = chunksOf(source);
    const isDrive = sourceId === 'drive';
    const syncedChunks = chunks + 16;
    store.dispatch({
      type: 'call.started',
      call: {
        id: jobId,
        tool: 'index',
        label: `Sync ${sourceId}`,
        status: 'running',
        input: { sourceId },
      },
    });
    schedule(() => {
      if (isDrive) {
        store.dispatch(jobDone(jobId, syncedChunks));
        return;
      }
      store.dispatch(jobDone(jobId, chunks));
    }, SYNC_MS);
  }

  function add(kind: SourceKind) {
    const isFileOrSite = kind === 'file' || kind === 'site';
    if (!isFileOrSite) {
      return;
    }
    const definition = ADDABLE[kind];
    const expected = 640;
    const jobId = nextJobId(definition.id);
    setAdded((current) => [...current, definition]);
    store.dispatch(jobStarted(jobId, definition.id, expected));
    for (let step = 1; step <= INDEX_STEPS; step += 1) {
      const reached = expected * step;
      const chunks = Math.round(reached / INDEX_STEPS);
      const isLast = step === INDEX_STEPS;
      schedule(() => {
        if (isLast) {
          store.dispatch(jobDone(jobId, chunks));
          return;
        }
        store.dispatch(jobProgress(jobId, chunks, expected));
      }, step * INDEX_STEP_MS);
    }
  }

  function startOver() {
    clearAll();
    setAdded([]);
    restart();
  }

  return (
    <div ref={ref} className='flex w-full max-w-[30rem] flex-col gap-2'>
      <ClockGate isActive={isInView}>
        <KnowledgeSources
          sources={sources}
          onSync={sync}
          addChoices={addChoices}
          onAdd={add}
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
      <LiveRegion message={announcement} />
    </div>
  );
}
