'use client';

import { useState } from 'react';
import { Highlighter } from '@/components/core/highlighter';
import { WordRoll } from '@/components/core/word-roll';
import { Button } from '@/registry/ndeko/ui/button';

function buttonLabelOf(isShown: boolean) {
  if (isShown) {
    return 'Hide the edits';
  }
  return 'Show the edits';
}

export function HighlighterToggle() {
  const [isShown, setIsShown] = useState(false);

  return (
    <div className='flex max-w-sm flex-col items-start gap-5'>
      <p className='text-foreground text-base leading-relaxed'>
        The launch moves from{' '}
        <Highlighter action='strike' tone='destructive' show={isShown}>
          Thursday
        </Highlighter>{' '}
        to{' '}
        <Highlighter action='box' show={isShown} delay={0.3}>
          Friday at 10:00
        </Highlighter>
        , after the pricing review.
      </p>
      <Button
        variant='outline'
        size='sm'
        aria-pressed={isShown}
        onClick={() => setIsShown((current) => !current)}
      >
        <WordRoll text={buttonLabelOf(isShown)} />
      </Button>
    </div>
  );
}
