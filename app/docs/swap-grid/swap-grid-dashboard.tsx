import { SwapGrid, type SwapGridItem } from '@/components/core/swap-grid';

type Metric = {
  id: string;
  label: string;
  value: string;
  change: string;
};

const METRICS: Metric[] = [
  {
    id: 'revenue',
    label: 'Revenue',
    value: '€48,210',
    change: '+6.2% this month',
  },
  {
    id: 'members',
    label: 'Active members',
    value: '1,284',
    change: '+38 this week',
  },
  {
    id: 'tickets',
    label: 'Open tickets',
    value: '27',
    change: '9 waiting on you',
  },
  { id: 'uptime', label: 'Uptime', value: '99.94%', change: 'Last 30 days' },
  {
    id: 'response',
    label: 'First response',
    value: '2 h 10 min',
    change: 'Median',
  },
  {
    id: 'renewals',
    label: 'Renewals due',
    value: '12',
    change: 'Before 1 December',
  },
];

function MetricTile({ metric }: { metric: Metric }) {
  return (
    <div className='flex h-full flex-col justify-between p-3'>
      <span className='text-muted-foreground text-xs'>{metric.label}</span>
      <span className='flex flex-col'>
        <span className='text-foreground text-lg font-semibold tabular-nums'>
          {metric.value}
        </span>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {metric.change}
        </span>
      </span>
    </div>
  );
}

const ITEMS: SwapGridItem[] = METRICS.map((metric) => ({
  id: metric.id,
  label: metric.label,
  content: <MetricTile metric={metric} />,
}));

export function SwapGridDashboard() {
  return (
    <div className='flex w-full max-w-xl flex-col gap-2'>
      <SwapGrid
        aria-label='Dashboard widgets'
        items={ITEMS}
        columns={3}
        className='auto-rows-[104px]'
      />
      <p className='text-muted-foreground text-xs'>Illustrative figures</p>
    </div>
  );
}
