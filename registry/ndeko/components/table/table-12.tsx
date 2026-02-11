'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Badge } from '@/registry/ndeko/ui/badge';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
];

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const FIGURE_COLUMNS = new Set(['balance']);

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

function alignClassOf(columnId: string) {
  if (FIGURE_COLUMNS.has(columnId)) {
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

function totalBalanceOf(accounts: Account[]) {
  let total = 0;
  for (const account of accounts) {
    total += account.balance;
  }
  return total;
}

export default function Table12() {
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 is required and cannot be memoized by the React Compiler.
  const table = useReactTable({
    data: ACCOUNTS,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  });
  const rows = table.getRowModel().rows;
  const totalBalance = totalBalanceOf(ACCOUNTS);
  const labelColumnSpan = COLUMNS.length - 1;

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
        </TableBody>
        <TableFooter>
          <TableRow className='hover:bg-transparent'>
            <TableCell colSpan={labelColumnSpan}>Total</TableCell>
            <TableCell className='text-right tabular-nums'>
              {CURRENCY.format(totalBalance)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
