'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { CELL_WORD, StatusCell } from './cells';
import { TARGETS, type EvalCase } from './data';
import {
  candidateStatusOf,
  isRegression,
  type CellStatus,
  type EvalState,
  type Filter,
  type Verdict,
} from './session';

const GRID =
  'grid grid-cols-[minmax(0,1fr)_2.75rem_2.75rem] items-center gap-2';

type RowMark = {
  word: string;
  variant: 'warning' | 'secondary' | 'destructive' | 'success';
};

const VERDICT_MARK: Record<Verdict, RowMark> = {
  accepted: { word: 'Accepted', variant: 'secondary' },
  blocked: { word: 'Blocked', variant: 'destructive' },
};

const REGRESSION_MARK: RowMark = { word: 'Regression', variant: 'warning' };

const FIXED_MARK: RowMark = { word: 'Fixed', variant: 'success' };

const EMPTY_LINE: Record<Filter, string> = {
  all: 'No case in this suite',
  failing: 'No case is failing',
  regressions:
    'No regression so far. They show here once the candidate has run',
};

function isFixedBy(entry: EvalCase, candidate: CellStatus) {
  const failedBefore = entry.production.outcome === 'fail';
  const passesNow = candidate === 'pass';
  return failedBefore && passesNow;
}

function rowMarkOf(state: EvalState, entry: EvalCase, candidate: CellStatus) {
  if (isRegression(state, entry.id)) {
    const verdict = state.verdicts[entry.id];
    if (verdict) {
      return VERDICT_MARK[verdict];
    }
    return REGRESSION_MARK;
  }
  if (isFixedBy(entry, candidate)) {
    return FIXED_MARK;
  }
  return null;
}

function rowLabelOf(
  entry: EvalCase,
  candidate: CellStatus,
  mark: RowMark | null
) {
  const production = CELL_WORD[entry.production.outcome].toLowerCase();
  const candidateWord = CELL_WORD[candidate].toLowerCase();
  const summary = `${entry.name}: production ${production}, candidate ${candidateWord}`;
  if (mark) {
    return `${summary}, ${mark.word.toLowerCase()}`;
  }
  return summary;
}

function rowToneOf(isOpen: boolean) {
  if (isOpen) {
    return 'bg-foreground/[0.05]';
  }
  return 'hover:bg-foreground/[0.03]';
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.985] bg-foreground/[0.07]';
  }
  return undefined;
}

/** The arrow keys walk the rows; Tab still reaches the buttons inside an open case. */
function moveBetweenRows(event: React.KeyboardEvent<HTMLUListElement>) {
  const isDown = event.key === 'ArrowDown';
  const isUp = event.key === 'ArrowUp';
  if (!isDown && !isUp) {
    return;
  }
  const found =
    event.currentTarget.querySelectorAll<HTMLElement>('[data-case]');
  const rows = Array.from(found);
  const current = rows.findIndex((row) => row === document.activeElement);
  if (current === -1) {
    return;
  }
  let next = current - 1;
  if (isDown) {
    next = current + 1;
  }
  const target = rows[next];
  if (target) {
    event.preventDefault();
    target.focus();
  }
}

type CaseRowProps = {
  entry: EvalCase;
  state: EvalState;
  isPressed: boolean;
  onOpen: (id: string) => void;
  renderDetail: (entry: EvalCase) => React.ReactNode;
};

function CaseRow({
  entry,
  state,
  isPressed,
  onOpen,
  renderDetail,
}: CaseRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const candidate = candidateStatusOf(state, entry.id);
  const mark = rowMarkOf(state, entry, candidate);
  const isOpen = state.openId === entry.id;

  return (
    <>
      <button
        type='button'
        data-case={entry.id}
        aria-expanded={isOpen}
        aria-label={rowLabelOf(entry, candidate, mark)}
        onClick={() => onOpen(entry.id)}
        className={cn(
          GRID,
          'focus-visible:ring-ring/25 min-h-9 w-full cursor-pointer rounded-lg px-2 py-1 text-start transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-inset',
          rowToneOf(isOpen),
          pressedQuietOf(isPressed)
        )}
      >
        <span className='flex min-w-0 items-center gap-2'>
          <span className='truncate text-[13px]'>{entry.name}</span>
          {mark && (
            <Badge
              variant={mark.variant}
              className='transition-colors duration-300 starting:opacity-0'
            >
              <Swap swapKey={mark.word}>{mark.word}</Swap>
            </Badge>
          )}
        </span>
        <span className='flex justify-center'>
          <StatusCell status={entry.production.outcome} />
        </span>
        <span className='flex justify-center'>
          <StatusCell status={candidate} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key='detail'
            className='overflow-hidden @4xl:hidden'
            {...rowPresence}
          >
            <div className='px-2 pt-2 pb-3'>{renderDetail(entry)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

type CaseGridProps = {
  state: EvalState;
  cases: EvalCase[];
  pressed: string | null;
  onOpen: (id: string) => void;
  onShowAll: () => void;
  renderDetail: (entry: EvalCase) => React.ReactNode;
};

export function CaseGrid({
  state,
  cases,
  pressed,
  onOpen,
  onShowAll,
  renderDetail,
}: CaseGridProps) {
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isEmpty = cases.length === 0;

  return (
    <section
      aria-label='Cases'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div
        aria-hidden='true'
        className={cn(GRID, 'text-muted-foreground h-8 px-2 text-xs')}
      >
        <span>Case</span>
        <span className='text-center font-mono'>
          {TARGETS.production.version}
        </span>
        <span className='text-center font-mono'>
          {TARGETS.candidate.version}
        </span>
      </div>
      <ul className='flex flex-col' onKeyDown={moveBetweenRows}>
        <AnimatePresence initial={false}>
          {cases.map((entry) => (
            <motion.li
              key={entry.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <CaseRow
                entry={entry}
                state={state}
                isPressed={pressed === `case-${entry.id}`}
                onOpen={onOpen}
                renderDetail={renderDetail}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {isEmpty && (
        <div className='flex flex-col items-start gap-3 px-2 pt-1 pb-3 transition-opacity duration-300 starting:opacity-0'>
          <p className='text-muted-foreground text-[13px]'>
            {EMPTY_LINE[state.filter]}
          </p>
          <Button type='button' variant='outline' size='sm' onClick={onShowAll}>
            Show all cases
          </Button>
        </div>
      )}
    </section>
  );
}
