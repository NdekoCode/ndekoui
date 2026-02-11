import { Badge } from '@/registry/ndeko/ui/badge';
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
];

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function Table05() {
  return (
    <div className='w-full'>
      <Table>
        <TableHeader>
          <TableRow className='*:border-border [&>:not(:last-child)]:hairline-r hover:bg-transparent'>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ACCOUNTS.map((account) => (
            <TableRow
              key={account.id}
              className='*:border-border [&>:not(:last-child)]:hairline-r hover:bg-transparent'
            >
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
