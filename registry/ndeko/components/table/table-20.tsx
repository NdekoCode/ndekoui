'use client';

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Header,
  type PaginationState,
  type Row,
  type SortDirection,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { createContext, useContext, useId, useRef, useState } from 'react';

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
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
  PlusIcon,
  TrashIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/registry/ndeko/ui/alert-dialog';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';
import { Label } from '@/registry/ndeko/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/registry/ndeko/ui/pagination';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
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
    name: 'Samuel Mukendi',
    email: 'samuel.mukendi@example.com',
    location: 'Kinshasa, DR Congo',
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

const INITIAL_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 10 };

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

const STATUSES: Status[] = ['Active', 'Inactive', 'Pending'];

const COUNT_BADGE =
  'keycap-3d text-muted-foreground -me-1 inline-flex h-5 min-w-5 items-center justify-center overflow-hidden rounded-[5px] px-1 text-[11px] font-medium tabular-nums';

const PRESENCE_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    filter: 'blur(2px)',
    transition: { duration: 0.12, ease: [0.23, 1, 0.32, 1] },
  },
  shown: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
  },
};

const PRESENCE_FADE_VARIANTS: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.12 } },
  shown: { opacity: 1, transition: { duration: 0.18 } },
};

const DeleteAccountContext = createContext<(id: string) => void>(() => {});

const matchesNameOrEmail: FilterFn<Account> = (row, _columnId, filterValue) => {
  const content = `${row.original.name} ${row.original.email}`;
  const searchableContent = content.toLowerCase();
  const searchTerm = String(filterValue ?? '').toLowerCase();
  return searchableContent.includes(searchTerm);
};

const matchesStatuses: FilterFn<Account> = (row, columnId, filterValue) => {
  const statuses: string[] = filterValue ?? [];
  if (statuses.length === 0) {
    return true;
  }
  const status = row.getValue<string>(columnId);
  return statuses.includes(status);
};

function Shortcut({ keys }: { keys: string[] }) {
  return (
    <DropdownMenuShortcut>
      <KbdGroup>
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </KbdGroup>
    </DropdownMenuShortcut>
  );
}

function RowActions({ row }: { row: Row<Account> }) {
  const deleteAccount = useContext(DeleteAccountContext);

  return (
    <div className='flex justify-end'>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Actions for ${row.original.name}`}
              className='text-muted-foreground hover:text-foreground'
            />
          }
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Edit
              <Shortcut keys={['⌘', 'E']} />
            </DropdownMenuItem>
            <DropdownMenuItem>
              Duplicate
              <Shortcut keys={['⌘', 'D']} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Archive
              <Shortcut keys={['⌘', 'A']} />
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Move to project</DropdownMenuItem>
                <DropdownMenuItem>Move to folder</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Advanced options</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Add to favorites</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            onClick={() => {
              deleteAccount(row.original.id);
            }}
          >
            Delete
            <Shortcut keys={['⌘', '⌫']} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

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
    enableHiding: false,
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
    size: 180,
    filterFn: matchesNameOrEmail,
    enableHiding: false,
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
    filterFn: matchesStatuses,
  },
  {
    header: 'Balance',
    accessorKey: 'balance',
    cell: ({ row }) => CURRENCY.format(row.original.balance),
    size: 120,
  },
  {
    id: 'actions',
    header: () => <span className='sr-only'>Actions</span>,
    cell: ({ row }) => <RowActions row={row} />,
    size: 56,
    enableSorting: false,
    enableHiding: false,
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

function labelOf(column: Column<Account>) {
  const header = column.columnDef.header;
  if (typeof header === 'string') {
    return header;
  }
  return column.id;
}

function statusesOf(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

function accountCountLabel(count: number) {
  if (count === 1) {
    return '1 account';
  }
  return `${count} accounts`;
}

function presenceVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return PRESENCE_FADE_VARIANTS;
  }
  return PRESENCE_VARIANTS;
}

function NameFilter({ column }: { column: Column<Account> | undefined }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = presenceVariantsOf(shouldReduceMotion);
  if (!column) {
    return null;
  }
  const value = String(column.getFilterValue() ?? '');
  const hasValue = value !== '';

  function clearFilter() {
    column?.setFilterValue('');
    inputRef.current?.focus();
  }

  return (
    <div className='relative'>
      <Input
        id={id}
        ref={inputRef}
        type='search'
        className='peer min-w-60 ps-8 pe-8'
        value={value}
        onChange={(event) => {
          column.setFilterValue(event.currentTarget.value);
        }}
        placeholder='Filter by name or email'
        aria-label='Filter by name or email'
      />
      <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 peer-disabled:opacity-50'>
        <ListFilterIcon aria-hidden='true' className='size-4' />
      </span>
      <AnimatePresence initial={false}>
        {hasValue && (
          <motion.span
            key='clear'
            className='absolute inset-y-0 end-0.5 flex items-center'
            variants={variants}
            initial='hidden'
            animate='shown'
            exit='hidden'
          >
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={clearFilter}
              aria-label='Clear filter'
              className='text-muted-foreground hover:text-foreground'
            >
              <CircleXIcon />
            </Button>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusFilter({ column }: { column: Column<Account> | undefined }) {
  const id = useId();
  if (!column) {
    return null;
  }
  const selectedStatuses = statusesOf(column.getFilterValue());
  const statusCounts = column.getFacetedUniqueValues();
  const selectedCount = selectedStatuses.length;
  const hasSelection = selectedCount > 0;

  function changeStatus(status: string, checked: boolean) {
    const others = selectedStatuses.filter((value) => value !== status);
    const next = [...others];
    if (checked) {
      next.push(status);
    }
    const hasNext = next.length > 0;
    if (!hasNext) {
      column?.setFilterValue(undefined);
      return;
    }
    column?.setFilterValue(next);
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' />}>
        <FilterIcon className='-ms-1 opacity-60' />
        Status
        {hasSelection && (
          <span className={COUNT_BADGE}>
            <MotionNumber value={selectedCount} className='text-foreground' />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto min-w-40 p-3'>
        <div className='flex flex-col gap-3'>
          <span className='text-muted-foreground text-xs font-medium'>
            Filter by status
          </span>
          {STATUSES.map((status) => {
            const checkboxId = `${id}-${status}`;
            const count = statusCounts.get(status) ?? 0;
            return (
              <div key={status} className='flex items-center gap-2'>
                <Checkbox
                  id={checkboxId}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={(checked) => {
                    changeStatus(status, checked);
                  }}
                />
                <Label
                  htmlFor={checkboxId}
                  className='flex grow justify-between gap-4 font-normal'
                >
                  {status}
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    {count}
                  </span>
                </Label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ColumnToggles({ columns }: { columns: Column<Account>[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' />}>
        <Columns3Icon className='-ms-1 opacity-60' />
        View
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Columns</DropdownMenuLabel>
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(checked) => {
              column.toggleVisibility(checked);
            }}
          >
            {labelOf(column)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeleteSelected({
  count,
  onConfirm,
}: {
  count: number;
  onConfirm: () => void;
}) {
  const accounts = accountCountLabel(count);

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant='outline' />}>
        <TrashIcon className='-ms-1 opacity-60' />
        Delete
        <span className={COUNT_BADGE}>
          <MotionNumber value={count} className='text-foreground' />
        </span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <div className='flex flex-col gap-3 max-sm:items-center sm:flex-row sm:gap-4'>
          <span
            aria-hidden='true'
            className='keycap-3d text-destructive-ink flex size-10 shrink-0 items-center justify-center rounded-full'
          >
            <CircleAlertIcon className='size-4' />
          </span>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {accounts}?</AlertDialogTitle>
            <AlertDialogDescription>
              The selected {accounts} and their history are removed for the
              whole team. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant='destructive' onClick={onConfirm}>
            Delete {accounts}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function Table20() {
  const pageSizeId = useId();
  const [accounts, setAccounts] = useState(ACCOUNTS);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] =
    useState<PaginationState>(INITIAL_PAGINATION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const presenceVariants = presenceVariantsOf(shouldReduceMotion);

  function deleteAccount(id: string) {
    setAccounts((current) => current.filter((account) => account.id !== id));
  }

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is required and cannot be memoized by the React Compiler.
  const table = useReactTable({
    data: accounts,
    columns: COLUMNS,
    getRowId: (account) => account.id,
    state: { sorting, pagination, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSortingRemoval: false,
  });
  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;
  const rowCount = table.getRowCount();
  const { firstRow, lastRow } = rangeOf(pagination, rowCount);
  const canGoBack = table.getCanPreviousPage();
  const canGoForward = table.getCanNextPage();
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const hasSelection = selectedCount > 0;
  const hideableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide());
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  function deleteSelected() {
    const selectedIds = selectedRows.map((row) => row.original.id);
    setAccounts((current) =>
      current.filter((account) => !selectedIds.includes(account.id))
    );
    table.resetRowSelection();
  }

  function clearFilters() {
    table.resetColumnFilters();
  }

  function changePageSize(size: number | null) {
    if (size === null) {
      return;
    }
    table.setPageSize(size);
  }

  return (
    <DeleteAccountContext.Provider value={deleteAccount}>
      <div className='flex w-full flex-col gap-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex flex-wrap items-center gap-3'>
            <NameFilter column={table.getColumn('name')} />
            <StatusFilter column={table.getColumn('status')} />
            <ColumnToggles columns={hideableColumns} />
          </div>
          <div className='flex items-center gap-3'>
            <AnimatePresence initial={false}>
              {hasSelection && (
                <motion.div
                  key='delete'
                  variants={presenceVariants}
                  initial='hidden'
                  animate='shown'
                  exit='hidden'
                >
                  <DeleteSelected
                    count={selectedCount}
                    onConfirm={deleteSelected}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <Button variant='outline'>
              <PlusIcon className='-ms-1 opacity-60' />
              Add user
            </Button>
          </div>
        </div>
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
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={rowStateOf(row.getIsSelected())}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn('last:py-0', alignClassOf(cell.column.id))}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {!hasRows && (
                <TableRow className='hover:bg-transparent'>
                  <TableCell
                    colSpan={visibleColumnCount}
                    className='h-24 text-center'
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span className='text-muted-foreground'>
                        No accounts match these filters.
                      </span>
                      <Button variant='link' size='sm' onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
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
    </DeleteAccountContext.Provider>
  );
}
