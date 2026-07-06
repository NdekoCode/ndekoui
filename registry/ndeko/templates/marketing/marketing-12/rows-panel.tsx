import { MotionNumber } from '@/components/core/motion-number';
import { TableIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';

import { STATEMENT_LINES, type StatementLine } from './data';
import { isCredit, signedAmountOf } from './statement';

const ROW_GRID =
  'grid grid-cols-[3.25rem_minmax(0,1fr)_5.5rem] items-center gap-3 px-2 @5xl/reader:grid-cols-[3.25rem_minmax(0,1fr)_6rem_5.5rem]';

const CELL_MOTION =
  'relative transition-[opacity,translate] ease-(--ease-out-strong)';

function cellMotionOf(isRead: boolean, readDelay: string) {
  if (isRead) {
    return cn(CELL_MOTION, 'translate-x-0 opacity-100 duration-300', readDelay);
  }
  return cn(CELL_MOTION, '-translate-x-2 opacity-0 delay-0 duration-150');
}

function placeholderOf(isRead: boolean) {
  if (isRead) {
    return 'opacity-0';
  }
  return 'opacity-100';
}

function hiddenUnless(isRead: boolean) {
  if (isRead) {
    return undefined;
  }
  return true;
}

function amountToneOf(line: StatementLine) {
  if (isCredit(line.amountCents)) {
    return 'text-success-foreground';
  }
  return 'text-foreground';
}

type TableRowProps = {
  line: StatementLine;
  isRead: boolean;
};

function TableRow({ line, isRead }: TableRowProps) {
  return (
    <div
      role='row'
      aria-hidden={hiddenUnless(isRead)}
      className={cn('relative h-9 text-[13px]', ROW_GRID)}
    >
      <span
        aria-hidden='true'
        className={cn(
          'bg-foreground/[0.04] absolute inset-x-0 inset-y-1 rounded-md transition-opacity duration-200',
          placeholderOf(isRead)
        )}
      />
      <span
        role='cell'
        className={cn(
          'text-muted-foreground text-xs tabular-nums',
          cellMotionOf(isRead, 'delay-0')
        )}
      >
        {line.date}
      </span>
      <span
        role='cell'
        className={cn('min-w-0 truncate', cellMotionOf(isRead, 'delay-50'))}
      >
        {line.description}
      </span>
      <span
        role='cell'
        className={cn(
          'hidden @5xl/reader:block',
          cellMotionOf(isRead, 'delay-100')
        )}
      >
        <Badge variant='secondary' className='text-muted-foreground'>
          {line.category}
        </Badge>
      </span>
      <span
        role='cell'
        className={cn(
          'text-end tabular-nums',
          amountToneOf(line),
          cellMotionOf(isRead, 'delay-150')
        )}
      >
        {signedAmountOf(line.amountCents)}
      </span>
    </div>
  );
}

type RowsPanelProps = {
  readIds: readonly string[];
  readCount: number;
  children: React.ReactNode;
};

export function RowsPanel({ readIds, readCount, children }: RowsPanelProps) {
  const total = STATEMENT_LINES.length;

  return (
    <section
      aria-label='Rows read from the statement'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex items-center gap-3'>
        <span className='keycap-3d text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg'>
          <TableIcon className='size-3.5' />
        </span>
        <div className='flex min-w-0 flex-col'>
          <p className='truncate text-sm font-medium'>Table</p>
          <p className='text-muted-foreground truncate text-xs'>
            A row appears as each line is read
          </p>
        </div>
        <p className='text-muted-foreground ms-auto shrink-0 text-xs tabular-nums'>
          <MotionNumber value={readCount} /> of {total} rows
        </p>
      </header>
      <div role='table' aria-label='Statement rows'>
        <div
          role='row'
          className={cn('text-muted-foreground h-8 text-xs', ROW_GRID)}
        >
          <span role='columnheader'>Date</span>
          <span role='columnheader'>Description</span>
          <span role='columnheader' className='hidden @5xl/reader:block'>
            Category
          </span>
          <span role='columnheader' className='text-end'>
            Amount
          </span>
        </div>
        {STATEMENT_LINES.map((line) => (
          <TableRow
            key={line.id}
            line={line}
            isRead={readIds.includes(line.id)}
          />
        ))}
      </div>
      {children}
    </section>
  );
}
