import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
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

type Member = {
  id: string;
  name: string;
  initials: string;
  username: string;
  image: string;
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

const MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Jordan Hayes',
    initials: 'JH',
    username: '@jordanhayes',
    image: '/avatars/avatar-03.svg',
    email: 'jordan.hayes@example.com',
    location: 'Toronto, Canada',
    status: 'Active',
    balance: 1250,
  },
  {
    id: '2',
    name: 'Anna Novak',
    initials: 'AN',
    username: '@annanovak',
    image: '/avatars/avatar-04.svg',
    email: 'anna.novak@example.com',
    location: 'Prague, Czechia',
    status: 'Active',
    balance: 600,
  },
  {
    id: '3',
    name: 'Lina Haddad',
    initials: 'LH',
    username: '@linahaddad',
    image: '/avatars/avatar-05.svg',
    email: 'lina.haddad@example.com',
    location: 'Lyon, France',
    status: 'Active',
    balance: 0,
  },
  {
    id: '4',
    name: 'Ama Mensah',
    initials: 'AM',
    username: '@amamensah',
    image: '/avatars/avatar-06.svg',
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

export default function Table02() {
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
        <TableBody>
          {MEMBERS.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className='flex items-center gap-3'>
                  <Avatar className='size-9 text-[13px]'>
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col gap-0.5'>
                    <span className='font-medium'>{member.name}</span>
                    <span className='text-muted-foreground text-xs'>
                      {member.username}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {member.email}
              </TableCell>
              <TableCell>{member.location}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[member.status]}>
                  {member.status}
                </Badge>
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {CURRENCY.format(member.balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
