'use client';

import { cn } from '@/registry/ndeko/lib/utils';

import {
  changesOf,
  fileOf,
  headerOf,
  HUNKS,
  type DiffLine,
  type Hunk,
  type LineKind,
} from './data';
import { LINE_MS } from './session';
import { inkClassOf, shownCountOf, useRevealedCount } from './stream';
import { useFollowBottom } from './use-follow-bottom';

const LINE_TONE: Record<LineKind, string> = {
  same: '',
  removed: 'bg-destructive/10',
  added: 'bg-success/10',
};

const SIGN: Record<LineKind, string> = {
  same: ' ',
  removed: '-',
  added: '+',
};

const SIGN_TONE: Record<LineKind, string> = {
  same: 'text-muted-foreground',
  removed: 'text-destructive-ink',
  added: 'text-success-foreground',
};

const SPOKEN_KIND: Record<LineKind, string> = {
  same: '',
  removed: 'Removed: ',
  added: 'Added: ',
};

export function ChangeCounts({ hunks }: { hunks: Hunk[] }) {
  const { additions, deletions } = changesOf(hunks);

  return (
    <span className='flex shrink-0 gap-1.5 font-mono text-xs tabular-nums'>
      <span className='text-success-foreground'>+{additions}</span>
      <span className='text-destructive-ink'>-{deletions}</span>
    </span>
  );
}

export function ModifiedTile() {
  return (
    <span className='chip-3d inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] font-mono text-[11px] font-semibold [--chip:var(--info)]'>
      <span aria-hidden='true'>M</span>
      <span className='sr-only'>Modified</span>
    </span>
  );
}

type CodeLineProps = {
  line: DiffLine;
  inkClass: string | undefined;
};

function CodeLine({ line, inkClass }: CodeLineProps) {
  return (
    <div
      className={cn(
        'flex min-h-5 items-stretch pe-3 font-mono text-xs leading-5',
        LINE_TONE[line.kind],
        inkClass
      )}
    >
      <span
        aria-hidden='true'
        className={cn(
          'w-6 shrink-0 text-center select-none',
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

type HunkLinesProps = {
  hunk: Hunk;
  isStreaming: boolean;
  isActive: boolean;
};

/**
 * Only the lines of the hunk being written re-render. Each line keeps its place before it is
 * written, so a hunk has its final height from its first line.
 */
function HunkLines({ hunk, isStreaming, isActive }: HunkLinesProps) {
  const total = hunk.lines.length;
  const isRunning = isStreaming && isActive;
  const count = useRevealedCount(total, isRunning, LINE_MS);
  const shown = shownCountOf(isStreaming, count, total);

  return (
    <div className='flex w-max min-w-full flex-col py-1'>
      {hunk.lines.map((line, index) => {
        const isShown = index < shown;
        return (
          <CodeLine
            key={index}
            line={line}
            inkClass={inkClassOf(isStreaming, isShown)}
          />
        );
      })}
    </div>
  );
}

/** A hunk rises in while the agent writes it. Coming back to the tab shows the hunks already there, still. */
function arrivalOf(isStreaming: boolean) {
  if (isStreaming) {
    return 'transition-[opacity,translate] duration-300 ease-(--ease-out-strong) starting:translate-y-1 starting:opacity-0';
  }
  return undefined;
}

function HunkCard({ hunk, isStreaming, isActive }: HunkLinesProps) {
  const file = fileOf(hunk.fileId);

  return (
    <li
      className={cn(
        'bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col rounded-lg',
        arrivalOf(isStreaming)
      )}
    >
      <div className='flex min-h-9 flex-wrap items-center gap-x-2 gap-y-0.5 px-2.5 py-1.5'>
        <ModifiedTile />
        <span className='min-w-0 flex-1 truncate font-mono text-xs'>
          {file.path}
        </span>
        <ChangeCounts hunks={[hunk]} />
        <span className='text-muted-foreground w-full font-mono text-[11px]'>
          {headerOf(hunk)}
        </span>
      </div>
      {/* The scroller is positioned: a hidden word for screen readers would widen the page otherwise. */}
      <div
        role='region'
        aria-label={`Changes to ${file.path}`}
        tabIndex={0}
        className='focus-visible:ring-ring/25 relative overflow-x-auto rounded-b-lg outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
      >
        <HunkLines hunk={hunk} isStreaming={isStreaming} isActive={isActive} />
      </div>
    </li>
  );
}

type DiffViewProps = {
  hunksStarted: number;
  hunksDone: number;
  isActive: boolean;
};

export function DiffView({ hunksStarted, hunksDone, isActive }: DiffViewProps) {
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const hunks = HUNKS.slice(0, hunksStarted);
  const isEmpty = hunksStarted === 0;

  return (
    <div
      ref={scrollerRef}
      onScroll={updatePinned}
      className='min-h-0 flex-1 overflow-y-auto'
    >
      <div ref={contentRef} className='flex flex-col gap-2'>
        {isEmpty && (
          <p className='text-muted-foreground text-[13px] leading-relaxed'>
            No change yet. Each hunk shows here as the agent writes it.
          </p>
        )}
        <ol aria-label='Hunks' className='flex flex-col gap-2'>
          {hunks.map((hunk, index) => (
            <HunkCard
              key={hunk.id}
              hunk={hunk}
              isStreaming={index >= hunksDone}
              isActive={isActive}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}
