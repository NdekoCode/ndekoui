import { MagicCard } from '@/components/core/magic-card';
import { DatabaseIcon, UsersIcon, type Icon } from '@/registry/ndeko/lib/icons';

type Usage = {
  title: string;
  used: string;
  limit: string;
  share: number;
  icon: Icon;
};

const USAGE: Usage[] = [
  {
    title: 'Storage',
    used: '38.2 GB',
    limit: 'of 100 GB',
    share: 0.38,
    icon: DatabaseIcon,
  },
  {
    title: 'Seats',
    used: '14',
    limit: 'of 20 seats',
    share: 0.7,
    icon: UsersIcon,
  },
];

export function MagicCardUsage() {
  return (
    <div className='grid w-full max-w-xl gap-4 p-6 sm:grid-cols-2'>
      {USAGE.map((item) => {
        const UsageIcon = item.icon;
        const percent = Math.round(item.share * 100);

        return (
          <MagicCard key={item.title} className='p-4'>
            <div className='flex items-center gap-2'>
              <UsageIcon className='text-muted-foreground size-4' />
              <h3 className='text-sm font-medium'>{item.title}</h3>
            </div>
            <p className='mt-3 text-2xl font-semibold tabular-nums'>
              {item.used}
            </p>
            <p className='text-muted-foreground text-xs'>{item.limit}</p>
            <div
              role='progressbar'
              aria-label={`${item.title} used`}
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className='bg-foreground/[0.06] mt-4 h-1.5 overflow-hidden rounded-full'
            >
              <div
                className='bg-primary h-full rounded-full'
                style={{ width: `${percent}%` }}
              />
            </div>
          </MagicCard>
        );
      })}
      <p className='text-muted-foreground text-xs sm:col-span-2'>
        Illustrative figures
      </p>
    </div>
  );
}
