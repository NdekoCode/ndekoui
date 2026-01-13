import { cn } from '@/registry/ndeko/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

type Source = 'direct' | 'search' | 'referral';

type DayVisits = {
  day: string;
  date: string;
  visits: Record<Source, number>;
};

const SOURCES: { key: Source; label: string; colorClass: string }[] = [
  { key: 'direct', label: 'Direct', colorClass: 'bg-chart-1' },
  { key: 'search', label: 'Search', colorClass: 'bg-chart-2' },
  { key: 'referral', label: 'Referral', colorClass: 'bg-chart-3' },
];

const WEEK: DayVisits[] = [
  {
    day: 'Mon',
    date: 'Monday, Aug 12',
    visits: { direct: 380, search: 690, referral: 110 },
  },
  {
    day: 'Tue',
    date: 'Tuesday, Aug 13',
    visits: { direct: 412, search: 736, referral: 128 },
  },
  {
    day: 'Wed',
    date: 'Wednesday, Aug 14',
    visits: { direct: 356, search: 640, referral: 96 },
  },
  {
    day: 'Thu',
    date: 'Thursday, Aug 15',
    visits: { direct: 440, search: 802, referral: 150 },
  },
  {
    day: 'Fri',
    date: 'Friday, Aug 16',
    visits: { direct: 398, search: 710, referral: 134 },
  },
  {
    day: 'Sat',
    date: 'Saturday, Aug 17',
    visits: { direct: 210, search: 388, referral: 64 },
  },
  {
    day: 'Sun',
    date: 'Sunday, Aug 18',
    visits: { direct: 186, search: 342, referral: 58 },
  },
];

function totalOf(day: DayVisits) {
  const { direct, search, referral } = day.visits;
  return direct + search + referral;
}

const DAY_TOTALS = WEEK.map(totalOf);
const BUSIEST_DAY_TOTAL = Math.max(...DAY_TOTALS);

function percentOf(part: number, whole: number) {
  const ratio = part / whole;
  return `${ratio * 100}%`;
}

function formatVisits(count: number) {
  return count.toLocaleString('en-US');
}

function DayBar({ day }: { day: DayVisits }) {
  const total = totalOf(day);
  const barHeight = percentOf(total, BUSIEST_DAY_TOTAL);

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={0}
        aria-label={day.date}
        className='hover:bg-foreground/5 data-popup-open:bg-foreground/5 focus-visible:ring-ring focus-visible:ring-offset-background flex h-full w-9 flex-col items-center gap-1.5 rounded-md px-2 pt-2 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
      >
        <span className='flex w-full flex-1 items-end'>
          <span
            className='flex w-full flex-col-reverse overflow-hidden rounded-[3px]'
            style={{ height: barHeight }}
          >
            {SOURCES.map((source) => (
              <span
                key={source.key}
                className={source.colorClass}
                style={{ height: percentOf(day.visits[source.key], total) }}
              />
            ))}
          </span>
        </span>
        <span className='text-muted-foreground text-[11px]'>{day.day}</span>
      </PopoverTrigger>
      <PopoverContent side='top' className='flex w-48 flex-col gap-2 p-3'>
        <PopoverTitle className='text-[13px]'>{day.date}</PopoverTitle>
        <ul className='flex flex-col gap-1.5 text-xs'>
          {SOURCES.map((source) => (
            <li key={source.key} className='flex items-center gap-2'>
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  source.colorClass
                )}
                aria-hidden='true'
              />
              {source.label}
              <span className='ml-auto font-medium tabular-nums'>
                {formatVisits(day.visits[source.key])}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export default function Tooltip09() {
  return (
    <figure className='flex flex-col gap-2'>
      <figcaption className='text-muted-foreground text-xs'>
        Visits by source, week of Aug 12
      </figcaption>
      <div className='flex h-36 items-end gap-0.5'>
        {WEEK.map((day) => (
          <DayBar key={day.day} day={day} />
        ))}
      </div>
    </figure>
  );
}
