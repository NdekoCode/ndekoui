'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useImperativeHandle, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  hold,
  PRESS_LEAD_MS,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  HistoryIcon,
  RedoIcon,
  RotateCcwIcon,
} from '@/registry/ndeko/lib/icons';
import {
  fadePresence,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf, nounOf } from '@/registry/ndeko/lib/words';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { pathPartsOf } from './_parts/path-parts';
import { useFocusHandOff } from './_parts/use-focus-hand-off';

export type FileChange = {
  path: string;
  added: number;
  removed: number;
};

export type Checkpoint = {
  id: string;
  /** The turn that made the checkpoint, as the person asked it. */
  turn: string;
  time: string;
  /** The files that turn changed. */
  changes: FileChange[];
};

export type RewindMode = 'code' | 'both';

export type RewindState = {
  selectedId: string | null;
  nowId: string;
  /** Where Now was before the first rewind, so Redo can go back there. */
  redoId: string | null;
  mode: RewindMode;
  /** The mode the last rewind used. */
  appliedMode: RewindMode;
};

/** The control a demonstration holds down: a row by its id, Rewind or Redo. */
export type CheckpointRewindPress = 'rewind' | 'redo' | `row-${string}`;

export type CheckpointRewindHandle = {
  select: (checkpointId: string) => void;
  setMode: (mode: RewindMode) => void;
  rewind: () => void;
  redo: () => void;
};

const ROW_PX = 48;

const MAX_FILES = 5;

const MODES: Segment<RewindMode>[] = [
  { value: 'code', label: 'Code only' },
  { value: 'both', label: 'Code and conversation' },
];

const MODE_WORDS: Record<RewindMode, string> = {
  code: 'code only',
  both: 'code and conversation',
};

const UNDONE_WORDS: Record<RewindMode, string> = {
  code: 'Code reverted',
  both: 'Removed',
};

const ROW_PRESSED = 'scale-[0.985] bg-foreground/[0.06]';

function rowPressedOf(isPressed: boolean) {
  if (isPressed) {
    return ROW_PRESSED;
  }
  return undefined;
}

export function startStateOf(checkpoints: Checkpoint[]): RewindState {
  const last = checkpoints[checkpoints.length - 1];
  return {
    selectedId: null,
    nowId: last?.id ?? '',
    redoId: null,
    mode: 'code',
    appliedMode: 'code',
  };
}

function indexOfId(checkpoints: Checkpoint[], id: string | null) {
  return checkpoints.findIndex((entry) => entry.id === id);
}

function revertOf(
  checkpoints: Checkpoint[],
  nowIndex: number,
  targetIndex: number
) {
  const merged = new Map<string, FileChange>();
  for (let index = targetIndex + 1; index <= nowIndex; index += 1) {
    for (const change of checkpoints[index].changes) {
      const existing = merged.get(change.path);
      if (!existing) {
        merged.set(change.path, change);
        continue;
      }
      merged.set(change.path, {
        path: change.path,
        added: existing.added + change.added,
        removed: existing.removed + change.removed,
      });
    }
  }
  return Array.from(merged.values());
}

function linesOf(files: FileChange[]) {
  let lines = 0;
  for (const file of files) {
    lines += file.added + file.removed;
  }
  return lines;
}

function panelKeyOf(
  isEmpty: boolean,
  isPreviewing: boolean,
  isRewound: boolean
) {
  if (isEmpty) {
    return 'empty';
  }
  if (isPreviewing) {
    return 'preview';
  }
  if (isRewound) {
    return 'rewound';
  }
  return 'hint';
}

function dotToneOf(isMarked: boolean, isUndone: boolean) {
  if (isMarked) {
    return 'bg-primary';
  }
  if (isUndone) {
    return 'bg-foreground/15';
  }
  return 'bg-foreground/35';
}

function selectedToneOf(isSelected: boolean) {
  if (isSelected) {
    return 'bg-foreground/[0.05]';
  }
  return undefined;
}

function undoneToneOf(isUndone: boolean) {
  if (isUndone) {
    return 'opacity-50';
  }
  return undefined;
}

function handOffOf(isNow: boolean) {
  if (isNow) {
    return '';
  }
  return undefined;
}

type CheckpointRowProps = {
  checkpoint: Checkpoint;
  name: string;
  isSelected: boolean;
  isNow: boolean;
  isUndone: boolean;
  undoneWord: string;
  isPressed: boolean;
  onSelect: (checkpointId: string) => void;
};

function CheckpointRow({
  checkpoint,
  name,
  isSelected,
  isNow,
  isUndone,
  undoneWord,
  isPressed,
  onSelect,
}: CheckpointRowProps) {
  const fileCount = countOf(checkpoint.changes.length, 'file');
  const isMarked = isSelected || isNow;

  return (
    <div className='relative'>
      <label
        className={cn(
          'hover:bg-foreground/[0.03] has-[:focus-visible]:ring-ring/25 flex h-12 cursor-pointer items-center gap-2 rounded-lg ps-2 pe-24 transition-[background-color,opacity,scale] duration-150 ease-(--ease-out-strong) has-[:disabled]:cursor-default has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-inset',
          selectedToneOf(isSelected),
          undoneToneOf(isUndone),
          rowPressedOf(isPressed)
        )}
      >
        <input
          type='radio'
          name={name}
          checked={isSelected}
          disabled={isUndone}
          data-hand-off={handOffOf(isNow)}
          onChange={() => onSelect(checkpoint.id)}
          className='sr-only'
        />
        <span aria-hidden='true' className='flex w-4 shrink-0 justify-center'>
          <span
            className={cn(
              'ring-card size-2 rounded-full ring-4 transition-colors duration-150',
              dotToneOf(isMarked, isUndone)
            )}
          />
        </span>
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-[13px] font-medium'>
            {isNow && <span className='sr-only'>Now, </span>}
            {checkpoint.turn}
          </span>
          <span className='text-muted-foreground truncate text-xs tabular-nums'>
            {checkpoint.time}, {fileCount}
          </span>
        </span>
        {isUndone && (
          <span className='text-muted-foreground absolute end-2 text-xs'>
            {undoneWord}
          </span>
        )}
      </label>
    </div>
  );
}

function FileLine({ file }: { file: FileChange }) {
  const { folder, name } = pathPartsOf(file.path);
  const total = file.added + file.removed;
  const label = `${file.added} lines added, ${file.removed} removed`;

  return (
    <div className='flex items-center gap-3 py-1 text-xs'>
      <span className='min-w-0 flex-1 truncate font-mono'>
        <span className='text-muted-foreground'>{folder}</span>
        {name}
      </span>
      <span className='tabular-nums' aria-label={label}>
        <span className='text-success-foreground'>+{file.added}</span>{' '}
        <span className='text-destructive-ink'>-{file.removed}</span>
      </span>
      <span
        aria-hidden='true'
        className='bg-foreground/[0.06] flex h-1.5 w-12 shrink-0 overflow-hidden rounded-full'
      >
        <span
          className='bg-success/70 h-full'
          style={{ flexGrow: file.added, flexBasis: 0 }}
        />
        <span
          className='bg-destructive/70 h-full'
          style={{ flexGrow: file.removed, flexBasis: 0 }}
        />
        <span className='sr-only'>{total}</span>
      </span>
    </div>
  );
}

type PreviewPanelProps = {
  target: Checkpoint;
  files: FileChange[];
  mode: RewindMode;
  isRewindPressed: boolean;
  onModeChange: (mode: RewindMode) => void;
  onRewind: () => void;
};

function PreviewPanel({
  target,
  files,
  mode,
  isRewindPressed,
  onModeChange,
  onRewind,
}: PreviewPanelProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const shown = files.slice(0, MAX_FILES);
  const hidden = files.length - shown.length;
  const lines = linesOf(files);
  const fileNoun = nounOf(files.length, 'file');
  const lineNoun = nounOf(lines, 'line');

  return (
    <div className='bg-foreground/[0.04] flex flex-col gap-3 rounded-lg p-3'>
      <p className='text-xs leading-5'>
        Rewinding to <span className='font-medium'>{target.turn}</span> undoes{' '}
        <MotionNumber value={files.length} className='font-medium' /> {fileNoun}
        , <MotionNumber value={lines} className='font-medium' /> {lineNoun}{' '}
        changed.
      </p>
      <div className='flex flex-col'>
        <AnimatePresence initial={false}>
          {shown.map((file) => (
            <motion.div
              key={file.path}
              className='overflow-hidden'
              {...rowPresence}
            >
              <FileLine file={file} />
            </motion.div>
          ))}
        </AnimatePresence>
        {hidden > 0 && (
          <p className='text-muted-foreground py-1 text-xs'>
            and {countOf(hidden, 'more file')}
          </p>
        )}
      </div>
      <Segments
        value={mode}
        segments={MODES}
        onValueChange={onModeChange}
        label='What to rewind'
        className='w-full @sm:w-fit'
      />
      <div className='flex items-center gap-3'>
        <Button
          type='button'
          size='sm'
          onClick={onRewind}
          className={pressedSolidOf(isRewindPressed)}
        >
          <RotateCcwIcon />
          Rewind
        </Button>
        <p className='text-muted-foreground text-xs'>
          Nothing is lost, Redo brings it back
        </p>
      </div>
    </div>
  );
}

type RewoundPanelProps = {
  target: Checkpoint;
  mode: RewindMode;
  isRedoPressed: boolean;
  onRedo: () => void;
};

function RewoundPanel({
  target,
  mode,
  isRedoPressed,
  onRedo,
}: RewoundPanelProps) {
  return (
    <div className='bg-foreground/[0.04] flex items-center gap-3 rounded-lg p-3'>
      <p className='min-w-0 flex-1 text-xs leading-5'>
        Rewound to <span className='font-medium'>{target.turn}</span>,{' '}
        {MODE_WORDS[mode]}.
      </p>
      <Button
        type='button'
        size='sm'
        variant='outline'
        onClick={onRedo}
        className={pressedSolidOf(isRedoPressed)}
      >
        <RedoIcon />
        Redo
      </Button>
    </div>
  );
}

export type CheckpointRewindProps = {
  checkpoints: Checkpoint[];
  /** The state the card first shows. Rewinding and redoing are kept in it. */
  initialState?: RewindState;
  /** Something new happened after a rewind: the turns that came after Now are gone and Redo with them. */
  hasNewActivity?: boolean;
  onRewind?: (checkpointId: string, mode: RewindMode) => void;
  onRedo?: () => void;
  /** Putting the card back to its first state: change this number. */
  resetToken?: number;
  handleRef?: React.Ref<CheckpointRewindHandle>;
  pressed?: CheckpointRewindPress | null;
  /** A demonstration is not read aloud. */
  isDemonstrating?: boolean;
  className?: string;
};

export function CheckpointRewind({
  checkpoints,
  initialState,
  hasNewActivity = false,
  onRewind,
  onRedo,
  resetToken = 0,
  handleRef,
  pressed = null,
  isDemonstrating = false,
  className,
}: CheckpointRewindProps) {
  const first = initialState ?? startStateOf(checkpoints);
  const [state, setState] = useState(first);
  const [notice, setNotice] = useState('');
  const [seenToken, setSeenToken] = useState(resetToken);
  const groupName = useId();
  const fade = fadePresence();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const { rootRef, markIfFocusInside } = useFocusHandOff(String(state.nowId));
  const nowIndex = indexOfId(checkpoints, state.nowId);
  const selectedIndex = indexOfId(checkpoints, state.selectedId);
  const lastIndex = checkpoints.length - 1;
  const isRewound = nowIndex < lastIndex;
  const isPreviewing = selectedIndex >= 0 && selectedIndex < nowIndex;
  const canRedo = isRewound && !hasNewActivity && state.redoId !== null;
  const showsRewound = isRewound && !isPreviewing;
  const isEmpty = checkpoints.length === 0;
  const panelKey = panelKeyOf(isEmpty, isPreviewing, showsRewound);
  const target = checkpoints[selectedIndex];
  const nowCheckpoint = checkpoints[nowIndex];
  const files = revertOf(checkpoints, nowIndex, selectedIndex);
  const visibleCount = visibleCountOf(
    checkpoints.length,
    nowIndex,
    hasNewActivity
  );
  const visible = checkpoints.slice(0, visibleCount);
  const undoneWord = UNDONE_WORDS[state.appliedMode];

  if (seenToken !== resetToken) {
    setSeenToken(resetToken);
    setState(first);
  }

  function select(checkpointId: string) {
    const index = indexOfId(checkpoints, checkpointId);
    const isUndone = index > nowIndex;
    if (isUndone) {
      return;
    }
    setState((current) => ({ ...current, selectedId: checkpointId }));
    if (index === nowIndex) {
      setNotice('You are here');
      return;
    }
    const undone = revertOf(checkpoints, nowIndex, index);
    const turn = checkpoints[index].turn;
    setNotice(`Rewinding to ${turn} undoes ${countOf(undone.length, 'file')}`);
  }

  function setMode(mode: RewindMode) {
    setState((current) => ({ ...current, mode }));
  }

  function rewind() {
    if (!isPreviewing) {
      return;
    }
    markIfFocusInside();
    const redoId = state.redoId ?? state.nowId;
    setState((current) => ({
      ...current,
      nowId: target.id,
      selectedId: null,
      redoId,
      appliedMode: current.mode,
    }));
    setNotice(`Rewound to ${target.turn}, ${MODE_WORDS[state.mode]}`);
    onRewind?.(target.id, state.mode);
  }

  function redo() {
    if (!canRedo || state.redoId === null) {
      return;
    }
    markIfFocusInside();
    const backTo = state.redoId;
    setState((current) => ({
      ...current,
      nowId: backTo,
      selectedId: null,
      redoId: null,
    }));
    setNotice('Redone, back at the latest checkpoint');
    onRedo?.();
  }

  useImperativeHandle(handleRef, () => ({ select, setMode, rewind, redo }));

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const isEscape = event.key === 'Escape';
    const isEnter = event.key === 'Enter';
    const isOnRadio = event.target instanceof HTMLInputElement;
    if (isEscape && state.selectedId !== null) {
      event.preventDefault();
      setState((current) => ({ ...current, selectedId: null }));
      return;
    }
    const canRewind = isEnter && isOnRadio && isPreviewing;
    if (canRewind) {
      event.preventDefault();
      rewind();
    }
  }

  return (
    <div
      ref={rootRef}
      onKeyDown={handleKeys}
      className={cn(
        'surface-raised @container flex flex-col gap-3 rounded-xl p-4',
        className
      )}
    >
      <div className='flex items-center justify-between gap-3'>
        <h3 className='flex items-center gap-2 text-sm font-medium'>
          <HistoryIcon className='text-muted-foreground size-4' />
          Checkpoints
        </h3>
        <p className='text-muted-foreground text-xs tabular-nums'>
          {countOf(visible.length, 'turn')}
        </p>
      </div>
      <fieldset className='relative min-w-0'>
        <legend className='sr-only'>Pick a checkpoint to rewind to</legend>
        <span
          aria-hidden='true'
          className='bg-border absolute start-4 top-6 w-(--hairline)'
          style={{ height: Math.max(0, visible.length - 1) * ROW_PX }}
        />
        {!isEmpty && (
          <span
            aria-hidden='true'
            style={{ transform: `translateY(${nowIndex * ROW_PX}px)` }}
            className='bg-primary/[0.05] hairline-ring ring-primary/40 absolute inset-x-0 top-0 h-12 rounded-lg transition-transform duration-500 ease-(--ease-in-out-strong)'
          >
            <Chip
              color='var(--primary)'
              className='absolute end-2 top-1/2 -translate-y-1/2'
            >
              Now
            </Chip>
          </span>
        )}
        <ul className='relative flex flex-col'>
          <AnimatePresence initial={false}>
            {visible.map((checkpoint, index) => (
              <motion.li
                key={checkpoint.id}
                className='relative z-10 overflow-hidden'
                {...rowPresence}
              >
                <CheckpointRow
                  checkpoint={checkpoint}
                  name={groupName}
                  isSelected={checkpoint.id === state.selectedId}
                  isNow={index === nowIndex}
                  isUndone={index > nowIndex}
                  undoneWord={undoneWord}
                  isPressed={pressed === `row-${checkpoint.id}`}
                  onSelect={select}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </fieldset>
      <AnimatedSize>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={panelKey} {...fade}>
            {panelKey === 'preview' && (
              <PreviewPanel
                target={target}
                files={files}
                mode={state.mode}
                isRewindPressed={pressed === 'rewind'}
                onModeChange={setMode}
                onRewind={rewind}
              />
            )}
            {panelKey === 'rewound' && (
              <RewoundPanel
                target={nowCheckpoint}
                mode={state.appliedMode}
                isRedoPressed={pressed === 'redo'}
                onRedo={redo}
              />
            )}
            {panelKey === 'empty' && (
              <p className='text-muted-foreground px-1 py-3 text-xs leading-5'>
                No checkpoints yet. One is saved at the start of every turn.
              </p>
            )}
            {panelKey === 'hint' && (
              <p className='text-muted-foreground px-1 py-3 text-xs leading-5'>
                Pick a checkpoint to see what rewinding to it would undo
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
      <LiveRegion message={spokenUnless(isDemonstrating, notice)} />
    </div>
  );
}

function visibleCountOf(
  total: number,
  nowIndex: number,
  hasNewActivity: boolean
) {
  if (hasNewActivity) {
    return nowIndex + 1;
  }
  return total;
}

const CHECKPOINTS: Checkpoint[] = [
  {
    id: 'scaffold',
    turn: 'Scaffold the invoice page',
    time: '11:02',
    changes: [
      { path: 'src/app/invoice/page.tsx', added: 64, removed: 0 },
      { path: 'src/lib/invoice.ts', added: 38, removed: 0 },
    ],
  },
  {
    id: 'table',
    turn: 'Add the line items table',
    time: '11:09',
    changes: [
      { path: 'components/line-items.tsx', added: 72, removed: 0 },
      { path: 'src/app/invoice/page.tsx', added: 18, removed: 6 },
    ],
  },
  {
    id: 'rounding',
    turn: 'Round totals to cents',
    time: '11:21',
    changes: [
      { path: 'src/lib/invoice.ts', added: 21, removed: 9 },
      { path: 'tests/invoice.test.ts', added: 34, removed: 0 },
    ],
  },
  {
    id: 'tax',
    turn: 'Add the Kinshasa tax rule',
    time: '11:34',
    changes: [
      { path: 'src/lib/tax.ts', added: 46, removed: 3 },
      { path: 'src/lib/invoice.ts', added: 12, removed: 2 },
      { path: 'tests/tax.test.ts', added: 40, removed: 0 },
    ],
  },
  {
    id: 'rename',
    turn: 'Rename the totals component',
    time: '11:48',
    changes: [
      { path: 'components/totals.tsx', added: 8, removed: 8 },
      { path: 'src/lib/tax.ts', added: 2, removed: 2 },
    ],
  },
];

const RESTING_STATE: RewindState = {
  selectedId: null,
  nowId: 'rounding',
  redoId: 'rename',
  mode: 'both',
  appliedMode: 'both',
};

function initialStateOf(isResting: boolean) {
  if (isResting) {
    return RESTING_STATE;
  }
  return startStateOf(CHECKPOINTS);
}

function RewindDemo({ isResting }: { isResting: boolean }) {
  const [round, setRound] = useState(0);
  const card = useRef<CheckpointRewindHandle>(null);
  const { pressed, press } = usePress<CheckpointRewindPress>();

  function resetDemo() {
    setRound((current) => current + 1);
  }

  const steps: AutoplayStep[] = [
    { after: 1500, run: () => press('row-rounding') },
    { after: PRESS_LEAD_MS, run: () => card.current?.select('rounding') },
    { after: 2000, run: () => card.current?.setMode('both') },
    { after: 1600, run: () => press('rewind') },
    { after: PRESS_LEAD_MS, run: () => card.current?.rewind() },
    { after: 2800, run: () => press('redo') },
    { after: PRESS_LEAD_MS, run: () => card.current?.redo() },
    { after: 2400, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1800,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[39rem] w-full max-w-[30rem] flex-col gap-2'
    >
      <CheckpointRewind
        checkpoints={CHECKPOINTS}
        initialState={initialStateOf(isResting)}
        resetToken={round}
        handleRef={card}
        pressed={pressed}
        isDemonstrating={isAutoplaying}
      />
      <p className='text-muted-foreground px-1 text-xs'>
        Illustrative session, no file was touched
      </p>
    </div>
  );
}

export default function Review16() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const restKey = String(shouldReduceMotion);

  return <RewindDemo key={restKey} isResting={shouldReduceMotion} />;
}
