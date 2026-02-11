import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

type Service = {
  id: string;
  name: string;
  region: string;
  owner: string;
  runtime: string;
  plan: string;
  instances: number;
  uptime: string;
  latency: string;
};

const SERVICES: Service[] = [
  {
    id: '1',
    name: 'api-gateway',
    region: 'eu-west-1',
    owner: 'Anna Novak',
    runtime: 'Node 22',
    plan: 'Pro',
    instances: 4,
    uptime: '99.98%',
    latency: '182 ms',
  },
  {
    id: '2',
    name: 'billing-worker',
    region: 'us-east-1',
    owner: 'Jordan Hayes',
    runtime: 'Go 1.24',
    plan: 'Pro',
    instances: 2,
    uptime: '99.95%',
    latency: '96 ms',
  },
  {
    id: '3',
    name: 'search-index',
    region: 'eu-central-1',
    owner: 'Kenji Watanabe',
    runtime: 'Rust 1.86',
    plan: 'Scale',
    instances: 6,
    uptime: '99.99%',
    latency: '41 ms',
  },
  {
    id: '4',
    name: 'media-resizer',
    region: 'ap-south-1',
    owner: 'Lina Haddad',
    runtime: 'Python 3.13',
    plan: 'Starter',
    instances: 1,
    uptime: '99.71%',
    latency: '310 ms',
  },
  {
    id: '5',
    name: 'notifications',
    region: 'us-west-2',
    owner: 'Ama Mensah',
    runtime: 'Node 22',
    plan: 'Pro',
    instances: 3,
    uptime: '99.93%',
    latency: '128 ms',
  },
];

const DENSE_HEAD = 'h-9 py-2';
const DENSE_CELL = 'py-2';
const DENSE_FIGURE = 'py-2 text-right tabular-nums';

export default function Table06() {
  return (
    <div className='bg-card hairline-ring ring-border w-full overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead className={DENSE_HEAD}>Service</TableHead>
            <TableHead className={DENSE_HEAD}>Region</TableHead>
            <TableHead className={DENSE_HEAD}>Owner</TableHead>
            <TableHead className={DENSE_HEAD}>Runtime</TableHead>
            <TableHead className={DENSE_HEAD}>Plan</TableHead>
            <TableHead className={`${DENSE_HEAD} text-right`}>
              Instances
            </TableHead>
            <TableHead className={`${DENSE_HEAD} text-right`}>Uptime</TableHead>
            <TableHead className={`${DENSE_HEAD} text-right`}>
              p95 latency
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SERVICES.map((service) => (
            <TableRow key={service.id}>
              <TableCell className={`${DENSE_CELL} font-medium`}>
                {service.name}
              </TableCell>
              <TableCell className={`${DENSE_CELL} text-muted-foreground`}>
                {service.region}
              </TableCell>
              <TableCell className={DENSE_CELL}>{service.owner}</TableCell>
              <TableCell className={DENSE_CELL}>{service.runtime}</TableCell>
              <TableCell className={DENSE_CELL}>{service.plan}</TableCell>
              <TableCell className={DENSE_FIGURE}>
                {service.instances}
              </TableCell>
              <TableCell className={DENSE_FIGURE}>{service.uptime}</TableCell>
              <TableCell className={DENSE_FIGURE}>{service.latency}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
