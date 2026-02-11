'use client';

import {
  type Column,
  type ColumnDef,
  type ColumnPinningPosition,
  flexRender,
  getCoreRowModel,
  type Header,
  useReactTable,
} from '@tanstack/react-table';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import {
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  EllipsisIcon,
  PinOffIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
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

const RESIZE_HANDLE = [
  'absolute top-0 -right-2 z-10 flex h-full w-4 cursor-col-resize touch-none select-none justify-center',
  'before:absolute before:inset-y-0 before:w-(--hairline) before:translate-x-px before:bg-border before:transition-colors before:duration-150',
  'hover:before:bg-foreground/30 data-resizing:before:bg-primary',
].join(' ');

function dayOf(isoDate: string) {
  const date = new Date(isoDate);
  return DAY.format(date);
}

const COLUMNS: ColumnDef<Employee>[] = [
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
  },
];

const FIGURE_COLUMNS = new Set(['balance']);

const SEPARATE_ROW_LINES = [
  'table-fixed border-separate border-spacing-0',
  '[&_tr]:border-0 [&_th]:hairline-b [&_tr:not(:last-child)_td]:hairline-b',
  '[&_td]:border-border [&_th]:border-border',
].join(' ');

const PINNED_CELL = [
  'data-pinned:bg-card/90 data-pinned:backdrop-blur-xs',
  '[&[data-pinned=left][data-last-col=left]]:hairline-r [&[data-pinned=right][data-last-col=right]]:hairline-l',
].join(' ');

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function alignClassOf(columnId: string) {
  if (FIGURE_COLUMNS.has(columnId)) {
    return 'text-right tabular-nums';
  }
  return undefined;
}

function resizingAttributeOf(isResizing: boolean) {
  if (isResizing) {
    return '';
  }
  return undefined;
}

function pinnedAttributeOf(position: ColumnPinningPosition) {
  if (position) {
    return position;
  }
  return undefined;
}

function pinEdgeOf(column: Column<Employee>) {
  const position = column.getIsPinned();
  const isLastLeft = position === 'left' && column.getIsLastColumn('left');
  if (isLastLeft) {
    return 'left';
  }
  const isFirstRight = position === 'right' && column.getIsFirstColumn('right');
  if (isFirstRight) {
    return 'right';
  }
  return undefined;
}

function pinningStyleOf(column: Column<Employee>): React.CSSProperties {
  const position = column.getIsPinned();
  const width = column.getSize();
  if (position === 'left') {
    const left = column.getStart('left');
    return { position: 'sticky', left, width, zIndex: 1 };
  }
  if (position === 'right') {
    const right = column.getAfter('right');
    return { position: 'sticky', right, width, zIndex: 1 };
  }
  return { position: 'relative', width, zIndex: 0 };
}

function labelOf(column: Column<Employee>) {
  const header = column.columnDef.header;
  if (typeof header === 'string') {
    return header;
  }
  return column.id;
}

function pinControlKeyOf(position: ColumnPinningPosition) {
  if (position) {
    return 'pinned';
  }
  return 'unpinned';
}

function PinControl({ column }: { column: Column<Employee> }) {
  const label = labelOf(column);
  const position = column.getIsPinned();

  if (position) {
    return (
      <Button
        variant='ghost'
        size='icon-sm'
        onClick={() => {
          column.pin(false);
        }}
        aria-label={`Unpin the ${label} column`}
        className='text-muted-foreground hover:text-foreground'
      >
        <PinOffIcon />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Pin options for the ${label} column`}
            className='text-muted-foreground hover:text-foreground'
          />
        }
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => {
            column.pin('left');
          }}
        >
          <ArrowLeftToLineIcon />
          Stick to left
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            column.pin('right');
          }}
        >
          <ArrowRightToLineIcon />
          Stick to right
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SwappingPinControl({ column }: { column: Column<Employee> }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const controlKey = pinControlKeyOf(column.getIsPinned());

  return (
    <span className='relative -me-1 inline-flex shrink-0'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={controlKey}
          className='inline-flex'
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          <PinControl column={column} />
        </motion.span>
      </AnimatePresence>
    </span>
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

export default function Table15() {
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is required and cannot be memoized by the React Compiler.
  const table = useReactTable({
    data: EMPLOYEES,
    columns: COLUMNS,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
  });
  const tableWidth = table.getTotalSize();

  return (
    <div className='w-full'>
      <Table className={SEPARATE_ROW_LINES} style={{ width: tableWidth }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className='hover:bg-transparent'>
              {headerGroup.headers.map((header) => {
                const { column } = header;
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={pinningStyleOf(column)}
                    data-pinned={pinnedAttributeOf(column.getIsPinned())}
                    data-last-col={pinEdgeOf(column)}
                    className={cn(
                      'relative truncate last:[&>div:last-child]:hidden',
                      PINNED_CELL
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='truncate'>
                        {!header.isPlaceholder &&
                          flexRender(
                            column.columnDef.header,
                            header.getContext()
                          )}
                      </span>
                      {column.getCanPin() && (
                        <SwappingPinControl column={column} />
                      )}
                    </div>
                    <ResizeHandle header={header} />
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const { column } = cell;
                return (
                  <TableCell
                    key={cell.id}
                    style={pinningStyleOf(column)}
                    data-pinned={pinnedAttributeOf(column.getIsPinned())}
                    data-last-col={pinEdgeOf(column)}
                    className={cn(
                      'truncate',
                      PINNED_CELL,
                      alignClassOf(column.id)
                    )}
                  >
                    {flexRender(column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
