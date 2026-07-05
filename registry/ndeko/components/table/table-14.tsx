'use client';

import {
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type Header,
  type Row,
  type SortDirection,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

type Status = 'Active' | 'Inactive' | 'Pending';

type Performance = 'Excellent' | 'Good' | 'Average' | 'Poor';

type Employee = {
  id: string;
  name: string;
  email: string;
  location: string;
  status: Status;
  balance: number;
  department: string;
  role: string;
  joinDate: string;
  lastActive: string;
  performance: Performance;
};

const STATUS_VARIANTS = {
  Active: 'success',
  Inactive: 'secondary',
  Pending: 'warning',
} as const;

const PERFORMANCE_RANKS: Record<Performance, number> = {
  Poor: 0,
  Average: 1,
  Good: 2,
  Excellent: 3,
};

const EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Jordan Hayes',
    email: 'jordan.hayes@example.com',
    location: 'Toronto, Canada',
    status: 'Active',
    balance: 1250,
    department: 'Engineering',
    role: 'Staff engineer',
    joinDate: '2021-03-14',
    lastActive: '2026-11-04',
    performance: 'Excellent',
  },
  {
    id: '2',
    name: 'Anna Novak',
    email: 'anna.novak@example.com',
    location: 'Prague, Czechia',
    status: 'Active',
    balance: 600,
    department: 'Design',
    role: 'Product designer',
    joinDate: '2022-07-01',
    lastActive: '2026-11-05',
    performance: 'Good',
  },
  {
    id: '3',
    name: 'Kenji Watanabe',
    email: 'kenji.watanabe@example.com',
    location: 'Osaka, Japan',
    status: 'Inactive',
    balance: 650,
    department: 'Finance',
    role: 'Analyst',
    joinDate: '2019-10-21',
    lastActive: '2026-08-30',
    performance: 'Average',
  },
  {
    id: '4',
    name: 'Lina Haddad',
    email: 'lina.haddad@example.com',
    location: 'Lyon, France',
    status: 'Active',
    balance: 0,
    department: 'Marketing',
    role: 'Content lead',
    joinDate: '2023-01-09',
    lastActive: '2026-11-03',
    performance: 'Good',
  },
  {
    id: '5',
    name: 'Ama Mensah',
    email: 'ama.mensah@example.com',
    location: 'Accra, Ghana',
    status: 'Pending',
    balance: -1000,
    department: 'Sales',
    role: 'Account executive',
    joinDate: '2025-05-19',
    lastActive: '2026-10-28',
    performance: 'Excellent',
  },
];

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const DAY = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

const FIGURE_COLUMNS = new Set(['balance']);

const RESIZE_HANDLE = [
  'absolute top-0 -right-2 z-10 flex h-full w-4 cursor-col-resize touch-none select-none justify-center',
  'before:absolute before:inset-y-0 before:w-(--hairline) before:translate-x-px before:bg-border before:transition-colors before:duration-150',
  'hover:before:bg-foreground/30 data-resizing:before:bg-primary',
].join(' ');

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const GLYPH_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function dayOf(isoDate: string) {
  const date = new Date(isoDate);
  return DAY.format(date);
}

function byPerformance(first: Row<Employee>, second: Row<Employee>) {
  const firstRank = PERFORMANCE_RANKS[first.original.performance];
  const secondRank = PERFORMANCE_RANKS[second.original.performance];
  return firstRank - secondRank;
}

const COLUMNS: ColumnDef<Employee>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    sortDescFirst: false,
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
  {
    header: 'Department',
    accessorKey: 'department',
  },
  {
    header: 'Role',
    accessorKey: 'role',
  },
  {
    header: 'Join date',
    accessorKey: 'joinDate',
    cell: ({ row }) => dayOf(row.original.joinDate),
  },
  {
    header: 'Last active',
    accessorKey: 'lastActive',
    cell: ({ row }) => dayOf(row.original.lastActive),
  },
  {
    header: 'Performance',
    accessorKey: 'performance',
    sortingFn: byPerformance,
  },
];

function isFigureColumn(columnId: string) {
  return FIGURE_COLUMNS.has(columnId);
}

function alignClassOf(columnId: string) {
  if (isFigureColumn(columnId)) {
    return 'text-right tabular-nums';
  }
  return undefined;
}

function sortButtonOrderOf(columnId: string) {
  if (isFigureColumn(columnId)) {
    return 'flex-row-reverse';
  }
  return undefined;
}

function resizingAttributeOf(isResizing: boolean) {
  if (isResizing) {
    return '';
  }
  return undefined;
}

function ariaSortOf(column: Column<Employee>) {
  if (!column.getCanSort()) {
    return undefined;
  }
  const direction = column.getIsSorted();
  if (direction === 'asc') {
    return 'ascending';
  }
  if (direction === 'desc') {
    return 'descending';
  }
  return 'none';
}

function glyphVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return GLYPH_VARIANTS;
}

function sortGlyphOf(direction: false | SortDirection) {
  if (direction === 'asc') {
    return {
      key: 'asc',
      icon: <ChevronUpIcon className='text-foreground size-3.5' />,
    };
  }
  if (direction === 'desc') {
    return {
      key: 'desc',
      icon: <ChevronDownIcon className='text-foreground size-3.5' />,
    };
  }
  return {
    key: 'none',
    icon: <ChevronsUpDownIcon className='size-3.5 opacity-40' />,
  };
}

function SortGlyph({ direction }: { direction: false | SortDirection }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = glyphVariantsOf(shouldReduceMotion);
  const glyph = sortGlyphOf(direction);

  return (
    <span aria-hidden='true' className='relative inline-flex size-3.5'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={glyph.key}
          className='inline-flex'
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {glyph.icon}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function HeadContent({ header }: { header: Header<Employee, unknown> }) {
  if (header.isPlaceholder) {
    return null;
  }
  const label = flexRender(header.column.columnDef.header, header.getContext());
  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={header.column.getToggleSortingHandler()}
      className={cn(
        'text-muted-foreground hover:text-foreground -mx-2.5 max-w-[calc(100%+1.25rem)] gap-1.5',
        sortButtonOrderOf(header.column.id)
      )}
    >
      <span className='truncate'>{label}</span>
      <SortGlyph direction={header.column.getIsSorted()} />
    </Button>
  );
}

function ResizeHandle({ header }: { header: Header<Employee, unknown> }) {
  if (!header.column.getCanResize()) {
    return null;
  }
  const resizeHandler = header.getResizeHandler();

  return (
    <div
      aria-hidden='true'
      data-resizing={resizingAttributeOf(header.column.getIsResizing())}
      onDoubleClick={() => {
        header.column.resetSize();
      }}
      onMouseDown={resizeHandler}
      onTouchStart={resizeHandler}
      className={RESIZE_HANDLE}
    />
  );
}

export default function Table14() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is required and cannot be memoized by the React Compiler.
  const table = useReactTable({
    data: EMPLOYEES,
    columns: COLUMNS,
    state: { sorting },
    onSortingChange: setSorting,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
  });
  const tableWidth = table.getCenterTotalSize();

  return (
    <div className='w-full'>
      <Table className='table-fixed' style={{ width: tableWidth }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className='hover:bg-transparent'>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  aria-sort={ariaSortOf(header.column)}
                  style={{ width: header.getSize() }}
                  className={cn(
                    'relative select-none last:[&>div]:hidden',
                    alignClassOf(header.column.id)
                  )}
                >
                  <HeadContent header={header} />
                  <ResizeHandle header={header} />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn('truncate', alignClassOf(cell.column.id))}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
