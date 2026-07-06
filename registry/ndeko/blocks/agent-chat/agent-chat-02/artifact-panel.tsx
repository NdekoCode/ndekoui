'use client';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { CodeIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { useRevealedCount } from '@/registry/ndeko/ui/streamed-text';

import {
  CHANGES,
  FILE_NAME,
  sourceOf,
  VERSIONS,
  type CodeLine,
  type DiffKind,
} from './data';
import type { ApplyStatus, ArtifactView, Stage, Version } from './session';

const LINE_MS = 150;

const VERSION_SEGMENTS: Segment<'v1' | 'v2'>[] = [
  { value: 'v1', label: 'v1' },
  { value: 'v2', label: 'v2' },
];

const VIEW_SEGMENTS: Segment<ArtifactView>[] = [
  { value: 'code', label: 'Code' },
  { value: 'changes', label: 'Changes' },
];

const APPLY_LABELS: Record<MorphState, string> = {
  idle: 'Apply',
  busy: 'Applying',
  done: 'Applied',
};

const FIRST_VERSION_KEYS = new Set(VERSIONS[1].map((line) => line.key));

const ADDED_COUNT = CHANGES.filter((line) => line.kind === 'added').length;

const REMOVED_COUNT = CHANGES.filter((line) => line.kind === 'removed').length;

function statusOf(stage: Stage, version: Version) {
  if (stage === 1) {
    return 'Writing';
  }
  if (stage === 3) {
    return 'Revising';
  }
  return `Version ${version}`;
}

function applyStateOf(
  apply: ApplyStatus,
  isAppliedVersion: boolean
): MorphState {
  if (apply === 'busy') {
    return 'busy';
  }
  if (isAppliedVersion) {
    return 'done';
  }
  return 'idle';
}

function versionOf(value: 'v1' | 'v2'): Version {
  if (value === 'v2') {
    return 2;
  }
  return 1;
}

function lineNumberOf(index: number) {
  return index + 1;
}

/** A line that the revision added lights for a moment when it lands; the lines around it do not move. */
function landingClassOf(isRevised: boolean) {
  if (isRevised) {
    return 'bg-primary/0 transition-colors duration-1000 ease-out starting:bg-primary/25';
  }
  return 'transition-opacity duration-300 starting:opacity-0';
}

function CodeRows({
  lines,
  marksRevision,
}: {
  lines: CodeLine[];
  marksRevision: boolean;
}) {
  return (
    <ol className='min-w-max py-2 font-mono text-xs leading-5'>
      {lines.map((line, index) => {
        const isNew = !FIRST_VERSION_KEYS.has(line.key);
        const isRevised = marksRevision && isNew;
        return (
          <li
            key={line.key}
            className={cn('flex gap-3 px-3', landingClassOf(isRevised))}
          >
            <span className='text-muted-foreground/60 w-5 shrink-0 text-end tabular-nums select-none'>
              {lineNumberOf(index)}
            </span>
            <code className='whitespace-pre'>{line.text}</code>
          </li>
        );
      })}
    </ol>
  );
}

/** Only this list re-renders while the first version is written. */
function StreamedCode({ isActive }: { isActive: boolean }) {
  const total = VERSIONS[1].length;
  const count = useRevealedCount(total, isActive, LINE_MS);
  const lines = VERSIONS[1].slice(0, count);

  return <CodeRows lines={lines} marksRevision={false} />;
}

const DIFF_SIGN: Record<DiffKind, string> = {
  same: ' ',
  added: '+',
  removed: '-',
};

const DIFF_CLASS: Record<DiffKind, string> = {
  same: '',
  added: 'bg-success/10',
  removed: 'bg-destructive/10 text-muted-foreground line-through',
};

const DIFF_WORD: Record<DiffKind, string> = {
  same: '',
  added: 'Added: ',
  removed: 'Removed: ',
};

function ChangeRows() {
  return (
    <ol className='min-w-max py-2 font-mono text-xs leading-5'>
      {CHANGES.map((line) => (
        <li
          key={`${line.kind}-${line.key}`}
          className={cn('flex gap-3 px-3', DIFF_CLASS[line.kind])}
        >
          <span
            aria-hidden='true'
            className='text-muted-foreground w-5 shrink-0 text-center select-none'
          >
            {DIFF_SIGN[line.kind]}
          </span>
          <span className='sr-only'>{DIFF_WORD[line.kind]}</span>
          <code className='whitespace-pre'>{line.text}</code>
        </li>
      ))}
    </ol>
  );
}

export type ArtifactPanelProps = {
  stage: Stage;
  version: Version;
  view: ArtifactView;
  apply: ApplyStatus;
  appliedVersion: Version | null;
  pressed: string | null;
  isActive: boolean;
  onVersionChange: (version: Version) => void;
  onViewChange: (view: ArtifactView) => void;
  onApply: () => void;
  className?: string;
};

export function ArtifactPanel({
  stage,
  version,
  view,
  apply,
  appliedVersion,
  pressed,
  isActive,
  onVersionChange,
  onViewChange,
  onApply,
  className,
}: ArtifactPanelProps) {
  const isEmpty = stage === 0;
  const isWriting = stage === 1;
  const isReady = stage >= 2;
  const hasRevision = stage === 4;
  const showsChanges = hasRevision && view === 'changes';
  const showsCode = isReady && !showsChanges;
  const lines = VERSIONS[version];
  const status = statusOf(stage, version);
  const applyState = applyStateOf(apply, appliedVersion === version);

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <header className='flex items-center gap-2.5'>
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
        >
          <CodeIcon className='size-3.5' />
        </span>
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h3 className='truncate font-mono text-[13px] font-medium'>
            {FILE_NAME}
          </h3>
          {!isEmpty && (
            <Swap swapKey={status} className='text-muted-foreground text-xs'>
              {status}
            </Swap>
          )}
        </div>
        {isReady && <CopyButton text={sourceOf(lines)} label='Copy the code' />}
        {isReady && (
          <MorphButton
            type='button'
            size='sm'
            state={applyState}
            labels={APPLY_LABELS}
            onClick={onApply}
            className={pressedSolidOf(pressed === 'apply')}
          />
        )}
      </header>

      {hasRevision && (
        <div className='flex flex-wrap items-center gap-2'>
          <Segments
            label='Version'
            value={`v${version}`}
            segments={VERSION_SEGMENTS}
            onValueChange={(value) => onVersionChange(versionOf(value))}
          />
          <Segments
            label='View'
            value={view}
            segments={VIEW_SEGMENTS}
            onValueChange={onViewChange}
          />
          <span className='text-muted-foreground ms-auto text-xs tabular-nums'>
            <span className='text-success-foreground'>+{ADDED_COUNT}</span>{' '}
            <span className='text-destructive-ink'>-{REMOVED_COUNT}</span>
          </span>
        </div>
      )}

      <div className='bg-foreground/[0.04] min-h-0 flex-1 overflow-auto rounded-lg'>
        {isEmpty && (
          <p className='text-muted-foreground p-4 text-[13px]'>
            Nothing made yet. Ask for a section and its code is written here.
          </p>
        )}
        {isWriting && <StreamedCode isActive={isActive} />}
        {showsCode && <CodeRows lines={lines} marksRevision={hasRevision} />}
        {showsChanges && <ChangeRows />}
      </div>
    </div>
  );
}
