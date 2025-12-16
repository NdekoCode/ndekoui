'use client';

import { useState } from 'react';

import { BookmarkIcon } from '@/registry/ndeko/lib/icons';
import { Toggle } from '@/registry/ndeko/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

function bookmarkHintOf(isBookmarked: boolean) {
  if (isBookmarked) {
    return 'Remove bookmark';
  }
  return 'Bookmark this';
}

export default function Button24() {
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            aria-label='Bookmark this'
            pressed={isBookmarked}
            onPressedChange={setIsBookmarked}
            className='hover:bg-primary/10 hover:text-primary-ink data-pressed:bg-primary/10 data-pressed:text-primary-ink size-8 px-0'
          />
        }
      >
        <BookmarkIcon />
      </TooltipTrigger>
      <TooltipContent>{bookmarkHintOf(isBookmarked)}</TooltipContent>
    </Tooltip>
  );
}
