'use client';

import {
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Header,
  type PaginationState,
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
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/registry/ndeko/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
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
  },
  {
    id: '6',
    name: 'Mateo Rossi',
    email: 'mateo.rossi@example.com',
    location: 'Turin, Italy',
    status: 'Active',
    balance: 1500,
  },
  {
    id: '7',
    name: 'Priya Raman',
    email: 'priya.raman@example.com',
    location: 'Bengaluru, India',
    status: 'Inactive',
    balance: 200,
  },
  {
    id: '8',
    name: 'Lucas Meyer',
    email: 'lucas.meyer@example.com',
    location: 'Hamburg, Germany',
    status: 'Active',
    balance: 1000,
  },
  {
    id: '9',
    name: 'Sofia Lindqvist',
    email: 'sofia.lindqvist@example.com',
    location: 'Malmö, Sweden',
    status: 'Active',
    balance: 500,
  },
  {
    id: '10',
    name: 'Daniel Okafor',
    email: 'daniel.okafor@example.com',
    location: 'Lagos, Nigeria',
    status: 'Inactive',
    balance: 300,
  },
  {
    id: '11',
    name: 'Mei Lin',
    email: 'mei.lin@example.com',
    location: 'Taipei, Taiwan',
    status: 'Active',
    balance: 800,
  },
  {
    id: '12',
    name: 'Omar Farouk',
    email: 'omar.farouk@example.com',
    location: 'Cairo, Egypt',
    status: 'Active',
    balance: 1200,
  },
  {
    id: '13',
    name: 'Clara Duarte',
    email: 'clara.duarte@example.com',
    location: 'Porto, Portugal',
    status: 'Pending',
    balance: 400,
  },
  {
    id: '14',
    name: 'Noah Becker',
    email: 'noah.becker@example.com',
    location: 'Zurich, Switzerland',
    status: 'Inactive',
    balance: 600,
  },
  {
    id: '15',
    name: 'Hana Kim',
    email: 'hana.kim@example.com',
    location: 'Busan, South Korea',
    status: 'Active',
    balance: 1800,
  },
  {
    id: '16',
    name: 'Ethan Brooks',
    email: 'ethan.brooks@example.com',
    location: 'Denver, United States',
    status: 'Active',
    balance: 950,
  },
  {
    id: '17',
    name: 'Yara Nasser',
    email: 'yara.nasser@example.com',
    location: 'Amman, Jordan',
    status: 'Pending',
    balance: 150,
  },
  {
    id: '18',
    name: 'Felix Wagner',
    email: 'felix.wagner@example.com',
    location: 'Vienna, Austria',
    status: 'Active',
    balance: 2100,
  },
  {
    id: '19',
    name: 'Aiko Tanaka',
    email: 'aiko.tanaka@example.com',
    location: 'Kyoto, Japan',
    status: 'Inactive',
    balance: 0,
  },
  {
    id: '20',
    name: 'Samuel Adeyemi',
    email: 'samuel.adeyemi@example.com',
    location: 'Ibadan, Nigeria',
    status: 'Active',
    balance: 700,
  },
];

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const FIGURE_COLUMNS = new Set(['balance']);

const PAGE_SIZES = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
];

const INITIAL_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 5 };

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

const COLUMNS: ColumnDef<Account>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) => {
          table.toggleAllPageRowsSelected(checked);
        }}
        aria-label='Select all rows on this page'
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
    size: 28,
    enableSorting: false,
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
    size: 180,
  },
  {
    header: 'Email',
    accessorKey: 'email',
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.email}</span>
    ),
    size: 220,
  },
  {
    header: 'Location',
    accessorKey: 'location',
    size: 180,
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
    size: 110,
  },
  {
    header: 'Balance',
    accessorKey: 'balance',
    cell: ({ row }) => CURRENCY.format(row.original.balance),
    size: 120,
  },
];

function isFigureColumn(columnId: string) {
  return FIGURE_COLUMNS.has(columnId);
}

function alignClassOf(columnId: string) {
  if (isFigureColumn(columnId)) {
    return 'text-right tabular-nums';
  }
  return 'truncate';
}

function sortButtonOrderOf(columnId: string) {
  if (isFigureColumn(columnId)) {
    return 'flex-row-reverse';
  }
  return undefined;
}

function rowStateOf(isSelected: boolean) {
  if (isSelected) {
    return 'selected';
  }
  return undefined;
}

function ariaSortOf(column: Column<Account>) {
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

function rangeOf(pagination: PaginationState, rowCount: number) {
  const rowsBefore = pagination.pageIndex * pagination.pageSize;
  const firstOfPage = rowsBefore + 1;
  const firstRow = Math.min(firstOfPage, rowCount);
  const lastOfPage = rowsBefore + pagination.pageSize;
  const lastRow = Math.min(lastOfPage, rowCount);
  return { firstRow, lastRow };
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

function HeadContent({ header }: { header: Header<Account, unknown> }) {
  if (header.isPlaceholder) {
    return null;
  }
  const label = flexRender(header.column.columnDef.header, header.getContext());
  if (!header.column.getCanSort()) {
    return label;
  }
  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={header.column.getToggleSortingHandler()}
      className={cn(
        'text-muted-foreground hover:text-foreground -mx-2.5 gap-1.5',
        sortButtonOrderOf(header.column.id)
      )}
    >
      {label}
      <SortGlyph direction={header.column.getIsSorted()} />
    </Button>
  );
}

export default function Table18() {
  const pageSizeId = useId();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  const [pagination, setPagination] =
    useState<PaginationState>(INITIAL_PAGINATION);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is required and cannot be memoized by the React Compiler.
  const table = useReactTable({
    data: ACCOUNTS,
    columns: COLUMNS,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSortingRemoval: false,
  });
  const rowCount = table.getRowCount();
  const { firstRow, lastRow } = rangeOf(pagination, rowCount);
  const canGoBack = table.getCanPreviousPage();
  const canGoForward = table.getCanNextPage();

  function changePageSize(size: number | null) {
    if (size === null) {
      return;
    }
    table.setPageSize(size);
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <div className='bg-card hairline-ring ring-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <Table className='table-fixed'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    aria-sort={ariaSortOf(header.column)}
                    style={{ width: header.getSize() }}
                    className={cn('h-11', alignClassOf(header.column.id))}
                  >
                    <HeadContent header={header} />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={rowStateOf(row.getIsSelected())}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={alignClassOf(cell.column.id)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-x-8 gap-y-3'>
        <div className='flex items-center gap-3'>
          <Label htmlFor={pageSizeId} className='max-sm:sr-only'>
            Rows per page
          </Label>
          <Select
            items={PAGE_SIZES}
            value={pagination.pageSize}
            onValueChange={changePageSize}
          >
            <SelectTrigger id={pageSizeId} className='w-fit tabular-nums'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p
          aria-live='polite'
          className='text-muted-foreground flex grow justify-end text-[13px] whitespace-nowrap tabular-nums'
        >
          <span className='sr-only'>
            Showing rows {firstRow} to {lastRow} of {rowCount}
          </span>
          <span aria-hidden='true' className='inline-flex items-baseline'>
            <span className='text-foreground inline-flex items-baseline'>
              <MotionNumber value={firstRow} />
              –
              <MotionNumber value={lastRow} />
            </span>
            &nbsp;of&nbsp;
            <span className='text-foreground'>{rowCount}</span>
          </span>
        </p>
        <Pagination className='mx-0 w-auto'>
          <PaginationContent>
            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                onClick={() => {
                  table.firstPage();
                }}
                disabled={!canGoBack}
                aria-label='Go to first page'
              >
                <ChevronFirstIcon />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                onClick={() => {
                  table.previousPage();
                }}
                disabled={!canGoBack}
                aria-label='Go to previous page'
              >
                <ChevronLeftIcon />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                onClick={() => {
                  table.nextPage();
                }}
                disabled={!canGoForward}
                aria-label='Go to next page'
              >
                <ChevronRightIcon />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                onClick={() => {
                  table.lastPage();
                }}
                disabled={!canGoForward}
                aria-label='Go to last page'
              >
                <ChevronLastIcon />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
