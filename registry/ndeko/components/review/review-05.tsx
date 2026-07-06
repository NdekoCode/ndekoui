'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CheckIcon,
  ChevronsUpDownIcon,
  FileTextIcon,
  RotateCcwIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import {
  blocksOf,
  changeCountsOf,
  hunkHeaderOf,
  lineDiffOf,
  partnersOf,
  wordDiffOf,
  type DiffBlock,
  type DiffLine,
  type WordPiece,
} from './_parts/diff';
import { pathPartsOf } from './_parts/path-parts';
import { useContainerWidth } from './_parts/use-container-width';

export type HunkDecision = 'accepted' | 'rejected';

export type InlineDiffLayout = 'unified' | 'split';

type SplitRow = {
  key: string;
  left: DiffLine | null;
  right: DiffLine | null;
};

/** Two columns of code need this much of the piece; below it the view stays unified. */
const SPLIT_MIN_WIDTH = 640;

const CONTEXT_LINES = 2;

const MIN_FOLD = 4;

const LINE_TONE: Record<DiffLine['kind'], string> = {
  same: '',
  removed: 'bg-destructive/10',
  added: 'bg-success/10',
};

const WORD_TONE: Record<DiffLine['kind'], string> = {
  same: '',
  removed: 'bg-destructive/25 rounded-[3px]',
  added: 'bg-success/30 rounded-[3px]',
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

const NUMBER_CELL =
  'text-muted-foreground/70 w-8 shrink-0 pe-1.5 text-end tabular-nums select-none';

function numberText(number: number | null) {
  if (number === null) {
    return '';
  }
  return String(number);
}

function piecesOf(line: DiffLine, partner: DiffLine | undefined) {
  const plain: WordPiece[] = [{ text: line.text, isChanged: false }];
  if (!partner) {
    return plain;
  }
  if (line.kind === 'removed') {
    const diff = wordDiffOf(line.text, partner.text);
    return diff.before;
  }
  if (line.kind === 'added') {
    const diff = wordDiffOf(partner.text, line.text);
    return diff.after;
  }
  return plain;
}

function CodeText({
  line,
  partner,
}: {
  line: DiffLine;
  partner: DiffLine | undefined;
}) {
  const pieces = piecesOf(line, partner);

  return (
    <code className='whitespace-pre'>
      {pieces.map((piece, index) => {
        if (piece.isChanged) {
          return (
            <span key={index} className={WORD_TONE[line.kind]}>
              {piece.text}
            </span>
          );
        }
        return <span key={index}>{piece.text}</span>;
      })}
    </code>
  );
}

type CodeLineProps = {
  line: DiffLine;
  partner: DiffLine | undefined;
  numbers: 'both' | 'old' | 'new';
  isResolved?: boolean;
};

function CodeLine({
  line,
  partner,
  numbers,
  isResolved = false,
}: CodeLineProps) {
  const kind = lineKindOf(line, isResolved);
  const showsBoth = numbers === 'both';
  const sideNumber = sideNumberOf(line, numbers);

  return (
    <div
      className={cn(
        'flex min-h-5 items-stretch pe-3 font-mono text-xs leading-5',
        LINE_TONE[kind]
      )}
    >
      {showsBoth && (
        <>
          <span className={NUMBER_CELL}>{numberText(line.oldNumber)}</span>
          <span className={NUMBER_CELL}>{numberText(line.newNumber)}</span>
        </>
      )}
      {!showsBoth && (
        <span className={NUMBER_CELL}>{numberText(sideNumber)}</span>
      )}
      <span
        aria-hidden='true'
        className={cn('w-4 shrink-0 text-center select-none', SIGN_TONE[kind])}
      >
        {SIGN[kind]}
      </span>
      <span className='sr-only'>{SPOKEN_KIND[kind]}</span>
      {isResolved && <code className='whitespace-pre'>{line.text}</code>}
      {!isResolved && <CodeText line={line} partner={partner} />}
    </div>
  );
}

function lineKindOf(line: DiffLine, isResolved: boolean) {
  if (isResolved) {
    return 'same';
  }
  return line.kind;
}

function sideNumberOf(line: DiffLine, numbers: 'both' | 'old' | 'new') {
  if (numbers === 'new') {
    return line.newNumber;
  }
  return line.oldNumber;
}

/** Context sits on both sides; each run of removed lines faces the added lines that replace it. */
export function splitRowsOf(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let removed: DiffLine[] = [];
  let added: DiffLine[] = [];

  function flush() {
    const height = Math.max(removed.length, added.length);
    for (let index = 0; index < height; index += 1) {
      const left = removed[index] ?? null;
      const right = added[index] ?? null;
      const leftKey = left?.key ?? '';
      const rightKey = right?.key ?? '';
      rows.push({ key: `${leftKey}|${rightKey}`, left, right });
    }
    removed = [];
    added = [];
  }

  for (const line of lines) {
    if (line.kind === 'same') {
      flush();
      rows.push({ key: line.key, left: line, right: line });
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
  return rows;
}

function EmptyCell() {
  return (
    <div
      aria-hidden='true'
      className='bg-foreground/[0.03] dark:bg-foreground/[0.05] min-h-5'
    />
  );
}

type LinesViewProps = {
  lines: DiffLine[];
  partners: Map<string, DiffLine>;
  layout: InlineDiffLayout;
};

function LinesView({ lines, partners, layout }: LinesViewProps) {
  if (layout === 'split') {
    const rows = splitRowsOf(lines);
    return (
      <div className='grid w-max min-w-full grid-cols-[repeat(2,minmax(max-content,1fr))]'>
        {rows.map((row) => (
          <div key={row.key} className='contents'>
            {row.left && (
              <CodeLine
                line={row.left}
                partner={partners.get(row.left.key)}
                numbers='old'
              />
            )}
            {!row.left && <EmptyCell />}
            {row.right && (
              <CodeLine
                line={row.right}
                partner={partners.get(row.right.key)}
                numbers='new'
              />
            )}
            {!row.right && <EmptyCell />}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className='w-max min-w-full'>
      {lines.map((line) => (
        <CodeLine
          key={line.key}
          line={line}
          partner={partners.get(line.key)}
          numbers='both'
        />
      ))}
    </div>
  );
}

function resolvedLinesOf(lines: DiffLine[], decision: HunkDecision) {
  const dropped = droppedKindOf(decision);
  return lines.filter((line) => line.kind !== dropped);
}

function droppedKindOf(decision: HunkDecision) {
  if (decision === 'accepted') {
    return 'removed';
  }
  return 'added';
}

const DECISION_WORD: Record<HunkDecision, string> = {
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const DECISION_COLOR: Record<HunkDecision, string> = {
  accepted: 'var(--success)',
  rejected: 'var(--muted-foreground)',
};

function resolvedNumbersOf(decision: HunkDecision) {
  if (decision === 'accepted') {
    return 'new';
  }
  return 'old';
}

const BODY_SWAP = {
  initial: { opacity: 0, filter: 'blur(2px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
} as const;

const BODY_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function bodyMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return BODY_FADE;
  }
  return BODY_SWAP;
}

type HunkViewProps = {
  lines: DiffLine[];
  partners: Map<string, DiffLine>;
  layout: InlineDiffLayout;
  decision: HunkDecision | undefined;
  onDecide: (decision: HunkDecision) => void;
  onUndo: () => void;
};

function HunkView({
  lines,
  partners,
  layout,
  decision,
  onDecide,
  onUndo,
}: HunkViewProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const bodyMotion = bodyMotionOf(shouldReduceMotion);
  const header = hunkHeaderOf(lines);
  const bodyKey = `${decision ?? 'open'}-${layout}`;

  return (
    <section
      aria-label={hunkLabelOf(header, decision)}
      className='flex flex-col'
    >
      <header className='bg-foreground/[0.035] dark:bg-foreground/[0.05] flex min-h-8 items-center gap-2 ps-3 pe-1.5'>
        <span className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs'>
          {header}
        </span>
        <AnimatePresence initial={false} mode='popLayout'>
          {decision && (
            <motion.span
              key={decision}
              className='flex'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Chip color={DECISION_COLOR[decision]}>
                {DECISION_WORD[decision]}
              </Chip>
            </motion.span>
          )}
        </AnimatePresence>
        {decision && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onUndo}
            className='text-muted-foreground h-6 px-2'
          >
            <RotateCcwIcon className='size-3.5' />
            Undo
          </Button>
        )}
        {!decision && (
          <span className='flex items-center gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => onDecide('accepted')}
              className='h-6 px-2'
            >
              <CheckIcon className='text-success-foreground size-3.5' />
              Accept
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => onDecide('rejected')}
              className='h-6 px-2'
            >
              <XIcon className='text-destructive-ink size-3.5' />
              Reject
            </Button>
          </span>
        )}
      </header>
      <AnimatedSize>
        <div className='relative'>
          <AnimatePresence initial={false} mode='popLayout'>
            <motion.div key={bodyKey} {...bodyMotion}>
              <CodeScroller label={header}>
                {decision && (
                  <ResolvedLines lines={lines} decision={decision} />
                )}
                {!decision && (
                  <LinesView
                    lines={lines}
                    partners={partners}
                    layout={layout}
                  />
                )}
              </CodeScroller>
            </motion.div>
          </AnimatePresence>
        </div>
      </AnimatedSize>
    </section>
  );
}

/** Long lines scroll sideways inside their own block, so the header and its buttons stay in view. */
function CodeScroller({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role='region'
      aria-label={`Code, ${label}`}
      tabIndex={0}
      className='focus-visible:ring-ring/25 overflow-x-auto py-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
    >
      {children}
    </div>
  );
}

function ResolvedLines({
  lines,
  decision,
}: {
  lines: DiffLine[];
  decision: HunkDecision;
}) {
  const kept = resolvedLinesOf(lines, decision);
  const numbers = resolvedNumbersOf(decision);

  return (
    <div className='w-max min-w-full'>
      {kept.map((line) => (
        <CodeLine
          key={line.key}
          line={line}
          partner={undefined}
          numbers={numbers}
          isResolved
        />
      ))}
    </div>
  );
}

function hunkLabelOf(header: string, decision: HunkDecision | undefined) {
  if (!decision) {
    return `Hunk ${header}`;
  }
  return `Hunk ${header}, ${DECISION_WORD[decision]}`;
}

function foldLabelOf(count: number, isOpen: boolean) {
  const lines = countOf(count, 'unchanged line');
  if (isOpen) {
    return `Hide ${lines}`;
  }
  return lines;
}

type FoldRowProps = {
  block: Extract<DiffBlock, { kind: 'fold' }>;
  isOpen: boolean;
  onToggle: () => void;
};

function FoldRow({ block, isOpen, onToggle }: FoldRowProps) {
  const label = foldLabelOf(block.lines.length, isOpen);

  return (
    <div className='flex flex-col'>
      <button
        type='button'
        aria-expanded={isOpen}
        onClick={onToggle}
        className='text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground focus-visible:ring-ring/25 flex h-7 w-full cursor-pointer items-center gap-2 ps-3 text-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
      >
        <ChevronsUpDownIcon className='size-3.5' />
        <Swap swapKey={label}>{label}</Swap>
      </button>
      <Fold open={isOpen}>
        <CodeScroller label={label}>
          <div className='w-max min-w-full'>
            {block.lines.map((line) => (
              <CodeLine
                key={line.key}
                line={line}
                partner={undefined}
                numbers='both'
              />
            ))}
          </div>
        </CodeScroller>
      </Fold>
    </div>
  );
}

export type InlineDiffProps = {
  path: string;
  before: string;
  after: string;
  layout: InlineDiffLayout;
  decisions: Record<string, HunkDecision>;
  onDecide: (hunkKey: string, decision: HunkDecision | null) => void;
  className?: string;
};

export function InlineDiff({
  path,
  before,
  after,
  layout,
  decisions,
  onDecide,
  className,
}: InlineDiffProps) {
  const [openFolds, setOpenFolds] = useState<string[]>([]);
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const lines = lineDiffOf(beforeLines, afterLines);
  const partners = partnersOf(lines);
  const blocks = blocksOf(lines, CONTEXT_LINES, MIN_FOLD);
  const counts = changeCountsOf(lines);
  const { folder, name } = pathPartsOf(path);

  function toggleFold(key: string) {
    setOpenFolds((current) => {
      const isOpen = current.includes(key);
      if (isOpen) {
        return current.filter((candidate) => candidate !== key);
      }
      return [...current, key];
    });
  }

  return (
    <div
      className={cn(
        'bg-foreground/[0.02] dark:bg-foreground/[0.035] flex flex-col overflow-hidden rounded-lg',
        className
      )}
    >
      <div className='flex items-center gap-2 px-3 py-2'>
        <FileTextIcon className='text-muted-foreground size-3.5 shrink-0' />
        <span className='min-w-0 flex-1 truncate font-mono text-xs'>
          <span className='text-muted-foreground'>{folder}</span>
          {name}
        </span>
        <span className='flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums'>
          <span className='text-success-foreground'>+{counts.additions}</span>
          <span className='text-destructive-ink'>−{counts.deletions}</span>
        </span>
      </div>
      <div aria-label={`Changes to ${name}`} role='group'>
        <div className='flex min-w-0 flex-col gap-px'>
          {blocks.map((block) => {
            if (block.kind === 'fold') {
              const isOpen = openFolds.includes(block.key);
              return (
                <FoldRow
                  key={block.key}
                  block={block}
                  isOpen={isOpen}
                  onToggle={() => toggleFold(block.key)}
                />
              );
            }
            return (
              <HunkView
                key={block.key}
                lines={block.lines}
                partners={partners}
                layout={layout}
                decision={decisions[block.key]}
                onDecide={(decision) => onDecide(block.key, decision)}
                onUndo={() => onDecide(block.key, null)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

const PATH = 'src/orders/checkout.ts';

const BEFORE = `import { palletFee } from '../billing/pallet-fee';
import { vatFor } from '../billing/vat';
import { roundCents } from '../money';
import type { Cart, CartLine, Checkout } from './types';

const ORDER_PREFIX = 'BM';

export function orderNumberOf(cart: Cart) {
  const year = cart.date.slice(0, 4);
  const serial = String(cart.serial).padStart(5, '0');
  return \`\${ORDER_PREFIX}-\${year}-\${serial}\`;
}

export function lineTotalOf(line: CartLine) {
  const total = line.unitPrice * line.quantity;
  return roundCents(total);
}

export function subtotalOf(cart: Cart) {
  let total = 0;
  for (const line of cart.lines) {
    total += lineTotalOf(line);
  }
  return roundCents(total);
}

export function shippingOf(cart: Cart) {
  const pallets = cart.lines.length;
  return palletFee({ pallets, date: cart.date });
}

export function discountOf(cart: Cart) {
  if (!cart.coupon) {
    return 0;
  }
  return cart.coupon.amount;
}

export function isEmptyCart(cart: Cart) {
  return cart.lines.length === 0;
}

export function itemCountOf(cart: Cart) {
  let count = 0;
  for (const line of cart.lines) {
    count += line.quantity;
  }
  return count;
}

export function checkoutOf(cart: Cart): Checkout {
  const subtotal = subtotalOf(cart);
  const shipping = shippingOf(cart);
  const discount = discountOf(cart);
  const vat = vatFor(subtotal + shipping);
  const total = subtotal + shipping + vat - discount;
  return { subtotal, shipping, discount, vat, total };
}`;

const AFTER = `import { palletFee } from '../billing/pallet-fee';
import { vatFor } from '../billing/vat';
import { roundCents } from '../money';
import type { Cart, CartLine, Checkout } from './types';

const ORDER_PREFIX = 'BM';
const UNITS_PER_PALLET = 40;

export function orderNumberOf(cart: Cart) {
  const year = cart.date.slice(0, 4);
  const serial = String(cart.serial).padStart(5, '0');
  return \`\${ORDER_PREFIX}-\${year}-\${serial}\`;
}

export function lineTotalOf(line: CartLine) {
  const total = line.unitPrice * line.quantity;
  return roundCents(total);
}

export function subtotalOf(cart: Cart) {
  let total = 0;
  for (const line of cart.lines) {
    total += lineTotalOf(line);
  }
  return roundCents(total);
}

function palletsOf(cart: Cart) {
  const units = itemCountOf(cart);
  return Math.ceil(units / UNITS_PER_PALLET);
}

export function shippingOf(cart: Cart) {
  const pallets = palletsOf(cart);
  return palletFee({ pallets, date: cart.date });
}

export function discountOf(cart: Cart) {
  if (!cart.coupon) {
    return 0;
  }
  return Math.min(cart.coupon.amount, subtotalOf(cart));
}

export function isEmptyCart(cart: Cart) {
  return cart.lines.length === 0;
}

export function itemCountOf(cart: Cart) {
  let count = 0;
  for (const line of cart.lines) {
    count += line.quantity;
  }
  return count;
}

export function checkoutOf(cart: Cart): Checkout {
  const subtotal = subtotalOf(cart);
  const shipping = shippingOf(cart);
  const discount = discountOf(cart);
  const taxable = subtotal + shipping - discount;
  const vat = vatFor(taxable);
  const total = taxable + vat;
  return { subtotal, shipping, discount, vat, total };
}`;

const LAYOUTS: Segment<InlineDiffLayout>[] = [
  { value: 'unified', label: 'Unified' },
  { value: 'split', label: 'Split' },
];

function layoutOf(choice: InlineDiffLayout, isWide: boolean) {
  if (isWide) {
    return choice;
  }
  return 'unified';
}

function hunkCountOf(before: string, after: string) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const lines = lineDiffOf(beforeLines, afterLines);
  const blocks = blocksOf(lines, CONTEXT_LINES, MIN_FOLD);
  const hunks = blocks.filter((block) => block.kind === 'hunk');
  return hunks.length;
}

const HUNK_COUNT = hunkCountOf(BEFORE, AFTER);

function decidedWordsOf(decided: number, total: number): WordRollWord[] {
  const countWord = {
    key: 'decided',
    text: String(decided),
    node: <MotionNumber value={decided} />,
  };
  return [countWord, 'of', String(total), 'hunks', 'decided'];
}

function noticeOf(decision: HunkDecision | null) {
  if (decision === 'accepted') {
    return 'Hunk accepted';
  }
  if (decision === 'rejected') {
    return 'Hunk rejected';
  }
  return 'Decision undone';
}

export default function Review05() {
  const [layoutChoice, setLayoutChoice] = useState<InlineDiffLayout>('unified');
  const [decisions, setDecisions] = useState<Record<string, HunkDecision>>({});
  const [notice, setNotice] = useState('');
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const width = useContainerWidth(frame, 720);
  const isWide = width >= SPLIT_MIN_WIDTH;
  const layout = layoutOf(layoutChoice, isWide);
  const decidedCount = Object.keys(decisions).length;
  const decidedWords = decidedWordsOf(decidedCount, HUNK_COUNT);

  function decide(hunkKey: string, decision: HunkDecision | null) {
    setDecisions((current) => {
      const next = { ...current };
      if (decision === null) {
        delete next[hunkKey];
        return next;
      }
      next[hunkKey] = decision;
      return next;
    });
    setNotice(noticeOf(decision));
  }

  return (
    <div
      ref={setFrame}
      className='bg-card hairline-ring ring-border flex w-full max-w-[52rem] flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1'>
        <span className='text-muted-foreground text-xs'>
          <WordRoll words={decidedWords} />
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
      </div>
      <InlineDiff
        path={PATH}
        before={BEFORE}
        after={AFTER}
        layout={layout}
        decisions={decisions}
        onDecide={decide}
      />
      <LiveRegion message={notice} />
    </div>
  );
}
