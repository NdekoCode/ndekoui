import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { TrendingDownIcon, TrendingUpIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';

import type { Customer, Result } from './testimonials-data';

function chipTextOf(result: Result) {
  return `${result.percent}% ${result.label}`;
}

function featuredToneOf(isFeatured: boolean) {
  if (isFeatured) {
    return 'ring-primary/50 bg-primary/[0.04] dark:bg-primary/[0.08]';
  }
  return 'ring-border bg-card hover:bg-foreground/[0.02] dark:bg-foreground/[0.04] dark:hover:bg-foreground/[0.06]';
}

type WallCardProps = {
  customer: Customer;
  isFeatured: boolean;
  isPressed: boolean;
  onFeature: (customerId: string) => void;
};

export function WallCard({
  customer,
  isFeatured,
  isPressed,
  onFeature,
}: WallCardProps) {
  const { person, result } = customer;
  const isUp = result.trend === 'up';

  return (
    <button
      type='button'
      aria-pressed={isFeatured}
      onClick={() => onFeature(customer.id)}
      className={cn(
        'hairline-ring focus-visible:ring-ring focus-visible:ring-offset-background flex h-full w-full cursor-pointer flex-col items-start gap-4 rounded-xl p-4 text-start shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[background-color,box-shadow,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]',
        featuredToneOf(isFeatured),
        pressedQuietOf(isPressed)
      )}
    >
      <span className='text-[13px] leading-5 text-pretty'>
        {customer.short}
      </span>
      <span className='flex w-full min-w-0 items-center gap-2'>
        <Avatar seed={person.name} className='size-6' />
        <span className='min-w-0 flex-1 truncate text-xs'>
          <span className='font-medium'>{person.name}</span>
          <span className='text-muted-foreground'>, {customer.company}</span>
        </span>
      </span>
      <Badge variant='success'>
        {isUp && <TrendingUpIcon />}
        {!isUp && <TrendingDownIcon />}
        <span className='tabular-nums'>{chipTextOf(result)}</span>
      </Badge>
    </button>
  );
}
