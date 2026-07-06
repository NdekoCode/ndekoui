import { cn } from '@/registry/ndeko/lib/utils';

import { isNearLimit, LIMITS, shareOf, type Limit } from './data';

function meterToneOf(isNear: boolean) {
  if (isNear) {
    return 'bg-warning';
  }
  return 'bg-primary';
}

function figureToneOf(isNear: boolean) {
  if (isNear) {
    return 'text-warning-foreground';
  }
  return 'text-muted-foreground';
}

function figureTextOf(limit: Limit) {
  return `${limit.used} of ${limit.max}${limit.unit}`;
}

function LimitRow({ limit }: { limit: Limit }) {
  const share = shareOf(limit.used, limit.max);
  const isNear = isNearLimit(share);
  const open = 1 - share;
  const remaining = open * 100;
  const fillStyle = { transform: `translateX(-${remaining}%)` };

  return (
    <li className='flex flex-col gap-1.5'>
      <div className='flex items-baseline justify-between gap-3 text-[13px]'>
        <span className='min-w-0 truncate'>{limit.label}</span>
        <span className={cn('text-xs tabular-nums', figureToneOf(isNear))}>
          {figureTextOf(limit)}
          {isNear && <span className='sr-only'>, near the limit</span>}
        </span>
      </div>
      <div
        role='meter'
        aria-label={limit.label}
        aria-valuemin={0}
        aria-valuemax={limit.max}
        aria-valuenow={limit.used}
        className='bg-foreground/[0.06] h-1.5 overflow-hidden rounded-full'
      >
        <span
          style={fillStyle}
          className={cn('block h-full rounded-full', meterToneOf(isNear))}
        />
      </div>
    </li>
  );
}

export function LimitRows() {
  return (
    <ul className='flex flex-col gap-4'>
      {LIMITS.map((limit) => (
        <LimitRow key={limit.id} limit={limit} />
      ))}
    </ul>
  );
}
