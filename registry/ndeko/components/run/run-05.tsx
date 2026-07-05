'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { formatTokens } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ChevronDownIcon, FileIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold } from '@/registry/ndeko/ui/chat-motion';

import { CompactOffer, contextAnnouncementOf } from './_parts/compact-offer';
import {
  foldableTokensOf,
  freeTokensOf,
  LEVEL_WORD,
  levelOf,
  PART_FILL,
  percentOf,
  RESERVE_STYLE,
  shareOf,
  usedTokensOf,
  type Compaction,
  type ContextBudget,
  type ContextItem,
  type ContextPart,
  type ContextPartId,
} from './_parts/context';
import { ContextHeader } from './_parts/context-header';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { TokenCount } from './_parts/token-count';
import {
  FILLING_SESSION,
  useContextSession,
  type CompactStatus,
} from './_parts/use-context-demo';

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type BarSegment = {
  id: ContextPartId;
  /** Where the segment starts on the bar and how much of it is its own, both from 0 to 1. */
  start: number;
  share: number;
};

/** The order of the parts along the bar. The summary sits where the turns it replaces were. */
const BAR_ORDER: ContextPartId[] = [
  'system',
  'tools',
  'files',
  'summary',
  'conversation',
];

/** The summary is drawn last, over the conversation, so it can cover the turns it is folding. */
const PAINT_ORDER: ContextPartId[] = [
  'system',
  'tools',
  'files',
  'conversation',
  'summary',
];

const BAR_TRAVEL =
  'transition-transform duration-500 ease-(--ease-out-strong) motion-reduce:transition-none';

function tokensOfPart(budget: ContextBudget, id: ContextPartId) {
  const part = budget.parts.find((candidate) => candidate.id === id);
  return part?.tokens ?? 0;
}

function segmentsOf(budget: ContextBudget) {
  const segments: BarSegment[] = [];
  let start = 0;
  for (const id of BAR_ORDER) {
    const tokens = tokensOfPart(budget, id);
    const share = shareOf(tokens, budget);
    segments.push({ id, start, share });
    start += share;
  }
  return segments;
}

/**
 * While the context is compacted, the summary spreads over the turns it folds. When the compaction
 * lands it shrinks to its own size and the turns that stay slide against it: the bar folds.
 */
function withFolding(segments: BarSegment[], foldingShare: number) {
  return segments.map((segment) => {
    if (segment.id !== 'summary') {
      return segment;
    }
    return { ...segment, share: segment.share + foldingShare };
  });
}

function foldingShareOf(budget: ContextBudget, compactStatus: CompactStatus) {
  if (compactStatus !== 'compacting') {
    return 0;
  }
  const folding = foldableTokensOf(budget);
  return shareOf(folding, budget);
}

function paintedSegmentsOf(segments: BarSegment[]) {
  const painted: BarSegment[] = [];
  for (const id of PAINT_ORDER) {
    const segment = segments.find((candidate) => candidate.id === id);
    if (segment) {
      painted.push(segment);
    }
  }
  return painted;
}

/** A segment is the whole bar, moved to its start and scaled to its share: no width to lay out. */
function segmentStyleOf(segment: BarSegment): React.CSSProperties {
  const offset = segment.start * 100;
  return {
    backgroundColor: PART_FILL[segment.id],
    transform: `translateX(${offset}%) scaleX(${segment.share})`,
  };
}

/** A gap after a segment: a mark of the surface behind the bar, moved to where the segment ends. */
function gapStyleOf(segment: BarSegment): React.CSSProperties {
  const end = segment.start + segment.share;
  const offset = end * 100;
  return { transform: `translateX(${offset}%)` };
}

function isFilled(segment: BarSegment) {
  return segment.share > 0;
}

function spokenUsageOf(budget: ContextBudget) {
  const used = usedTokensOf(budget);
  const level = levelOf(budget);
  const usedText = formatTokens(used);
  const limitText = formatTokens(budget.limit);
  return `${usedText} of ${limitText} tokens used, ${LEVEL_WORD[level]}`;
}

function PartDot({ fill }: { fill: string }) {
  return (
    <span
      aria-hidden='true'
      className='size-2 shrink-0 rounded-full'
      style={{ backgroundColor: fill }}
    />
  );
}

function SegmentBar({
  budget,
  compactStatus,
}: {
  budget: ContextBudget;
  compactStatus: CompactStatus;
}) {
  const used = usedTokensOf(budget);
  const reservePercent = percentOf(budget.reserve, budget);
  const spoken = spokenUsageOf(budget);
  const foldingShare = foldingShareOf(budget, compactStatus);
  const laidOut = segmentsOf(budget);
  const segments = withFolding(laidOut, foldingShare);
  const painted = paintedSegmentsOf(segments);
  const filled = segments.filter(isFilled);

  return (
    <div
      role='meter'
      aria-label='Context used'
      aria-valuemin={0}
      aria-valuemax={budget.limit}
      aria-valuenow={used}
      aria-valuetext={spoken}
      className='bg-foreground/[0.05] relative h-3 overflow-hidden rounded-full'
    >
      {painted.map((segment) => (
        <span
          key={segment.id}
          className={cn('absolute inset-0 origin-left', BAR_TRAVEL)}
          style={segmentStyleOf(segment)}
        />
      ))}
      {filled.map((segment) => (
        <span
          key={segment.id}
          className={cn('absolute inset-0', BAR_TRAVEL)}
          style={gapStyleOf(segment)}
        >
          <span className='bg-card absolute inset-y-0 start-0 w-0.5' />
        </span>
      ))}
      <span
        className='border-card absolute inset-y-0 end-0 border-s-2'
        style={{ ...RESERVE_STYLE, width: `${reservePercent}%` }}
      />
    </div>
  );
}

function PartRow({ part }: { part: ContextPart }) {
  return (
    <div className='flex h-8 items-center gap-2.5 px-2 text-[13px]'>
      <PartDot fill={PART_FILL[part.id]} />
      <span className='min-w-0 flex-1 truncate'>{part.label}</span>
      <TokenCount tokens={part.tokens} className='text-muted-foreground' />
    </div>
  );
}

function FileRow({
  file,
  onRemove,
}: {
  file: ContextItem;
  onRemove?: (itemId: string) => void;
}) {
  const canRemove = onRemove !== undefined;

  return (
    <div className='flex h-8 items-center gap-2.5 ps-6 pe-1 text-[13px]'>
      <FileIcon className='text-muted-foreground size-3.5 shrink-0' />
      <span className='min-w-0 flex-1 truncate font-mono text-xs'>
        {file.label}
      </span>
      <TokenCount tokens={file.tokens} className='text-muted-foreground' />
      {canRemove && (
        <button
          type='button'
          aria-label={`Remove ${file.label} from the context`}
          onClick={() => onRemove?.(file.id)}
          className='text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 inline-flex size-6 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px] active:scale-[0.97]'
        >
          <XIcon className='size-3.5' />
        </button>
      )}
    </div>
  );
}

function FilesRow({
  part,
  onRemove,
}: {
  part: ContextPart;
  onRemove?: (itemId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const hasFiles = part.items.length > 0;

  function toggle() {
    setIsOpen((current) => !current);
  }

  return (
    <div>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggle}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-start text-[13px] outline-none focus-visible:ring-[3px]'
      >
        <PartDot fill={PART_FILL[part.id]} />
        <span className='min-w-0 flex-1 truncate'>
          {part.label}
          <span className='text-muted-foreground ms-1.5 tabular-nums'>
            {part.items.length}
          </span>
        </span>
        <TokenCount tokens={part.tokens} className='text-muted-foreground' />
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={panelId}>
        <ul aria-label='Files in the context'>
          <AnimatePresence initial={false}>
            {part.items.map((file) => (
              <motion.li
                key={file.id}
                className='overflow-hidden'
                {...rowPresence}
              >
                <FileRow file={file} onRemove={onRemove} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {!hasFiles && (
          <p className='text-muted-foreground ps-6 text-xs leading-8'>
            No file left in the context
          </p>
        )}
      </Fold>
    </div>
  );
}

function LegendRow({
  part,
  onRemoveItem,
}: {
  part: ContextPart;
  onRemoveItem?: (itemId: string) => void;
}) {
  if (part.id === 'files') {
    return <FilesRow part={part} onRemove={onRemoveItem} />;
  }
  return <PartRow part={part} />;
}

export type ContextWindowBarProps = {
  budget: ContextBudget;
  onRemoveItem?: (itemId: string) => void;
  onCompact?: () => void;
  compactStatus?: CompactStatus;
  canCompact?: boolean;
  compaction?: Compaction | null;
  /** Shows Compact held down, for a demonstration that presses it. */
  isCompactPressed?: boolean;
  className?: string;
};

export function ContextWindowBar({
  budget,
  onRemoveItem,
  onCompact,
  compactStatus = 'idle',
  canCompact = false,
  compaction = null,
  isCompactPressed = false,
  className,
}: ContextWindowBarProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const free = freeTokensOf(budget);
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <ContextHeader budget={budget} titleId={titleId} />

      <SegmentBar budget={budget} compactStatus={compactStatus} />

      <ul aria-label='What fills the context' className='-mx-2 flex flex-col'>
        <AnimatePresence initial={false}>
          {budget.parts.map((part) => (
            <motion.li
              key={part.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <LegendRow part={part} onRemoveItem={onRemoveItem} />
            </motion.li>
          ))}
        </AnimatePresence>
        <li className='flex h-8 items-center gap-2.5 px-2 text-[13px]'>
          <span
            aria-hidden='true'
            className='bg-foreground/[0.08] size-2 shrink-0 rounded-full'
          />
          <span className='min-w-0 flex-1 truncate'>Free</span>
          <TokenCount tokens={free} className='text-muted-foreground' />
        </li>
        <li className='flex h-8 items-center gap-2.5 px-2 text-[13px]'>
          <span
            aria-hidden='true'
            className='size-2 shrink-0 rounded-full'
            style={RESERVE_STYLE}
          />
          <span className='min-w-0 flex-1 truncate'>Held for the answer</span>
          <TokenCount
            tokens={budget.reserve}
            className='text-muted-foreground'
          />
        </li>
      </ul>

      <CompactOffer
        budget={budget}
        canCompact={canCompact}
        compactStatus={compactStatus}
        compaction={compaction}
        onCompact={onCompact}
        isPressed={isCompactPressed}
      />
    </section>
  );
}

export default function Run05() {
  const {
    ref,
    isInView,
    isAutoplaying,
    canReplay,
    pressed,
    budget,
    compaction,
    compactStatus,
    canCompact,
    removeFile,
    compact,
    replay,
  } = useContextSession(FILLING_SESSION);
  const level = levelOf(budget);
  const announcement = contextAnnouncementOf(
    level,
    LEVEL_WORD[level],
    compaction
  );

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[29.5rem] w-full max-w-[26rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <ContextWindowBar
          budget={budget}
          onRemoveItem={removeFile}
          onCompact={compact}
          compactStatus={compactStatus}
          canCompact={canCompact}
          compaction={compaction}
          isCompactPressed={pressed === 'compact'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton
          isShown={canReplay}
          onReplay={replay}
          label='Replay the conversation'
        />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
