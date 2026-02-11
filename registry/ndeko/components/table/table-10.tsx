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
];

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const SEPARATE_ROW_LINES = [
  'border-separate border-spacing-0',
  '[&_tr]:border-0 [&_th]:hairline-b [&_tr:not(:last-child)_td]:hairline-b [&_tfoot_td]:hairline-t',
  '[&_td]:border-border [&_th]:border-border',
].join(' ');

function totalBalanceOf(accounts: Account[]) {
  let total = 0;
  for (const account of accounts) {
    total += account.balance;
  }
  return total;
}

export default function Table10() {
  const totalBalance = totalBalanceOf(ACCOUNTS);

  return (
    <div className='w-full [&>div]:max-h-96'>
      <Table className={SEPARATE_ROW_LINES}>
        <TableHeader className='bg-card/90 sticky top-0 z-10 backdrop-blur-xs'>
          <TableRow className='hover:bg-transparent'>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ACCOUNTS.map((account) => (
            <TableRow key={account.id}>
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
