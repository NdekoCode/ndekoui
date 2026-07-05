'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ListCollapseIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import {
  blocksOf,
  changeCountsOf,
  lineDiffOf,
  type DiffBlock,
  type DiffLine,
} from './_parts/diff';
import { countOf, nounOf, pathPartsOf } from './_parts/words';

export type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed';

export type ChangedFile = {
  path: string;
  /** For a renamed file, where it lived before. */
  previousPath?: string;
  status: FileStatus;
  before: string;
  after: string;
};

type BarBlock = 'added' | 'removed' | 'neutral';

const STATUSES: FileStatus[] = ['added', 'modified', 'deleted', 'renamed'];

const STATUS_LETTER: Record<FileStatus, string> = {
  added: 'A',
  modified: 'M',
  deleted: 'D',
  renamed: 'R',
};

const STATUS_WORD: Record<FileStatus, string> = {
  added: 'Added',
  modified: 'Modified',
  deleted: 'Deleted',
  renamed: 'Renamed',
};

const STATUS_COLOR: Record<FileStatus, string> = {
  added: 'var(--success)',
  modified: 'var(--info)',
  deleted: 'var(--destructive)',
  renamed: 'var(--warning)',
};

const BAR_SIZE = 5;

const BAR_TONE: Record<BarBlock, string> = {
  added: 'bg-success',
  removed: 'bg-destructive',
  neutral: 'bg-foreground/15',
};

const LINE_TONE: Record<DiffLine['kind'], string> = {
  same: '',
  removed: 'bg-destructive/10',
  added: 'bg-success/10',
};

const SIGN: Record<DiffLine['kind'], string> = {
  same: ' ',
  removed: '−',
  added: '+',
};

const SIGN_TONE: Record<DiffLine['kind'], string> = {
  same: 'text-muted-foreground',
  removed: 'text-destructive-ink',
  added: 'text-success-foreground',
};

const SPOKEN_KIND: Record<DiffLine['kind'], string> = {
  same: '',
  removed: 'Removed: ',
  added: 'Added: ',
};

function linesOfText(text: string) {
  if (text === '') {
    return [];
  }
  return text.split('\n');
}

export function diffOfFile(file: ChangedFile) {
  const before = linesOfText(file.before);
  const after = linesOfText(file.after);
  return lineDiffOf(before, after);
}

/** Five blocks shared between additions and deletions; a change under five lines leaves the rest grey. */
export function barOf(additions: number, deletions: number): BarBlock[] {
  const total = additions + deletions;
  const filled = Math.min(BAR_SIZE, total);
  const share = additions / Math.max(total, 1);
  const addedBlocks = Math.round(share * filled);
  const removedBlocks = filled - addedBlocks;
  const blocks: BarBlock[] = [];
  for (let index = 0; index < BAR_SIZE; index += 1) {
    blocks.push(blockAt(index, addedBlocks, removedBlocks));
  }
  return blocks;
}

function blockAt(index: number, addedBlocks: number, removedBlocks: number) {
  if (index < addedBlocks) {
    return 'added';
  }
  const removedEnd = addedBlocks + removedBlocks;
  if (index < removedEnd) {
    return 'removed';
  }
  return 'neutral';
}

function StatusTile({ status }: { status: FileStatus }) {
  const style = { '--chip': STATUS_COLOR[status] } as React.CSSProperties;

  return (
    <span
      style={style}
      className='chip-3d inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] font-mono text-[11px] font-semibold'
    >
      <span aria-hidden='true'>{STATUS_LETTER[status]}</span>
      <span className='sr-only'>{STATUS_WORD[status]}</span>
    </span>
  );
}

function ChangeBar({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  const blocks = barOf(additions, deletions);

  return (
    <span aria-hidden='true' className='flex shrink-0 items-center gap-0.5'>
      {blocks.map((block, index) => (
        <span
          key={index}
          className={cn('size-1.5 rounded-[2px]', BAR_TONE[block])}
        />
      ))}
    </span>
  );
}

function FilePath({ file }: { file: ChangedFile }) {
  const { folder, name } = pathPartsOf(file.path);
  const previous = file.previousPath;

  return (
    <span className='flex min-w-0 flex-1 items-center gap-1 font-mono text-xs'>
      {previous && (
        <>
          <span className='text-muted-foreground min-w-0 truncate'>
            {previous}
          </span>
          <ArrowRightIcon className='text-muted-foreground size-3 shrink-0' />
        </>
      )}
      <span className='min-w-0 truncate'>
        <span className='text-muted-foreground'>{folder}</span>
        {name}
      </span>
    </span>
  );
}

function CodeLine({ line }: { line: DiffLine }) {
  return (
    <div
      className={cn(
        'flex min-h-5 items-stretch pe-3 font-mono text-xs leading-5',
        LINE_TONE[line.kind]
      )}
    >
      <span className='text-muted-foreground/70 w-8 shrink-0 pe-1.5 text-end tabular-nums select-none'>
        {line.oldNumber ?? ''}
      </span>
      <span className='text-muted-foreground/70 w-8 shrink-0 pe-1.5 text-end tabular-nums select-none'>
        {line.newNumber ?? ''}
      </span>
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

function FoldNote({ block }: { block: DiffBlock }) {
  const count = block.lines.length;

  return (
    <p className='text-muted-foreground bg-foreground/[0.03] px-3 py-1 text-xs'>
      {countOf(count, 'unchanged line')}
    </p>
  );
}

function FileDiff({ lines, name }: { lines: DiffLine[]; name: string }) {
  const blocks = blocksOf(lines, 2, 4);

  return (
    <div
      role='region'
      aria-label={`Changes to ${name}`}
      tabIndex={0}
      className='focus-visible:ring-ring/25 overflow-x-auto rounded-md outline-none focus-visible:ring-[3px]'
    >
      <div className='flex w-max min-w-full flex-col'>
        {blocks.map((block) => {
          if (block.kind === 'fold') {
            return <FoldNote key={block.key} block={block} />;
          }
          return (
            <div key={block.key}>
              {block.lines.map((line) => (
                <CodeLine key={line.key} line={line} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type FileRowProps = {
  file: ChangedFile;
  isOpen: boolean;
  onToggle: () => void;
};

export function FileRow({ file, isOpen, onToggle }: FileRowProps) {
  const panelId = useId();
  const lines = diffOfFile(file);
  const { additions, deletions } = changeCountsOf(lines);
  const { name } = pathPartsOf(file.path);
  const addedWords = countOf(additions, 'addition');
  const removedWords = countOf(deletions, 'deletion');
  const counts = `${addedWords}, ${removedWords}`;

  return (
    <div className='flex flex-col'>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-start outline-none focus-visible:ring-[3px]'
      >
        <StatusTile status={file.status} />
        <FilePath file={file} />
        <ChangeBar additions={additions} deletions={deletions} />
        <span className='flex w-16 shrink-0 justify-end gap-1.5 font-mono text-xs tabular-nums'>
          <span className='text-success-foreground'>+{additions}</span>
          <span className='text-destructive-ink'>−{deletions}</span>
          <span className='sr-only'>{counts}</span>
        </span>
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={panelId}>
        <div className='px-2 pt-1 pb-2'>
          <div className='bg-foreground/[0.025] dark:bg-foreground/[0.04] rounded-md'>
            <FileDiff lines={lines} name={name} />
          </div>
        </div>
      </Fold>
    </div>
  );
}

function totalsOf(files: ChangedFile[]) {
  let additions = 0;
  let deletions = 0;
  for (const file of files) {
    const lines = diffOfFile(file);
    const counts = changeCountsOf(lines);
    additions += counts.additions;
    deletions += counts.deletions;
  }
  return { additions, deletions };
}

function countWithStatus(files: ChangedFile[], status: FileStatus) {
  const matching = files.filter((file) => file.status === status);
  return matching.length;
}

function isShownBy(file: ChangedFile, statuses: FileStatus[]) {
  if (statuses.length === 0) {
    return true;
  }
  return statuses.includes(file.status);
}

function shownWordsOf(shown: number, total: number): WordRollWord[] {
  const countWord = {
    key: 'shown',
    text: String(shown),
    node: <MotionNumber value={shown} />,
  };
  if (shown === total) {
    return ['All', countWord, nounOf(total, 'file'), 'shown'];
  }
  return ['Showing', countWord, 'of', String(total), nounOf(total, 'file')];
}

function expandLabelOf(isAllOpen: boolean) {
  if (isAllOpen) {
    return 'Collapse all';
  }
  return 'Expand all';
}

function statusesFrom(values: unknown[]) {
  return STATUSES.filter((status) => values.includes(status));
}

export type ChangeSummaryProps = {
  files: ChangedFile[];
  className?: string;
};

export function ChangeSummary({ files, className }: ChangeSummaryProps) {
  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [notice, setNotice] = useState('');
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const totals = totalsOf(files);
  const shownFiles = files.filter((file) => isShownBy(file, statuses));
  const shownPaths = shownFiles.map((file) => file.path);
  const isAllOpen = shownPaths.every((path) => openPaths.includes(path));
  const hasShown = shownFiles.length > 0;
  const expandLabel = expandLabelOf(isAllOpen);
  const shownWords = shownWordsOf(shownFiles.length, files.length);

  function toggle(path: string) {
    const isOpen = openPaths.includes(path);
    const { name } = pathPartsOf(path);
    if (isOpen) {
      setOpenPaths((current) => current.filter((open) => open !== path));
      setNotice(`${name} folded`);
      return;
    }
    setOpenPaths((current) => [...current, path]);
    setNotice(`${name} opened`);
  }

  function toggleAll() {
    if (isAllOpen) {
      setOpenPaths([]);
      setNotice('Every file folded');
      return;
    }
    setOpenPaths(shownPaths);
    setNotice('Every shown file opened');
  }

  function changeStatuses(values: unknown[]) {
    const next = statusesFrom(values);
    setStatuses(next);
    const count = files.filter((file) => isShownBy(file, next)).length;
    setNotice(`Showing ${countOf(count, 'file')}`);
  }

  return (
    <section
      aria-label='Changed files'
      className={cn('flex flex-col gap-3', className)}
    >
      <header className='flex flex-wrap items-center gap-x-3 gap-y-2 px-1'>
        <p className='min-w-0 flex-1 text-[13px]'>
          <span className='font-medium'>
            {countOf(files.length, 'file')} changed
          </span>
          <span className='ms-2 font-mono text-xs tabular-nums'>
            <span className='text-success-foreground'>+{totals.additions}</span>{' '}
            <span className='text-destructive-ink'>−{totals.deletions}</span>
          </span>
        </p>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={toggleAll}
          disabled={!hasShown}
          className='text-muted-foreground'
        >
          <ListCollapseIcon />
          <Swap swapKey={expandLabel}>{expandLabel}</Swap>
        </Button>
      </header>
      <div className='flex flex-wrap items-center gap-2 px-1'>
        <ToggleGroup
          aria-label='Filter by status'
          multiple
          value={statuses}
          onValueChange={changeStatuses}
          size='sm'
          className='flex-wrap gap-1'
        >
          {STATUSES.map((status) => {
            const count = countWithStatus(files, status);
            return (
              <ToggleGroupItem
                key={status}
                value={status}
                disabled={count === 0}
                variant='outline'
                className='data-pressed:bg-primary/10 data-pressed:text-primary-ink dark:data-pressed:bg-primary/15 h-7 gap-1.5 rounded-full ps-1 pe-2.5 text-xs'
              >
                <StatusTile status={status} />
                {STATUS_WORD[status]}
                <span className='text-muted-foreground tabular-nums'>
                  {count}
                </span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>
      <p className='text-muted-foreground px-1 text-xs'>
        <WordRoll words={shownWords} />
      </p>
      <ul className='flex flex-col'>
        <AnimatePresence initial={false}>
          {shownFiles.map((file) => (
            <motion.li
              key={file.path}
              className='overflow-hidden'
              {...rowPresence}
            >
              <FileRow
                file={file}
                isOpen={openPaths.includes(file.path)}
                onToggle={() => toggle(file.path)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {!hasShown && (
        <p className='text-muted-foreground px-1 py-4 text-center text-[13px]'>
          No file has this status
        </p>
      )}
      <LiveRegion message={notice} />
    </section>
  );
}

const FILES: ChangedFile[] = [
  {
    path: 'src/billing/pallet-fee.ts',
    status: 'modified',
    before: `import { tierFor } from './tiers';

export function palletFee(order: Order) {
  const tier = tierFor(order.pallets);
  return money(order.pallets * TIER_RATES[tier]);
}`,
    after: `import { FLAT_FROM_PALLETS, tierFor } from './pallet-tiers';

export const FLAT_FEE_EUR = 18.4;

export function palletFee(order: Order) {
  if (order.pallets >= FLAT_FROM_PALLETS) {
    return money(order.pallets * FLAT_FEE_EUR);
  }
  const tier = tierFor(order.pallets);
  return money(order.pallets * TIER_RATES[tier]);
}`,
  },
  {
    path: 'src/billing/pallet-fee.test.ts',
    status: 'added',
    before: '',
    after: `import { palletFee } from './pallet-fee';

test('bills 40 pallets at the flat fee', () => {
  const fee = palletFee({ pallets: 40, date: '2026-10-02' });
  expect(fee.amount).toBe(736);
});

test('keeps the tiers under 40 pallets', () => {
  const fee = palletFee({ pallets: 10, date: '2026-10-02' });
  expect(fee.amount).toBe(159);
});`,
  },
  {
    path: 'src/billing/pallet-tiers.ts',
    previousPath: 'src/billing/tiers.ts',
    status: 'renamed',
    before: `export const TIER_LIMITS = [10, 25];

export function tierFor(pallets: number) {
  return TIER_LIMITS.filter((limit) => pallets > limit).length;
}`,
    after: `export const TIER_LIMITS = [10, 25];
export const FLAT_FROM_PALLETS = 40;

export function tierFor(pallets: number) {
  return TIER_LIMITS.filter((limit) => pallets > limit).length;
}`,
  },
  {
    path: 'src/orders/checkout.ts',
    status: 'modified',
    before: `export function shippingOf(cart: Cart) {
  const pallets = cart.lines.length;
  return palletFee({ pallets, date: cart.date });
}`,
    after: `export function shippingOf(cart: Cart) {
  const pallets = palletsOf(cart);
  return palletFee({ pallets, date: cart.date });
}`,
  },
  {
    path: 'src/billing/legacy-fee.ts',
    status: 'deleted',
    before: `import { palletFee } from './pallet-fee';

/** @deprecated Use palletFee. */
export const legacyPalletFee = palletFee;`,
    after: '',
  },
  {
    path: 'docs/pricing.md',
    status: 'modified',
    before: `## Pallet fees

Every order is billed by tier, from 15.90 EUR per pallet.`,
    after: `## Pallet fees

From 1 October, orders of 40 pallets or more pay a flat 18.40 EUR per pallet.
Smaller orders are billed by tier, from 15.90 EUR per pallet.`,
  },
];

export default function Review06() {
  return (
    <div className='bg-card hairline-ring ring-border w-full max-w-[44rem] rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <ChangeSummary files={FILES} />
    </div>
  );
}
