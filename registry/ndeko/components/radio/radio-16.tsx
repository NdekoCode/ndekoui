'use client';

import { useId, useState } from 'react';

import { StarIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const STARS = [1, 2, 3, 4, 5];

const STAR =
  'size-6 transition-[color,scale] duration-150 group-hover:scale-110';

const STAR_OPTION =
  'group relative cursor-pointer rounded-md p-0.5 outline-none has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25';

function starsLabelOf(stars: number) {
  if (stars === 1) {
    return '1 star';
  }
  return `${stars} stars`;
}

function shownRatingOf(hoverRating: number, rating: number) {
  if (hoverRating > 0) {
    return hoverRating;
  }
  return rating;
}

function starToneOf(star: number, shownRating: number) {
  if (star <= shownRating) {
    return 'text-warning';
  }
  return 'text-foreground/15';
}

export default function Radio16() {
  const captionId = useId();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const shownRating = shownRatingOf(hoverRating, rating);

  function clearHoverRating() {
    setHoverRating(0);
  }

  return (
    <div className='flex flex-col gap-3'>
      <span
        id={captionId}
        className='text-foreground text-[13px] leading-none font-medium'
      >
        Rate your experience
      </span>
      <RadioGroup
        aria-labelledby={captionId}
        onValueChange={setRating}
        onMouseLeave={clearHoverRating}
        className='inline-flex gap-0'
      >
        {STARS.map((star) => {
          const tone = starToneOf(star, shownRating);

          return (
            <label
              key={star}
              className={STAR_OPTION}
              onMouseEnter={() => setHoverRating(star)}
            >
              <RadioGroupItem value={star} className='sr-only' />
              <StarIcon fill='currentColor' className={cn(STAR, tone)} />
              <span className='sr-only'>{starsLabelOf(star)}</span>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
