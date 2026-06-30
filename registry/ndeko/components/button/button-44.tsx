'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { StarIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const BASE_STARS = 729;

export default function Button44() {
  const [isStarred, setIsStarred] = useState(false);
  const ownStar = Number(isStarred);
  const starCount = BASE_STARS + ownStar;

  function toggleStar() {
    setIsStarred((current) => !current);
  }

  return (
    <Button aria-pressed={isStarred} onClick={toggleStar}>
      <StarIcon className='-ms-1 opacity-60 transition-opacity duration-150 group-aria-pressed/button:opacity-100' />
      <span className='flex items-baseline gap-2'>
        Star
        <span className='text-primary-foreground/70 relative flex text-xs tabular-nums'>
          <span className='flex' aria-hidden='true'>
            <MotionNumber value={starCount} />
          </span>
          <span className='sr-only'>{starCount} stars</span>
        </span>
      </span>
    </Button>
  );
}
