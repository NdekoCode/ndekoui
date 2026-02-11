'use client';

import { useState } from 'react';

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

const ALL_IDS = ACCOUNTS.map((account) => account.id);

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function totalBalanceOf(accounts: Account[]) {
  let total = 0;
  for (const account of accounts) {
    total += account.balance;
  }
  return total;
}

function rowStateOf(isSelected: boolean) {
  if (isSelected) {
    return 'selected';
  }
  return undefined;
}

export default function Table07() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const totalBalance = totalBalanceOf(ACCOUNTS);
  const selectedCount = selectedIds.length;
  const isAllSelected = selectedCount === ACCOUNTS.length;
  const hasSelection = selectedCount > 0;
  const isPartlySelected = hasSelection && !isAllSelected;

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(ALL_IDS);
      return;
    }
    setSelectedIds([]);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const others = current.filter((selectedId) => selectedId !== id);
      if (checked) {
        return [...others, id];
      }
      return others;
    });
  }

  return (
    <div className='w-full'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead>
              <Checkbox
                checked={isAllSelected}
                indeterminate={isPartlySelected}
                onCheckedChange={toggleAll}
                aria-label='Select all rows'
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ACCOUNTS.map((account) => {
            const isSelected = selectedIds.includes(account.id);
            return (
              <TableRow key={account.id} data-state={rowStateOf(isSelected)}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      toggleOne(account.id, checked);
                    }}
                    aria-label={`Select ${account.name}`}
                  />
                </TableCell>
                <TableCell className='font-medium'>{account.name}</TableCell>
                <TableCell className='text-muted-foreground'>
                  {account.email}
                </TableCell>
                <TableCell>{account.location}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[account.status]}>
                    {account.status}
                  </Badge>
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {CURRENCY.format(account.balance)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow className='hover:bg-transparent'>
            <TableCell colSpan={5}>Total</TableCell>
            <TableCell className='text-right tabular-nums'>
              {CURRENCY.format(totalBalance)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
