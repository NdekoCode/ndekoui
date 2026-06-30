'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { ThumbsUpIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const BASE_LIKES = 86;

export default function Button43() {
  const [isLiked, setIsLiked] = useState(false);
  const ownLike = Number(isLiked);
  const likeCount = BASE_LIKES + ownLike;

  function toggleLike() {
    setIsLiked((current) => !current);
  }

  return (
    <Button
      variant='outline'
      className='py-0 pe-0'
      aria-pressed={isLiked}
      onClick={toggleLike}
    >
      <ThumbsUpIcon className='group-aria-pressed/button:text-primary-ink opacity-60 transition-[opacity,color] duration-150 group-aria-pressed/button:opacity-100' />
      Like
      <span className='hairline-l border-foreground/12 text-muted-foreground dark:border-foreground/15 ms-1 inline-flex h-full items-center px-3 text-xs font-medium tabular-nums'>
        <span className='flex' aria-hidden='true'>
          <MotionNumber value={likeCount} />
        </span>
        <span className='sr-only'>{likeCount} likes</span>
      </span>
    </Button>
  );
}
