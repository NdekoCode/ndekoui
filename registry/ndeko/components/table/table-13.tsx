'use client';

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type Header,
  type SortDirection,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  SearchIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

type Intent = 'Informational' | 'Navigational' | 'Commercial' | 'Transactional';

type Keyword = {
  id: string;
  keyword: string;
  intents: Intent[];
  volume: number;
  cpc: number;
  traffic: number;
  link: string;
};

type NumberRange = [number | undefined, number | undefined];

const INTENTS: Intent[] = [
  'Informational',
  'Navigational',
  'Commercial',
  'Transactional',
];

const INTENT_COLORS: Record<Intent, string> = {
  Informational: 'var(--info)',
  Navigational: 'var(--primary)',
  Commercial: 'var(--warning)',
  Transactional: 'var(--success)',
};

const ALL_INTENTS = 'all';

const INTENT_ITEMS = [
  { value: ALL_INTENTS, label: 'All intents' },
  ...INTENTS.map((intent) => ({ value: intent, label: intent })),
];

const KEYWORDS: Keyword[] = [
  {
    id: '1',
    keyword: 'react table component',
    intents: ['Informational', 'Navigational'],
    volume: 2507,
    cpc: 2.5,
    traffic: 88,
    link: 'example.com/table',
  },
  {
    id: '2',
    keyword: 'buy react templates',
    intents: ['Commercial', 'Transactional'],
    volume: 1850,
    cpc: 4.75,
    traffic: 65,
    link: 'example.com/templates',
  },
  {
    id: '3',
    keyword: 'react ui library',
    intents: ['Informational', 'Commercial'],
    volume: 3200,
    cpc: 3.25,
    traffic: 112,
    link: 'example.com/library',
  },
  {
    id: '4',
    keyword: 'tailwind components download',
    intents: ['Transactional'],
    volume: 890,
    cpc: 1.95,
    traffic: 45,
    link: 'example.com/download',
  },
  {
    id: '5',
    keyword: 'react dashboard template free',
    intents: ['Commercial', 'Transactional'],
    volume: 4100,
    cpc: 5.5,
    traffic: 156,
    link: 'example.com/dashboard',
  },
  {
    id: '6',
    keyword: 'how to sort a table in react',
    intents: ['Informational'],
    volume: 1200,
    cpc: 1.25,
    traffic: 42,
    link: 'example.com/guides/sorting',
  },
  {
    id: '7',
    keyword: 'react ui kit premium',
    intents: ['Commercial', 'Transactional'],
    volume: 760,
    cpc: 6.8,
    traffic: 28,
    link: 'example.com/pricing',
  },
  {
    id: '8',
    keyword: 'react component documentation',
    intents: ['Informational', 'Navigational'],
    volume: 950,
    cpc: 1.8,
    traffic: 35,
    link: 'example.com/docs',
  },
];

const COMPACT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const FIGURE_COLUMNS = new Set(['volume', 'cpc', 'traffic']);

const NUMBER_INPUT =
  'flex-1 [-moz-appearance:textfield] focus-visible:z-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

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

const includesIntent: FilterFn<Keyword> = (row, columnId, filterValue) => {
  const intents = row.getValue<Intent[]>(columnId);
  return intents.includes(filterValue);
};

const COLUMNS: ColumnDef<Keyword>[] = [
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
        aria-label={`Select ${row.original.keyword}`}
      />
    ),
    enableSorting: false,
  },
  {
    header: 'Keyword',
    accessorKey: 'keyword',
    filterFn: 'includesString',
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.keyword}</span>
    ),
  },
  {
    header: 'Intents',
    accessorKey: 'intents',
    filterFn: includesIntent,
    enableSorting: false,
    cell: ({ row }) => (
      <div className='flex gap-1'>
        {row.original.intents.map((intent) => (
          <Chip
            key={intent}
            color={INTENT_COLORS[intent]}
            title={intent}
            className='w-5 justify-center px-0'
          >
            <span aria-hidden='true'>{intent.charAt(0)}</span>
            <span className='sr-only'>{intent}</span>
          </Chip>
        ))}
      </div>
    ),
  },
  {
    header: 'Volume',
    accessorKey: 'volume',
    filterFn: 'inNumberRange',
    cell: ({ row }) => COMPACT.format(row.original.volume),
  },
  {
    header: 'CPC',
    accessorKey: 'cpc',
    filterFn: 'inNumberRange',
    cell: ({ row }) => CURRENCY.format(row.original.cpc),
  },
  {
    header: 'Traffic',
    accessorKey: 'traffic',
    filterFn: 'inNumberRange',
    cell: ({ row }) => COMPACT.format(row.original.traffic),
  },
  {
    header: 'Link',
    accessorKey: 'link',
    enableSorting: false,
    cell: ({ row }) => (
      <a
        href={`https://${row.original.link}`}
        target='_blank'
        rel='noreferrer'
        className='text-primary-ink inline-flex items-center gap-1 underline-offset-4 hover:underline'
      >
        {row.original.link}
        <ExternalLinkIcon aria-hidden='true' className='size-3' />
      </a>
    ),
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

function rowStateOf(isSelected: boolean) {
  if (isSelected) {
    return 'selected';
  }
  return undefined;
}

function ariaSortOf(column: Column<Keyword>) {
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

function sortButtonOrderOf(columnId: string) {
  if (isFigureColumn(columnId)) {
    return 'flex-row-reverse';
  }
  return undefined;
}

function rangeOf(value: unknown): NumberRange {
  if (Array.isArray(value)) {
    return [value[0], value[1]];
  }
  return [undefined, undefined];
}

function boundOf(text: string) {
  if (text === '') {
    return undefined;
  }
  return Number(text);
}

function SortGlyph({ direction }: { direction: false | SortDirection }) {
  const shouldReduceMotion = useReducedMotion();
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

function HeadContent({ header }: { header: Header<Keyword, unknown> }) {
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

function TextFilter({
  column,
  label,
}: {
  column: Column<Keyword> | undefined;
  label: string;
}) {
  const id = useId();
  if (!column) {
    return null;
  }
  const value = String(column.getFilterValue() ?? '');

  return (
    <div className='flex w-44 flex-col gap-2'>
      <Label htmlFor={id}>{label}</Label>
      <div className='relative'>
        <Input
          id={id}
          type='search'
          className='peer ps-8'
          value={value}
          onChange={(event) => {
            column.setFilterValue(event.currentTarget.value);
          }}
          placeholder={`Search ${label.toLowerCase()}`}
        />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 peer-disabled:opacity-50'>
          <SearchIcon aria-hidden='true' className='size-4' />
        </span>
      </div>
    </div>
  );
}

function IntentFilter({ column }: { column: Column<Keyword> | undefined }) {
  const id = useId();
  if (!column) {
    return null;
  }
  const value = String(column.getFilterValue() ?? ALL_INTENTS);

  function changeIntent(intent: string | null) {
    if (!column) {
      return;
    }
    const isAll = intent === ALL_INTENTS;
    if (isAll) {
      column.setFilterValue(undefined);
      return;
    }
    column.setFilterValue(intent ?? undefined);
  }

  return (
    <div className='flex w-40 flex-col gap-2'>
      <Label htmlFor={id}>Intents</Label>
      <Select items={INTENT_ITEMS} value={value} onValueChange={changeIntent}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INTENT_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RangeFilter({
  column,
  label,
}: {
  column: Column<Keyword> | undefined;
  label: string;
}) {
  const labelId = useId();
  if (!column) {
    return null;
  }
  const [min, max] = rangeOf(column.getFilterValue());

  function changeMin(text: string) {
    column?.setFilterValue((previous: unknown) => {
      const [, previousMax] = rangeOf(previous);
      return [boundOf(text), previousMax];
    });
  }

  function changeMax(text: string) {
    column?.setFilterValue((previous: unknown) => {
      const [previousMin] = rangeOf(previous);
      return [previousMin, boundOf(text)];
    });
  }

  return (
    <div className='flex w-36 flex-col gap-2'>
      <span id={labelId} className='text-[13px] leading-none font-medium'>
        {label}
      </span>
      <div role='group' aria-labelledby={labelId} className='flex'>
        <Input
          type='number'
          inputMode='decimal'
          className={cn(NUMBER_INPUT, 'rounded-e-none')}
          value={min ?? ''}
          onChange={(event) => {
            changeMin(event.currentTarget.value);
          }}
          placeholder='Min'
          aria-label={`${label} minimum`}
        />
        <Input
          type='number'
          inputMode='decimal'
          className={cn(NUMBER_INPUT, '-ms-px rounded-s-none')}
          value={max ?? ''}
          onChange={(event) => {
            changeMax(event.currentTarget.value);
          }}
          placeholder='Max'
          aria-label={`${label} maximum`}
        />
      </div>
    </div>
  );
}

export default function Table13() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'traffic', desc: false },
  ]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is required and cannot be memoized by the React Compiler.
  const table = useReactTable({
    data: KEYWORDS,
    columns: COLUMNS,
    state: { sorting, columnFilters },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
  });
  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;

  function clearFilters() {
    table.resetColumnFilters();
  }

  return (
    <div className='flex w-full flex-col gap-6'>
      <div className='flex flex-wrap gap-3'>
        <TextFilter column={table.getColumn('keyword')} label='Keyword' />
        <IntentFilter column={table.getColumn('intents')} />
        <RangeFilter column={table.getColumn('volume')} label='Volume' />
        <RangeFilter column={table.getColumn('cpc')} label='CPC' />
        <RangeFilter column={table.getColumn('traffic')} label='Traffic' />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className='hover:bg-transparent'>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  aria-sort={ariaSortOf(header.column)}
                  className={alignClassOf(header.column.id)}
                >
                  <HeadContent header={header} />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} data-state={rowStateOf(row.getIsSelected())}>
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
          {!hasRows && (
            <TableRow className='hover:bg-transparent'>
              <TableCell colSpan={COLUMNS.length} className='h-24 text-center'>
                <div className='flex flex-col items-center gap-1'>
                  <span className='text-muted-foreground'>
                    No keywords match these filters.
                  </span>
                  <Button variant='link' size='sm' onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableCaption>Illustrative search figures.</TableCaption>
      </Table>
    </div>
  );
}
