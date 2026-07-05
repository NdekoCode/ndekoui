'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { Fragment } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ChevronDownIcon, InfoIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

type Status = 'Active' | 'Inactive' | 'Pending';

type Account = {
  id: string;
  name: string;
  email: string;
  location: string;
  status: Status;
  balance: number;
  note?: string;
};

const STATUS_VARIANTS = {
  Active: 'success',
  Inactive: 'secondary',
  Pending: 'warning',
} as const;

const ACCOUNTS: Account[] = [
  {
    id: '1',
    name: 'Jordan Hayes',
    email: 'jordan.hayes@example.com',
    location: 'Toronto, Canada',
    status: 'Active',
    balance: 1250,
    note: 'Asked to move the renewal to the first week of December.',
  },
  {
    id: '2',
    name: 'Anna Novak',
    email: 'anna.novak@example.com',
    location: 'Prague, Czechia',
    status: 'Active',
    balance: 600,
  },
  {
    id: '3',
    name: 'Kenji Watanabe',
    email: 'kenji.watanabe@example.com',
    location: 'Osaka, Japan',
    status: 'Inactive',
    balance: 650,
    note: 'Paused the account while the team is reorganised. Check in again in January.',
  },
  {
    id: '4',
    name: 'Lina Haddad',
    email: 'lina.haddad@example.com',
    location: 'Lyon, France',
    status: 'Active',
    balance: 0,
  },
  {
    id: '5',
    name: 'Ama Mensah',
    email: 'ama.mensah@example.com',
    location: 'Accra, Ghana',
    status: 'Pending',
    balance: -1000,
    note: 'The last invoice bounced. A new card was requested on the billing page.',
  },
];

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const FIGURE_COLUMNS = new Set(['balance']);

const NOTE_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.12, ease: [0.23, 1, 0.32, 1] },
  },
  shown: {
    opacity: 1,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  },
};

const INSTANT_VARIANTS: Variants = {
  hidden: { opacity: 0, transition: { duration: 0 } },
  shown: { opacity: 1, transition: { duration: 0 } },
};

function expandLabelOf(row: Row<Account>) {
  if (row.getIsExpanded()) {
    return `Hide the note on ${row.original.name}`;
  }
  return `Show the note on ${row.original.name}`;
}

function ExpandButton({ row }: { row: Row<Account> }) {
  if (!row.getCanExpand()) {
    return null;
  }
  return (
    <Button
      variant='ghost'
      size='icon-sm'
      onClick={row.getToggleExpandedHandler()}
      aria-expanded={row.getIsExpanded()}
      aria-label={expandLabelOf(row)}
      className='text-muted-foreground hover:text-foreground'
    >
      <ChevronDownIcon className='transition-transform duration-200 ease-(--ease-out-strong) group-aria-expanded/button:rotate-180' />
    </Button>
  );
}

const COLUMNS: ColumnDef<Account>[] = [
  {
    id: 'expander',
    header: () => <span className='sr-only'>Notes</span>,
    cell: ({ row }) => <ExpandButton row={row} />,
  },
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) => {
          table.toggleAllPageRowsSelected(checked);
        }}
        aria-label='Select all rows'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => {
          row.toggleSelected(checked);
        }}
        aria-label={`Select ${row.original.name}`}
      />
    ),
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
  },
  {
    header: 'Email',
    accessorKey: 'email',
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.email}</span>
    ),
  },
  {
    header: 'Location',
    accessorKey: 'location',
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    header: 'Balance',
    accessorKey: 'balance',
    cell: ({ row }) => CURRENCY.format(row.original.balance),
  },
];

function hasNote(row: Row<Account>) {
  return Boolean(row.original.note);
}

function alignClassOf(columnId: string) {
  if (FIGURE_COLUMNS.has(columnId)) {
    return 'text-right tabular-nums';
  }
  if (columnId === 'expander') {
    return 'w-px py-0 pe-0';
  }
  return 'whitespace-nowrap';
}

function rowStateOf(isSelected: boolean) {
  if (isSelected) {
    return 'selected';
  }
  return undefined;
}

function noteVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_VARIANTS;
  }
  return NOTE_VARIANTS;
}

function NoteRow({ row }: { row: Row<Account> }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = noteVariantsOf(shouldReduceMotion);
  const isExpanded = row.getIsExpanded();
  const columnCount = row.getVisibleCells().length;

  return (
    <TableRow
      data-state={rowStateOf(row.getIsSelected())}
      className='hover:bg-transparent'
    >
      <TableCell colSpan={columnCount} className='p-0'>
        <AnimatedSize className='mx-0' contentClassName='px-0'>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key='note'
                variants={variants}
                initial='hidden'
                animate='shown'
                exit='hidden'
                className='text-muted-foreground flex items-start gap-3 px-3 pb-3'
              >
                <span
                  aria-hidden='true'
                  className='flex h-5 w-7 shrink-0 items-center justify-center'
                >
                  <InfoIcon className='size-4' />
                </span>
                <p className='text-[13px] text-pretty'>{row.original.note}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatedSize>
      </TableCell>
    </TableRow>
  );
}

export default function Table17() {
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is required and cannot be memoized by the React Compiler.
  const table = useReactTable({
    data: ACCOUNTS,
    columns: COLUMNS,
    getRowCanExpand: hasNote,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <div className='w-full'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className='hover:bg-transparent'>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={alignClassOf(header.column.id)}
                >
                  {!header.isPlaceholder &&
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const canExpand = row.getCanExpand();
            return (
              <Fragment key={row.id}>
                <TableRow
                  data-state={rowStateOf(row.getIsSelected())}
                  className={cn(canExpand && 'border-b-0')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={alignClassOf(cell.column.id)}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {canExpand && <NoteRow row={row} />}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
