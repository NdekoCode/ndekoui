import { useId } from 'react';

import { StarIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const STAR_POSITIONS = [1, 2, 3, 4, 5];

const RATING_FILTERS = [
  { rating: 5, count: '5,168' },
  { rating: 4, count: '4,726' },
  { rating: 3, count: '3,234' },
  { rating: 2, count: '1,842' },
  { rating: 1, count: '452' },
];

const COUNT =
  'text-muted-foreground text-xs leading-[inherit] font-normal tabular-nums';

function starsLabelOf(rating: number) {
  if (rating === 1) {
    return '1 star';
  }
  return `${rating} stars`;
}

function starToneOf(position: number, rating: number) {
  if (position <= rating) {
    return 'text-warning';
  }
  return 'text-foreground/15';
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-hidden='true' className='inline-flex items-center'>
      {STAR_POSITIONS.map((position) => {
        const tone = starToneOf(position, rating);

        return (
          <StarIcon
            key={position}
            fill='currentColor'
            className={cn('size-4', tone)}
          />
        );
      })}
    </span>
  );
}

export default function Radio06() {
  const id = useId();
  const allId = `${id}-all`;

  return (
    <RadioGroup defaultValue='all' aria-label='Filter reviews'>
      <div className='flex items-center gap-2'>
        <RadioGroupItem value='all' id={allId} />
        <Label htmlFor={allId}>
          All reviews <span className={COUNT}>(12,921)</span>
        </Label>
      </div>
      {RATING_FILTERS.map((filter) => {
        const value = String(filter.rating);
        const itemId = `${id}-${value}`;

        return (
          <div key={value} className='flex items-center gap-2'>
            <RadioGroupItem value={value} id={itemId} />
            <Label htmlFor={itemId} className='gap-1'>
              <Stars rating={filter.rating} />
              <span className='sr-only'>{starsLabelOf(filter.rating)}</span>
              <span className={COUNT}>({filter.count})</span>
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
