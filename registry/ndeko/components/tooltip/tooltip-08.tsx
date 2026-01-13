import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/ndeko/ui/hover-card';

const LINK = cn(
  'inline-flex items-center gap-2 rounded-sm text-[13px] font-medium text-foreground underline-offset-4 hover:underline',
  FOCUS_RING
);

const STATS = [
  { label: 'Code coverage', value: '94.3%' },
  { label: 'Last deploy', value: 'Today at 15:42' },
  { label: 'Performance score', value: '98/100' },
];

export default function Tooltip08() {
  return (
    <HoverCard>
      <HoverCardTrigger href='#' className={LINK}>
        <span className='bg-success size-2 rounded-full' aria-hidden='true' />
        Production
        <span className='text-muted-foreground font-normal tabular-nums'>
          4f2a9c1
        </span>
      </HoverCardTrigger>
      <HoverCardContent className='w-56 p-3'>
        <dl className='grid gap-3 text-xs'>
          <div className='grid justify-items-start gap-1'>
            <dt className='text-muted-foreground'>Status</dt>
            <dd>
              <Chip color='var(--success)'>Completed</Chip>
            </dd>
          </div>
          {STATS.map((stat) => (
            <div key={stat.label} className='grid gap-0.5'>
              <dt className='text-muted-foreground'>{stat.label}</dt>
              <dd className='font-medium tabular-nums'>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </HoverCardContent>
    </HoverCard>
  );
}
