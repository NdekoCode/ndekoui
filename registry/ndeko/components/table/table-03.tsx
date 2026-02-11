import { Badge } from '@/registry/ndeko/ui/badge';
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

function totalBalanceOf(accounts: Account[]) {
  let total = 0;
  for (const account of accounts) {
    total += account.balance;
  }
  return total;
}

export default function Table03() {
  const totalBalance = totalBalanceOf(ACCOUNTS);

  return (
    <div className='w-full'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <tbody aria-hidden='true' className='table-row h-2' />
        <TableBody className='[&_td:first-child]:rounded-s-lg [&_td:last-child]:rounded-e-lg'>
          {ACCOUNTS.map((account) => (
            <TableRow key={account.id} className='border-0'>
              <TableCell className='py-2.5 font-medium'>
                {account.name}
              </TableCell>
              <TableCell className='text-muted-foreground py-2.5'>
                {account.email}
              </TableCell>
              <TableCell className='py-2.5'>{account.location}</TableCell>
              <TableCell className='py-2.5'>
                <Badge variant={STATUS_VARIANTS[account.status]}>
                  {account.status}
                </Badge>
              </TableCell>
              <TableCell className='py-2.5 text-right tabular-nums'>
                {CURRENCY.format(account.balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <tbody aria-hidden='true' className='table-row h-2' />
        <TableFooter>
          <TableRow className='hover:bg-transparent'>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className='text-right tabular-nums'>
              {CURRENCY.format(totalBalance)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
