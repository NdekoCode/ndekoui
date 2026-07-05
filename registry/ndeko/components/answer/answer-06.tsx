'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  CheckIcon,
  FileTextIcon,
  GripVerticalIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { Switch } from '@/registry/ndeko/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { LabTile } from './_parts/lab-tile';
import { useContainerWidth } from './_parts/use-container-width';

export type ArtifactVersion = {
  id: string;
  label: string;
  lines: string[];
};

export type DiffLine = {
  key: string;
  kind: 'same' | 'added' | 'removed';
  text: string;
};

/** Below this width of the piece, the panel opens under the chat instead of beside it. */
const SPLIT_MIN_WIDTH = 640;

const CHAT_MIN_PX = 200;

const PANEL_MIN_PX = 300;

const DEFAULT_PANEL_PERCENT = 58;

const KEY_STEP = 2;

const SHIFT_STEP = 10;

const APPLYING_MS = 800;

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

function emptyTable(rows: number, columns: number) {
  const table: number[][] = [];
  for (let row = 0; row <= rows; row += 1) {
    const width = columns + 1;
    const cells = Array.from({ length: width }, () => 0);
    table.push(cells);
  }
  return table;
}

function commonLengths(before: string[], after: string[]) {
  const table = emptyTable(before.length, after.length);
  for (let row = before.length - 1; row >= 0; row -= 1) {
    for (let column = after.length - 1; column >= 0; column -= 1) {
      const isSame = before[row] === after[column];
      if (isSame) {
        const diagonal = table[row + 1][column + 1];
        table[row][column] = diagonal + 1;
        continue;
      }
      const below = table[row + 1][column];
      const right = table[row][column + 1];
      table[row][column] = Math.max(below, right);
    }
  }
  return table;
}

export function lineDiffOf(before: string[], after: string[]): DiffLine[] {
  const table = commonLengths(before, after);
  const lines: DiffLine[] = [];
  let row = 0;
  let column = 0;
  while (row < before.length && column < after.length) {
    const isSame = before[row] === after[column];
    if (isSame) {
      lines.push({
        key: `s${row}-${column}`,
        kind: 'same',
        text: after[column],
      });
      row += 1;
      column += 1;
      continue;
    }
    const keptByRemoving = table[row + 1][column];
    const keptByAdding = table[row][column + 1];
    const removesFirst = keptByRemoving >= keptByAdding;
    if (removesFirst) {
      lines.push({ key: `r${row}`, kind: 'removed', text: before[row] });
      row += 1;
      continue;
    }
    lines.push({ key: `a${column}`, kind: 'added', text: after[column] });
    column += 1;
  }
  while (row < before.length) {
    lines.push({ key: `r${row}`, kind: 'removed', text: before[row] });
    row += 1;
  }
  while (column < after.length) {
    lines.push({ key: `a${column}`, kind: 'added', text: after[column] });
    column += 1;
  }
  return lines;
}

function plainLinesOf(version: ArtifactVersion): DiffLine[] {
  return version.lines.map((text, index) => ({
    key: `p${index}`,
    kind: 'same',
    text,
  }));
}

const HEADING = /^#\s+/;

function isHeading(text: string) {
  return HEADING.test(text);
}

function headingTextOf(text: string) {
  return text.replace(HEADING, '');
}

const LINE_TONE: Record<DiffLine['kind'], string> = {
  same: '',
  added: 'bg-success/10',
  removed: 'text-muted-foreground line-through decoration-muted-foreground/60',
};

const GUTTER: Record<DiffLine['kind'], string> = {
  same: '',
  added: '+',
  removed: '−',
};

const GUTTER_TONE: Record<DiffLine['kind'], string> = {
  same: '',
  added: 'text-success-foreground',
  removed: 'text-destructive-ink',
};

const SPOKEN_KIND: Record<DiffLine['kind'], string> = {
  same: '',
  added: 'Added: ',
  removed: 'Removed: ',
};

function DocumentLine({
  line,
  showsGutter,
}: {
  line: DiffLine;
  showsGutter: boolean;
}) {
  const heading = isHeading(line.text);

  return (
    <li
      className={cn(
        'flex gap-2 rounded-md px-1.5 py-0.5',
        LINE_TONE[line.kind]
      )}
    >
      {showsGutter && (
        <span
          aria-hidden='true'
          className={cn(
            'w-3 shrink-0 text-center font-mono text-xs leading-6',
            GUTTER_TONE[line.kind]
          )}
        >
          {GUTTER[line.kind]}
        </span>
      )}
      <span className='sr-only'>{SPOKEN_KIND[line.kind]}</span>
      {heading && (
        <span className='min-w-0 text-[15px] leading-6 font-semibold text-balance'>
          {headingTextOf(line.text)}
        </span>
      )}
      {!heading && (
        <span className='min-w-0 text-[13px] leading-6'>{line.text}</span>
      )}
    </li>
  );
}

function applyStateOf(
  versionId: string,
  appliedId: string | null,
  applyingId: string | null
): MorphState {
  if (applyingId === versionId) {
    return 'busy';
  }
  if (appliedId === versionId) {
    return 'done';
  }
  return 'idle';
}

const APPLY_LABELS: Record<MorphState, string> = {
  idle: 'Apply',
  busy: 'Applying',
  done: 'Applied',
};

const CONTENT_SWAP = {
  initial: { opacity: 0, filter: 'blur(2px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
} as const;

const CONTENT_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function contentMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return CONTENT_FADE;
  }
  return CONTENT_SWAP;
}

export type ArtifactPanelProps = {
  title: string;
  versions: ArtifactVersion[];
  versionId: string;
  onVersionChange: (versionId: string) => void;
  appliedId: string | null;
  applyingId: string | null;
  onApply: (versionId: string) => void;
  showsChanges: boolean;
  onShowsChangesChange: (showsChanges: boolean) => void;
  id?: string;
  className?: string;
};

export function ArtifactPanel({
  title,
  versions,
  versionId,
  onVersionChange,
  appliedId,
  applyingId,
  onApply,
  showsChanges,
  onShowsChangesChange,
  id,
  className,
}: ArtifactPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const contentMotion = contentMotionOf(shouldReduceMotion);
  const index = versions.findIndex((version) => version.id === versionId);
  const version = versions[index] ?? versions[0];
  const previous = versions[index - 1];
  const hasPrevious = previous !== undefined;
  const isDiffing = showsChanges && hasPrevious;
  const lines = linesOf(version, previous, isDiffing);
  const applyState = applyStateOf(version.id, appliedId, applyingId);
  const contentKey = `${version.id}-${String(isDiffing)}`;
  const copyText = version.lines.join('\n');

  function changeVersion(values: unknown[]) {
    const [next] = values;
    const match = versions.find((candidate) => candidate.id === next);
    if (match) {
      onVersionChange(match.id);
    }
  }

  return (
    <section
      id={id}
      aria-label={`${title}, ${version.label}`}
      className={cn('flex min-w-0 flex-col gap-3', className)}
    >
      <header className='flex flex-col gap-2.5'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='keycap-3d text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md'>
            <FileTextIcon className='size-3.5' />
          </span>
          <h3 className='min-w-0 flex-1 truncate font-mono text-[13px]'>
            {title}
          </h3>
          <CopyButton text={copyText} label={`Copy ${version.label}`} />
          <MorphButton
            type='button'
            size='sm'
            state={applyState}
            labels={APPLY_LABELS}
            onClick={() => onApply(version.id)}
          />
        </div>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <ToggleGroup
            aria-label='Versions'
            value={[version.id]}
            onValueChange={changeVersion}
            travel
            size='sm'
            indicatorClassName={THUMB}
            className='bg-foreground/[0.05] rounded-lg p-0.5'
          >
            {versions.map((candidate) => {
              const isApplied = candidate.id === appliedId;
              return (
                <ToggleGroupItem
                  key={candidate.id}
                  value={candidate.id}
                  aria-label={versionLabelOf(candidate, isApplied)}
                  className='h-6 gap-1 rounded-md px-2.5 text-xs'
                >
                  {candidate.label}
                  <AnimatePresence initial={false}>
                    {isApplied && (
                      <motion.span
                        key='applied'
                        className='text-success-foreground inline-flex'
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CheckIcon className='size-3' strokeWidth={2.5} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <label className='text-muted-foreground flex cursor-pointer items-center gap-2 text-xs'>
            Changes
            <Switch
              checked={isDiffing}
              disabled={!hasPrevious}
              onCheckedChange={(checked) => onShowsChangesChange(checked)}
            />
          </label>
        </div>
      </header>
      <AnimatedSize>
        <div className='relative'>
          <AnimatePresence initial={false} mode='popLayout'>
            <motion.ol
              key={contentKey}
              className='bg-foreground/[0.025] dark:bg-foreground/[0.04] flex flex-col rounded-lg p-2'
              {...contentMotion}
            >
              {lines.map((line) => (
                <DocumentLine
                  key={line.key}
                  line={line}
                  showsGutter={isDiffing}
                />
              ))}
            </motion.ol>
          </AnimatePresence>
        </div>
      </AnimatedSize>
      {!hasPrevious && (
        <p className='text-muted-foreground text-xs'>
          The first version has nothing to compare with
        </p>
      )}
    </section>
  );
}

function linesOf(
  version: ArtifactVersion,
  previous: ArtifactVersion | undefined,
  isDiffing: boolean
) {
  if (!isDiffing) {
    return plainLinesOf(version);
  }
  if (!previous) {
    return plainLinesOf(version);
  }
  return lineDiffOf(previous.lines, version.lines);
}

function versionLabelOf(version: ArtifactVersion, isApplied: boolean) {
  if (isApplied) {
    return `${version.label}, applied`;
  }
  return version.label;
}

type Bounds = { min: number; max: number };

function boundsOf(width: number): Bounds {
  const safeWidth = Math.max(width, 1);
  const panelMin = (PANEL_MIN_PX / safeWidth) * 100;
  const chatMin = (CHAT_MIN_PX / safeWidth) * 100;
  const panelMax = 100 - chatMin;
  const min = Math.ceil(panelMin);
  const max = Math.floor(panelMax);
  return { min, max: Math.max(min, max) };
}

function clampPercent(percent: number, bounds: Bounds) {
  const capped = Math.min(bounds.max, percent);
  return Math.max(bounds.min, capped);
}

function stepOf(event: React.KeyboardEvent) {
  if (event.shiftKey) {
    return SHIFT_STEP;
  }
  return KEY_STEP;
}

type ResizeHandleProps = {
  percent: number;
  bounds: Bounds;
  panelId: string;
  isDragging: boolean;
  onResize: (percent: number) => void;
  onResizeEnd: () => void;
  onDragStart: () => void;
  onDragMove: (clientX: number) => void;
  onReset: () => void;
};

/** A separator in the window splitter pattern: its value is the width of the artifact panel. */
function ResizeHandle({
  percent,
  bounds,
  panelId,
  isDragging,
  onResize,
  onResizeEnd,
  onDragStart,
  onDragMove,
  onReset,
}: ResizeHandleProps) {
  const value = Math.round(percent);

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = stepOf(event);
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const wider = percent + step;
      onResize(wider);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const narrower = percent - step;
      onResize(narrower);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onResize(bounds.min);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      onResize(bounds.max);
    }
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    onDragStart();
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) {
      return;
    }
    onDragMove(event.clientX);
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const hasCapture = event.currentTarget.hasPointerCapture(event.pointerId);
    if (hasCapture) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onResizeEnd();
  }

  return (
    <div
      role='separator'
      tabIndex={0}
      aria-orientation='vertical'
      aria-controls={panelId}
      aria-label='Resize the artifact panel'
      aria-valuenow={value}
      aria-valuemin={bounds.min}
      aria-valuemax={bounds.max}
      aria-valuetext={`Artifact panel ${value}% wide`}
      onKeyDown={handleKeys}
      onKeyUp={onResizeEnd}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onReset}
      className='group/handle focus-visible:ring-ring/25 relative flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center rounded-full outline-none focus-visible:ring-[3px]'
    >
      <span
        aria-hidden='true'
        className={cn(
          'bg-border group-hover/handle:bg-foreground/25 absolute inset-y-2 w-px transition-colors duration-150',
          isDragging && 'bg-primary'
        )}
      />
      <span
        aria-hidden='true'
        className={cn(
          'keycap-3d text-muted-foreground relative flex h-7 w-3.5 items-center justify-center rounded-full transition-[scale] duration-150 ease-(--ease-out-strong)',
          isDragging && 'scale-110'
        )}
      >
        <GripVerticalIcon className='size-3' />
      </span>
    </div>
  );
}

type ChatTurn =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; versionId: string };

type ChatColumnProps = {
  turns: ChatTurn[];
  versions: ArtifactVersion[];
  title: string;
  versionId: string;
  onOpenVersion: (versionId: string) => void;
  className?: string;
};

function ChatColumn({
  turns,
  versions,
  title,
  versionId,
  onOpenVersion,
  className,
}: ChatColumnProps) {
  return (
    <ol
      aria-label='Conversation'
      className={cn('flex min-w-0 flex-col gap-3', className)}
    >
      {turns.map((turn) => {
        if (turn.role === 'user') {
          return (
            <li key={turn.id} className='flex justify-end'>
              <p className='bg-foreground/[0.05] dark:bg-foreground/[0.07] max-w-[90%] rounded-xl px-3 py-1.5 text-[13px] leading-relaxed'>
                {turn.text}
              </p>
            </li>
          );
        }
        const version = versions.find(
          (candidate) => candidate.id === turn.versionId
        );
        const isOpen = turn.versionId === versionId;
        return (
          <li key={turn.id} className='flex items-start gap-2'>
            <LabTile lab='anthropic' size='sm' className='mt-1' />
            <div className='flex min-w-0 flex-col gap-1.5'>
              <p className='text-[13px] leading-relaxed'>{turn.text}</p>
              {version && (
                <button
                  type='button'
                  aria-pressed={isOpen}
                  onClick={() => onOpenVersion(version.id)}
                  className={cn(
                    'focus-visible:ring-ring/25 flex h-7 w-fit max-w-full cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs transition-colors duration-150 outline-none focus-visible:ring-[3px]',
                    chipToneOf(isOpen)
                  )}
                >
                  <FileTextIcon className='size-3.5 shrink-0' />
                  <span className='min-w-0 truncate font-mono'>{title}</span>
                  <span className='text-muted-foreground shrink-0'>
                    {version.label}
                  </span>
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function chipToneOf(isOpen: boolean) {
  if (isOpen) {
    return 'bg-primary/10 text-primary-ink';
  }
  return 'bg-foreground/[0.05] hover:bg-foreground/[0.08]';
}

function sheetLabelOf(isOpen: boolean) {
  if (isOpen) {
    return 'Hide artifact';
  }
  return 'Show artifact';
}

const TITLE = 'pallet-fee-notice.md';

const VERSIONS: ArtifactVersion[] = [
  {
    id: 'v1',
    label: 'v1',
    lines: [
      '# A new pallet fee from 1 October',
      'Dear customer,',
      'From 1 October, Brightmoor bills bulk orders a flat fee of 18.40 EUR per pallet.',
      'This replaces the tiered pricing that applied to all orders until now.',
      'We made this change to keep bulk pricing simple and predictable.',
      'If you have questions, reply to this email or call your account manager.',
      'The Brightmoor team',
    ],
  },
  {
    id: 'v2',
    label: 'v2',
    lines: [
      '# A new pallet fee from 1 October',
      'Dear customer,',
      'From 1 October, orders of 40 pallets or more are billed a flat 18.40 EUR per pallet.',
      'Orders under 40 pallets keep the tiered rate, from 15.90 EUR.',
      'Questions? Reply to this email or call your account manager.',
      'The Brightmoor team',
    ],
  },
  {
    id: 'v3',
    label: 'v3',
    lines: [
      '# A new pallet fee from 1 October',
      'Dear customer,',
      'As announced on 2 September, orders of 40 pallets or more are billed a flat 18.40 EUR per pallet from 1 October.',
      'Orders under 40 pallets keep the tiered rate, from 15.90 EUR.',
      'Questions? Reply to this email or call your account manager.',
      'The Brightmoor team',
    ],
  },
];

const TURNS: ChatTurn[] = [
  {
    id: 'ask-1',
    role: 'user',
    text: 'Draft a short notice for customers about the pallet fee change.',
  },
  {
    id: 'draft-1',
    role: 'assistant',
    text: 'Here is a first draft.',
    versionId: 'v1',
  },
  {
    id: 'ask-2',
    role: 'user',
    text: 'Shorter, and say which orders keep the old rate.',
  },
  {
    id: 'draft-2',
    role: 'assistant',
    text: 'Shorter now, and it names the orders that keep the tiers.',
    versionId: 'v2',
  },
  {
    id: 'ask-3',
    role: 'user',
    text: 'Mention when we announced it.',
  },
  {
    id: 'draft-3',
    role: 'assistant',
    text: 'Added the announcement date to the first line.',
    versionId: 'v3',
  },
];

function versionLabelFor(versionId: string) {
  const version = VERSIONS.find((candidate) => candidate.id === versionId);
  return version?.label ?? versionId;
}

export default function Answer06() {
  const [versionId, setVersionId] = useState('v3');
  const [showsChanges, setShowsChanges] = useState(true);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [panelPercent, setPanelPercent] = useState(DEFAULT_PANEL_PERCENT);
  const [isDragging, setIsDragging] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const { schedule } = useTimeouts();
  const width = useContainerWidth(root, 880);
  const isSplit = width >= SPLIT_MIN_WIDTH;
  const bounds = boundsOf(width);
  const percent = clampPercent(panelPercent, bounds);
  const panelStyle = { width: `${percent}%` };

  function openVersion(nextId: string) {
    setVersionId(nextId);
    setIsSheetOpen(true);
    setNotice(`Showing ${versionLabelFor(nextId)}`);
  }

  function changeVersion(nextId: string) {
    setVersionId(nextId);
    setNotice(`Showing ${versionLabelFor(nextId)}`);
  }

  function changeShowsChanges(next: boolean) {
    setShowsChanges(next);
    if (next) {
      setNotice('Changes against the previous version are marked');
      return;
    }
    setNotice('Changes hidden');
  }

  function apply(nextId: string) {
    setApplyingId(nextId);
    schedule(() => {
      setApplyingId(null);
      setAppliedId(nextId);
      setNotice(`Applied ${versionLabelFor(nextId)}`);
    }, APPLYING_MS);
  }

  function resize(next: number) {
    const clamped = clampPercent(next, bounds);
    setPanelPercent(clamped);
  }

  function announceSize() {
    const rounded = Math.round(percent);
    setNotice(`Artifact panel ${rounded}% wide`);
  }

  function startDrag() {
    setIsDragging(true);
  }

  function moveDrag(clientX: number) {
    const split = splitRef.current;
    if (!split) {
      return;
    }
    const rect = split.getBoundingClientRect();
    const fromRight = rect.right - clientX;
    const share = (fromRight / rect.width) * 100;
    resize(share);
  }

  function endResize() {
    setIsDragging(false);
    announceSize();
  }

  function resetSize() {
    resize(DEFAULT_PANEL_PERCENT);
  }

  const panel = (
    <ArtifactPanel
      id={panelId}
      title={TITLE}
      versions={VERSIONS}
      versionId={versionId}
      onVersionChange={changeVersion}
      appliedId={appliedId}
      applyingId={applyingId}
      onApply={apply}
      showsChanges={showsChanges}
      onShowsChangesChange={changeShowsChanges}
    />
  );

  return (
    <div
      ref={setRoot}
      className={cn(
        'bg-card hairline-ring ring-border w-full max-w-[60rem] rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        isDragging && 'select-none'
      )}
    >
      {isSplit && (
        <div ref={splitRef} className='flex h-[28rem] gap-1'>
          <ChatColumn
            turns={TURNS}
            versions={VERSIONS}
            title={TITLE}
            versionId={versionId}
            onOpenVersion={openVersion}
            className='min-h-0 flex-1 overflow-y-auto p-2'
          />
          <ResizeHandle
            percent={percent}
            bounds={bounds}
            panelId={panelId}
            isDragging={isDragging}
            onResize={resize}
            onResizeEnd={endResize}
            onDragStart={startDrag}
            onDragMove={moveDrag}
            onReset={resetSize}
          />
          <div
            style={panelStyle}
            className='bg-foreground/[0.02] dark:bg-foreground/[0.035] min-h-0 shrink-0 overflow-y-auto rounded-lg p-3'
          >
            {panel}
          </div>
        </div>
      )}
      {!isSplit && (
        <div className='flex flex-col gap-3'>
          <ChatColumn
            turns={TURNS}
            versions={VERSIONS}
            title={TITLE}
            versionId={versionId}
            onOpenVersion={openVersion}
            className='p-1'
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-expanded={isSheetOpen}
            aria-controls={panelId}
            onClick={() => setIsSheetOpen((current) => !current)}
            className='self-center'
          >
            <FileTextIcon />
            <Swap swapKey={sheetLabelOf(isSheetOpen)}>
              {sheetLabelOf(isSheetOpen)}
            </Swap>
          </Button>
          <Fold open={isSheetOpen}>
            <div className='surface-raised flex flex-col gap-3 rounded-2xl p-3 pt-2'>
              <span
                aria-hidden='true'
                className='bg-foreground/15 mx-auto h-1 w-9 rounded-full'
              />
              {panel}
            </div>
          </Fold>
        </div>
      )}
      <LiveRegion message={notice} />
    </div>
  );
}
