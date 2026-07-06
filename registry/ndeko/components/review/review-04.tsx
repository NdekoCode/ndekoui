'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  emptyRun,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  CheckIcon,
  FileTextIcon,
  RotateCcwIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { isShortcutKey } from './_parts/keys';
import { useContainerWidth } from './_parts/use-container-width';
import { countOf, pathPartsOf } from './_parts/words';

export type HunkLineKind = 'context' | 'removed' | 'added';

export type HunkLine = {
  id: string;
  kind: HunkLineKind;
  text: string;
  oldNumber: number | null;
  newNumber: number | null;
};

export type ReviewHunk = {
  id: string;
  header: string;
  lines: HunkLine[];
};

export type HunkVerdict = 'kept' | 'rejected';

export type DiffLayout = 'unified' | 'split';

type Placement = {
  key: string;
  line: HunkLine;
  row: number;
  column: 1 | 2;
  side: 'both' | 'old' | 'new';
};

/** Under this width of the piece, two columns of code would not fit, so the split folds back to unified. */
const SPLIT_MIN_WIDTH = 640;

const LINE_TONE: Record<HunkLineKind, string> = {
  context: '',
  removed: 'bg-destructive/10',
  added: 'bg-success/10',
};

const SIGN: Record<HunkLineKind, string> = {
  context: ' ',
  removed: '−',
  added: '+',
};

const SIGN_TONE: Record<HunkLineKind, string> = {
  context: 'text-muted-foreground',
  removed: 'text-destructive-ink',
  added: 'text-success-foreground',
};

const SPOKEN_KIND: Record<HunkLineKind, string> = {
  context: '',
  removed: 'Removed: ',
  added: 'Added: ',
};

function unifiedPlacementsOf(lines: HunkLine[]): Placement[] {
  return lines.map((line, index) => ({
    key: line.id,
    line,
    row: index + 1,
    column: 1,
    side: 'both',
  }));
}

/** Context sits on both sides; each run of removed lines faces the added lines that replace it. */
function splitPlacementsOf(lines: HunkLine[]): Placement[] {
  const placements: Placement[] = [];
  let row = 1;
  let removed: HunkLine[] = [];
  let added: HunkLine[] = [];

  function flush() {
    removed.forEach((line, index) => {
      placements.push({
        key: line.id,
        line,
        row: row + index,
        column: 1,
        side: 'old',
      });
    });
    added.forEach((line, index) => {
      placements.push({
        key: line.id,
        line,
        row: row + index,
        column: 2,
        side: 'new',
      });
    });
    const height = Math.max(removed.length, added.length);
    row += height;
    removed = [];
    added = [];
  }

  for (const line of lines) {
    if (line.kind === 'context') {
      flush();
      placements.push({ key: line.id, line, row, column: 1, side: 'old' });
      placements.push({
        key: `${line.id}-copy`,
        line,
        row,
        column: 2,
        side: 'new',
      });
      row += 1;
      continue;
    }
    if (line.kind === 'removed') {
      const startsNewChange = added.length > 0;
      if (startsNewChange) {
        flush();
      }
      removed.push(line);
      continue;
    }
    added.push(line);
  }
  flush();
  return placements;
}

function placementsOf(lines: HunkLine[], layout: DiffLayout) {
  if (layout === 'split') {
    return splitPlacementsOf(lines);
  }
  return unifiedPlacementsOf(lines);
}

function gridColumnsOf(layout: DiffLayout) {
  if (layout === 'split') {
    return 'grid-cols-[repeat(2,minmax(max-content,1fr))]';
  }
  return 'grid-cols-[minmax(max-content,1fr)]';
}

function numberText(number: number | null) {
  if (number === null) {
    return '';
  }
  return String(number);
}

function sideNumberOf(placement: Placement) {
  if (placement.side === 'new') {
    return placement.line.newNumber;
  }
  return placement.line.oldNumber;
}

function LineCell({ placement }: { placement: Placement }) {
  const { line } = placement;
  const isUnified = placement.side === 'both';

  return (
    <div
      className={cn(
        'flex min-h-5 items-stretch pe-3 font-mono text-xs leading-5',
        LINE_TONE[line.kind]
      )}
    >
      {isUnified && (
        <>
          <span className='text-muted-foreground/70 w-8 shrink-0 pe-1.5 text-end tabular-nums select-none'>
            {numberText(line.oldNumber)}
          </span>
          <span className='text-muted-foreground/70 w-8 shrink-0 pe-1.5 text-end tabular-nums select-none'>
            {numberText(line.newNumber)}
          </span>
        </>
      )}
      {!isUnified && (
        <span className='text-muted-foreground/70 w-8 shrink-0 pe-1.5 text-end tabular-nums select-none'>
          {numberText(sideNumberOf(placement))}
        </span>
      )}
      <span
        aria-hidden='true'
        className={cn(
          'w-4 shrink-0 text-center select-none',
          SIGN_TONE[line.kind]
        )}
      >
        {SIGN[line.kind]}
      </span>
      <span className='sr-only'>{SPOKEN_KIND[line.kind]}</span>
      <code className='whitespace-pre'>{line.text}</code>
    </div>
  );
}

const STAMP_IN = {
  initial: { opacity: 0, scale: 1.12 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.12, ease: EASE_OUT_STRONG },
} as const;

const STAMP_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.12 },
} as const;

function stampMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return STAMP_FADE;
  }
  return STAMP_IN;
}

const VERDICT_WORD: Record<HunkVerdict, string> = {
  kept: 'Kept',
  rejected: 'Rejected',
};

const VERDICT_COLOR: Record<HunkVerdict, string> = {
  kept: 'var(--success)',
  rejected: 'var(--destructive)',
};

const VERDICT_PAST: Record<HunkVerdict, string> = {
  kept: 'kept',
  rejected: 'rejected',
};

function isStreamingCall(call: ToolCall) {
  return call.status !== 'done';
}

function layoutTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { duration: 0 };
  }
  return { type: 'spring' as const, bounce: 0, duration: 0.4 };
}

function hunkLabelOf(
  hunk: ReviewHunk,
  index: number,
  total: number,
  verdict: HunkVerdict | undefined
) {
  const position = index + 1;
  const base = `Hunk ${position} of ${total}, ${hunk.header}`;
  if (!verdict) {
    return base;
  }
  return `${base}, ${VERDICT_WORD[verdict]}`;
}

function surfaceOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'bg-foreground/[0.035] dark:bg-foreground/[0.05]';
  }
  return 'bg-foreground/[0.02] dark:bg-foreground/[0.03]';
}

type HunkViewProps = {
  hunk: ReviewHunk;
  index: number;
  total: number;
  shownLines: number;
  isStreaming: boolean;
  verdict: HunkVerdict | undefined;
  layout: DiffLayout;
  isCurrent: boolean;
  onVerdict: (hunkId: string, verdict: HunkVerdict) => void;
  onUndo: (hunkId: string) => void;
  onFocusHunk: (hunkId: string) => void;
  registerHunk: (hunkId: string, node: HTMLElement | null) => void;
};

export function HunkView({
  hunk,
  index,
  total,
  shownLines,
  isStreaming,
  verdict,
  layout,
  isCurrent,
  onVerdict,
  onUndo,
  onFocusHunk,
  registerHunk,
}: HunkViewProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const stampMotion = stampMotionOf(shouldReduceMotion);
  const layoutTransition = layoutTransitionOf(shouldReduceMotion);
  const visibleLines = hunk.lines.slice(0, shownLines);
  const placements = placementsOf(visibleLines, layout);
  const isKept = verdict === 'kept';
  const isRejected = verdict === 'rejected';
  const hasVerdict = verdict !== undefined;
  const canDecide = !isStreaming && !hasVerdict;
  const position = index + 1;

  return (
    <section
      ref={(node) => registerHunk(hunk.id, node)}
      tabIndex={0}
      aria-label={hunkLabelOf(hunk, index, total, verdict)}
      onFocus={() => onFocusHunk(hunk.id)}
      className={cn(
        'focus-visible:ring-ring/25 flex flex-col overflow-hidden rounded-lg transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        surfaceOf(isCurrent)
      )}
    >
      <header className='flex min-h-9 items-center gap-2 ps-3 pe-1.5'>
        <span className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs'>
          {hunk.header}
        </span>
        <AnimatePresence initial={false} mode='popLayout'>
          {verdict && (
            <motion.span key={verdict} className='flex' {...stampMotion}>
              <Chip color={VERDICT_COLOR[verdict]}>
                {isKept && <CheckIcon />}
                {isRejected && <XIcon />}
                {VERDICT_WORD[verdict]}
              </Chip>
            </motion.span>
          )}
        </AnimatePresence>
        {hasVerdict && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => onUndo(hunk.id)}
            aria-label={`Undo the verdict on hunk ${position}`}
            className='text-muted-foreground h-7 px-2'
          >
            <RotateCcwIcon className='size-3.5' />
            Undo
          </Button>
        )}
        {!hasVerdict && (
          <span className='flex items-center gap-1'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canDecide}
              onClick={() => onVerdict(hunk.id, 'kept')}
            >
              Keep
              <Kbd className='ms-0.5 hidden @md:inline-flex'>Y</Kbd>
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={!canDecide}
              onClick={() => onVerdict(hunk.id, 'rejected')}
            >
              Reject
              <Kbd className='ms-0.5 hidden @md:inline-flex'>N</Kbd>
            </Button>
          </span>
        )}
      </header>
      <Fold open={!isRejected}>
        <div className='overflow-x-auto pb-1.5'>
          <div className={cn('grid w-max min-w-full', gridColumnsOf(layout))}>
            <AnimatePresence initial={false}>
              {placements.map((placement) => (
                <motion.div
                  key={placement.key}
                  layout='position'
                  transition={layoutTransition}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  style={{
                    gridRow: placement.row,
                    gridColumn: placement.column,
                  }}
                >
                  <LineCell placement={placement} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </Fold>
    </section>
  );
}

type HunkSource = {
  id: string;
  oldStart: number;
  newStart: number;
  /** Each line starts with its sign: a space for context, a minus, or a plus. */
  lines: string[];
};

const KIND_OF_SIGN: Record<string, HunkLineKind> = {
  ' ': 'context',
  '-': 'removed',
  '+': 'added',
};

function hunkOf(source: HunkSource): ReviewHunk {
  let oldNumber = source.oldStart;
  let newNumber = source.newStart;
  let oldCount = 0;
  let newCount = 0;
  const lines: HunkLine[] = source.lines.map((raw, index) => {
    const sign = raw.charAt(0);
    const kind = KIND_OF_SIGN[sign] ?? 'context';
    const text = raw.slice(1);
    const id = `${source.id}-${index}`;
    if (kind === 'context') {
      const line = { id, kind, text, oldNumber, newNumber };
      oldNumber += 1;
      newNumber += 1;
      oldCount += 1;
      newCount += 1;
      return line;
    }
    if (kind === 'removed') {
      const line = { id, kind, text, oldNumber, newNumber: null };
      oldNumber += 1;
      oldCount += 1;
      return line;
    }
    const line = { id, kind, text, oldNumber: null, newNumber };
    newNumber += 1;
    newCount += 1;
    return line;
  });
  const header = `@@ -${source.oldStart},${oldCount} +${source.newStart},${newCount} @@`;
  return { id: source.id, header, lines };
}

const FILE_PATH = 'src/billing/pallet-fee.ts';

const HUNKS: ReviewHunk[] = [
  hunkOf({
    id: 'imports',
    oldStart: 1,
    newStart: 1,
    lines: [
      " import { money } from '../money';",
      "-import { tierFor } from './tiers';",
      "+import { FLAT_FROM_PALLETS, tierFor } from './tiers';",
      " import type { Order } from './types';",
    ],
  }),
  hunkOf({
    id: 'constants',
    oldStart: 8,
    newStart: 8,
    lines: [
      ' export const TIER_RATES = [15.9, 15.2, 14.6];',
      '+export const FLAT_FEE_EUR = 18.4;',
      "+export const FLAT_FEE_START = '2026-10-01';",
      ' ',
    ],
  }),
  hunkOf({
    id: 'fee',
    oldStart: 14,
    newStart: 16,
    lines: [
      ' export function palletFee(order: Order) {',
      '+  if (isFlatOrder(order)) {',
      '+    return money(order.pallets * FLAT_FEE_EUR);',
      '+  }',
      '   const tier = tierFor(order.pallets);',
      '-  return money(order.pallets * TIER_RATES[tier]);',
      '+  const rate = TIER_RATES[tier];',
      '+  return money(order.pallets * rate);',
      ' }',
    ],
  }),
  hunkOf({
    id: 'legacy',
    oldStart: 18,
    newStart: 24,
    lines: [
      ' ',
      '-/** @deprecated Use palletFee. */',
      '-export const legacyPalletFee = palletFee;',
      '+function isFlatOrder(order: Order) {',
      '+  const isBulk = order.pallets >= FLAT_FROM_PALLETS;',
      '+  const isAfterStart = order.date >= FLAT_FEE_START;',
      '+  return isBulk && isAfterStart;',
      '+}',
    ],
  }),
];

function totalsOf(hunks: ReviewHunk[]) {
  let additions = 0;
  let deletions = 0;
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.kind === 'added') {
        additions += 1;
      }
      if (line.kind === 'removed') {
        deletions += 1;
      }
    }
  }
  return { additions, deletions };
}

const TOTALS = totalsOf(HUNKS);

const LINE_MS = 70;

const HUNK_GAP_MS = 260;

function scriptOf(hunks: ReviewHunk[]): RunScriptStep[] {
  const steps: RunScriptStep[] = [
    { after: 400, event: { type: 'run.started' } },
  ];
  for (const hunk of hunks) {
    steps.push({
      after: HUNK_GAP_MS,
      event: {
        type: 'call.started',
        call: {
          id: hunk.id,
          tool: 'edit_file',
          label: hunk.header,
          status: 'running',
          output: { lines: 0 },
        },
      },
    });
    for (let shown = 1; shown <= hunk.lines.length; shown += 1) {
      steps.push({
        after: LINE_MS,
        event: {
          type: 'call.updated',
          id: hunk.id,
          patch: { output: { lines: shown } },
        },
      });
    }
    steps.push({
      after: 0,
      event: { type: 'call.updated', id: hunk.id, patch: { status: 'done' } },
    });
  }
  steps.push({ after: 0, event: { type: 'run.finished', status: 'done' } });
  return steps;
}

const SCRIPT = scriptOf(HUNKS);

const INITIAL_RUN = emptyRun({ id: 'diff-review', title: FILE_PATH });

type LinesOutput = { lines: number };

function isLinesOutput(value: unknown): value is LinesOutput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return typeof (value as LinesOutput).lines === 'number';
}

function shownLinesOf(call: ToolCall) {
  if (isLinesOutput(call.output)) {
    return call.output.lines;
  }
  return 0;
}

function streamedHunksOf(run: RunSnapshot) {
  const streamed: { hunk: ReviewHunk; call: ToolCall }[] = [];
  for (const hunk of HUNKS) {
    const call = run.calls.find((candidate) => candidate.id === hunk.id);
    if (call) {
      streamed.push({ hunk, call });
    }
  }
  return streamed;
}

function reviewedWordsOf(reviewed: number, total: number): WordRollWord[] {
  const countWord = {
    key: 'reviewed',
    text: String(reviewed),
    node: <MotionNumber value={reviewed} />,
  };
  return [countWord, 'of', String(total), 'hunks', 'reviewed'];
}

const LAYOUTS: Segment<DiffLayout>[] = [
  { value: 'unified', label: 'Unified' },
  { value: 'split', label: 'Split' },
];

function layoutOf(choice: DiffLayout, isWide: boolean): DiffLayout {
  if (isWide) {
    return choice;
  }
  return 'unified';
}

function applyLabelsOf(keptCount: number): Record<MorphState, string> {
  const changes = countOf(keptCount, 'kept change');
  const idle = idleApplyLabelOf(keptCount, changes);
  return {
    idle,
    busy: 'Applying',
    done: 'Applied',
  };
}

function idleApplyLabelOf(keptCount: number, changes: string) {
  if (keptCount === 0) {
    return 'Nothing kept to apply';
  }
  return `Apply ${changes}`;
}

function positionOf(hunkId: string) {
  const index = HUNKS.findIndex((hunk) => hunk.id === hunkId);
  return index + 1;
}

const APPLYING_MS = 900;

export default function Review04() {
  const [verdicts, setVerdicts] = useState<Record<string, HunkVerdict>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [layoutChoice, setLayoutChoice] = useState<DiffLayout>('unified');
  const [applyState, setApplyState] = useState<MorphState>('idle');
  const [notice, setNotice] = useState('');
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const hunkNodes = useRef(new Map<string, HTMLElement>());
  const { schedule, clearAll } = useTimeouts();
  const { ref, snapshot, restart } = useDemoRun(SCRIPT, {
    initial: INITIAL_RUN,
  });
  const width = useContainerWidth(frame, 720);
  const isWide = width >= SPLIT_MIN_WIDTH;
  const layout = layoutOf(layoutChoice, isWide);
  const streamed = streamedHunksOf(snapshot);
  const hasNoHunk = streamed.length === 0;
  const reviewedCount = Object.keys(verdicts).length;
  const keptHunks = HUNKS.filter((hunk) => verdicts[hunk.id] === 'kept');
  const keptCount = keptHunks.length;
  const isAllReviewed = reviewedCount === HUNKS.length;
  const isApplied = applyState === 'done';
  const canApply = isAllReviewed && keptCount > 0;
  const { folder, name } = pathPartsOf(FILE_PATH);
  const reviewedWords = reviewedWordsOf(reviewedCount, HUNKS.length);

  function registerHunk(hunkId: string, node: HTMLElement | null) {
    if (node) {
      hunkNodes.current.set(hunkId, node);
      return;
    }
    hunkNodes.current.delete(hunkId);
  }

  function focusHunk(hunkId: string) {
    const node = hunkNodes.current.get(hunkId);
    node?.focus();
  }

  function streamedIds() {
    return streamed.map((entry) => entry.hunk.id);
  }

  function nextOpenAfter(
    hunkId: string,
    nextVerdicts: Record<string, HunkVerdict>
  ) {
    const ids = streamedIds();
    const start = ids.indexOf(hunkId);
    const later = ids.slice(start + 1);
    const earlier = ids.slice(0, start);
    const order = [...later, ...earlier];
    return order.find((id) => nextVerdicts[id] === undefined);
  }

  function decide(hunkId: string, verdict: HunkVerdict) {
    if (isApplied) {
      return;
    }
    const nextVerdicts = { ...verdicts, [hunkId]: verdict };
    setVerdicts(nextVerdicts);
    const position = positionOf(hunkId);
    setNotice(`Hunk ${position} ${VERDICT_PAST[verdict]}`);
    const nextId = nextOpenAfter(hunkId, nextVerdicts);
    focusHunk(nextId ?? hunkId);
  }

  function undo(hunkId: string) {
    setVerdicts((current) => {
      const next = { ...current };
      delete next[hunkId];
      return next;
    });
    setApplyState('idle');
    setNotice('Verdict undone');
    focusHunk(hunkId);
  }

  function move(step: number) {
    const ids = streamedIds();
    if (ids.length === 0) {
      return;
    }
    const currentIndex = ids.indexOf(currentId ?? '');
    const target = currentIndex + step;
    const bounded = Math.min(ids.length - 1, Math.max(0, target));
    focusHunk(ids[bounded]);
  }

  function targetHunkId() {
    if (currentId) {
      return currentId;
    }
    const ids = streamedIds();
    return ids.find((id) => verdicts[id] === undefined);
  }

  function isStreamedDone(hunkId: string) {
    const entry = streamed.find((candidate) => candidate.hunk.id === hunkId);
    return entry?.call.status === 'done';
  }

  function decideFromKeys(verdict: HunkVerdict) {
    const hunkId = targetHunkId();
    if (!hunkId) {
      return;
    }
    const hasVerdict = verdicts[hunkId] !== undefined;
    const isReady = isStreamedDone(hunkId);
    const canDecide = isReady && !hasVerdict;
    if (canDecide) {
      decide(hunkId, verdict);
    }
  }

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!isShortcutKey(event)) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'j') {
      event.preventDefault();
      move(1);
      return;
    }
    if (key === 'k') {
      event.preventDefault();
      move(-1);
      return;
    }
    if (key === 'y') {
      event.preventDefault();
      decideFromKeys('kept');
      return;
    }
    if (key === 'n') {
      event.preventDefault();
      decideFromKeys('rejected');
    }
  }

  function trackFocusLeaving(event: React.FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    const staysInside =
      next instanceof Node && event.currentTarget.contains(next);
    if (!staysInside) {
      setCurrentId(null);
    }
  }

  function apply() {
    if (!canApply) {
      return;
    }
    setApplyState('busy');
    schedule(() => {
      setApplyState('done');
      setNotice(`Applied ${countOf(keptCount, 'change')} to ${name}`);
    }, APPLYING_MS);
  }

  function replay() {
    clearAll();
    setVerdicts({});
    setCurrentId(null);
    setApplyState('idle');
    setNotice('');
    restart();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      onKeyDown={handleKeys}
      onBlur={trackFocusLeaving}
      className='bg-card hairline-ring ring-border @container flex w-full max-w-[52rem] flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex flex-wrap items-center gap-x-3 gap-y-2 px-1'>
        <span className='flex min-w-0 flex-1 basis-48 items-center gap-2'>
          <span className='keycap-3d text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md'>
            <FileTextIcon className='size-3.5' />
          </span>
          <span className='min-w-0 truncate font-mono text-[13px]'>
            <span className='text-muted-foreground'>{folder}</span>
            {name}
          </span>
          <span className='flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums'>
            <span className='text-success-foreground'>+{TOTALS.additions}</span>
            <span className='text-destructive-ink'>−{TOTALS.deletions}</span>
          </span>
        </span>
        <AnimatePresence initial={false}>
          {isWide && (
            <motion.span
              key='layout'
              className='flex'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Segments
                value={layoutChoice}
                segments={LAYOUTS}
                onValueChange={setLayoutChoice}
                label='Diff layout'
                className='w-40'
              />
            </motion.span>
          )}
        </AnimatePresence>
      </header>

      <div ref={setFrame} className='flex flex-col gap-2'>
        <ul aria-label='Hunks' className='flex flex-col gap-2'>
          <AnimatePresence initial={false}>
            {streamed.map((entry, index) => (
              <motion.li
                key={entry.hunk.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <HunkView
                  hunk={entry.hunk}
                  index={index}
                  total={HUNKS.length}
                  shownLines={shownLinesOf(entry.call)}
                  isStreaming={isStreamingCall(entry.call)}
                  verdict={verdicts[entry.hunk.id]}
                  layout={layout}
                  isCurrent={currentId === entry.hunk.id}
                  onVerdict={decide}
                  onUndo={undo}
                  onFocusHunk={setCurrentId}
                  registerHunk={registerHunk}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {hasNoHunk && (
          <p className='text-muted-foreground px-1 py-6 text-center text-[13px]'>
            The agent is preparing its changes
          </p>
        )}
      </div>

      <footer className='flex flex-wrap items-center gap-x-3 gap-y-2 px-1'>
        <span className='text-muted-foreground min-w-0 flex-1 text-xs'>
          <WordRoll words={reviewedWords} />
        </span>
        <span className='text-muted-foreground hidden items-center gap-1 text-xs @lg:flex'>
          <Kbd>J</Kbd>
          <Kbd>K</Kbd> move, <Kbd>Y</Kbd> keeps, <Kbd>N</Kbd> rejects
        </span>
        <AnimatedSize as='span' axis='width'>
          <span className='flex items-center gap-2'>
            <ReplayButton
              isShown={isApplied}
              onReplay={replay}
              label='Review again'
            />
            <MorphButton
              type='button'
              size='sm'
              state={applyState}
              labels={applyLabelsOf(keptCount)}
              disabled={!canApply}
              onClick={apply}
            />
          </span>
        </AnimatedSize>
      </footer>
      <LiveRegion message={notice} />
    </div>
  );
}
