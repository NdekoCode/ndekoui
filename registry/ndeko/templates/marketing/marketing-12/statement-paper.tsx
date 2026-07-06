import { useId } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import { STATEMENT, STATEMENT_LINES, type StatementLine } from './data';
import { isCredit, signedAmountOf } from './statement';

const LINE_HEIGHT_REM = 2.25;

function headStyleOf(headIndex: number) {
  const offset = headIndex * LINE_HEIGHT_REM;
  return { translate: `0 ${offset}rem` };
}

function headIndexOf(headId: string | null) {
  const index = STATEMENT_LINES.findIndex((line) => line.id === headId);
  return Math.max(index, 0);
}

function headVisibilityOf(headId: string | null) {
  if (headId === null) {
    return 'opacity-0';
  }
  return 'opacity-100';
}

function dotVisibilityOf(isRead: boolean) {
  if (isRead) {
    return 'scale-100 opacity-100';
  }
  return 'scale-50 opacity-0';
}

function amountToneOf(line: StatementLine) {
  if (isCredit(line.amountCents)) {
    return 'text-success-foreground';
  }
  return undefined;
}

function lineToneOf(isRead: boolean) {
  if (isRead) {
    return 'text-muted-foreground';
  }
  return 'text-foreground';
}

type StatementLineButtonProps = {
  line: StatementLine;
  isRead: boolean;
  onToggle: (id: string) => void;
};

function StatementLineButton({
  line,
  isRead,
  onToggle,
}: StatementLineButtonProps) {
  function toggle() {
    onToggle(line.id);
  }

  return (
    <button
      type='button'
      aria-pressed={isRead}
      onClick={toggle}
      className={cn(
        'hover:bg-foreground/[0.04] focus-visible:ring-ring/25 relative flex h-9 w-full items-center gap-3 rounded-md ps-4 pe-2 text-start text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        lineToneOf(isRead)
      )}
    >
      <span
        aria-hidden='true'
        className={cn(
          'bg-primary absolute start-1.5 size-1.5 rounded-full transition-[scale,opacity] duration-200 ease-(--ease-out-strong)',
          dotVisibilityOf(isRead)
        )}
      />
      <span className='w-12 shrink-0 text-xs tabular-nums'>{line.date}</span>
      <span className='min-w-0 flex-1 truncate'>{line.description}</span>
      <span className={cn('shrink-0 tabular-nums', amountToneOf(line))}>
        {signedAmountOf(line.amountCents)}
      </span>
    </button>
  );
}

type StatementPaperProps = {
  readIds: readonly string[];
  headId: string | null;
  onToggle: (id: string) => void;
};

export function StatementPaper({
  readIds,
  headId,
  onToggle,
}: StatementPaperProps) {
  const headIndex = headIndexOf(headId);
  const hintId = useId();

  return (
    <section
      aria-label='Sample bank statement'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex items-center gap-3'>
        <CompanyMark seed={STATEMENT.bank} size='lg' />
        <div className='flex min-w-0 flex-col'>
          <p className='truncate text-sm font-medium'>{STATEMENT.bank}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {STATEMENT.title}, {STATEMENT.account}
          </p>
        </div>
        <Badge
          variant='secondary'
          className='ms-auto hidden @lg/reader:inline-flex'
        >
          {STATEMENT.note}
        </Badge>
      </header>
      <div className='flex flex-col'>
        <div className='text-muted-foreground flex h-8 items-center gap-3 ps-4 pe-2 text-xs'>
          <span className='w-12 shrink-0'>Date</span>
          <span className='flex-1'>Description</span>
          <span>Amount</span>
        </div>
        <p id={hintId} className='sr-only'>
          Press a line to read it into the table, press it again to take it back
        </p>
        <div className='relative'>
          <span
            aria-hidden='true'
            style={headStyleOf(headIndex)}
            className={cn(
              'bg-primary/10 pointer-events-none absolute inset-x-0 top-0 h-9 rounded-md transition-[translate,opacity] duration-300 ease-(--ease-out-strong)',
              headVisibilityOf(headId)
            )}
          />
          <ul aria-describedby={hintId} className='relative flex flex-col'>
            {STATEMENT_LINES.map((line) => (
              <li key={line.id}>
                <StatementLineButton
                  line={line}
                  isRead={readIds.includes(line.id)}
                  onToggle={onToggle}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
