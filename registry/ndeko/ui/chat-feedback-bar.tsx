// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { useState } from 'react';

import { ThumbsUpIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

type FeedbackChoice = 'helpful' | 'not-helpful';

type FeedbackBarProps = {
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  /** Replaces the title once a choice is made. */
  thanks?: string;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onClose?: () => void;
};

function FeedbackBar({
  className,
  title = 'Was this reply helpful?',
  icon,
  thanks = 'Thanks for telling us',
  onHelpful,
  onNotHelpful,
  onClose,
}: FeedbackBarProps) {
  const [choice, setChoice] = useState<FeedbackChoice | null>(null);
  const hasChosen = choice !== null;
  const hasClose = onClose !== undefined;

  function chooseHelpful() {
    setChoice('helpful');
    onHelpful?.();
  }

  function chooseNotHelpful() {
    setChoice('not-helpful');
    onNotHelpful?.();
  }

  return (
    <div
      data-slot='feedback-bar'
      className={cn(
        'bg-card hairline-ring ring-border inline-flex items-center rounded-xl text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <AnimatedSize as='span' axis='width' contentClassName='flex items-center'>
        <span className='flex items-center gap-3 py-2.5 ps-4 pe-2'>
          {icon}
          <span
            aria-live='polite'
            className='text-foreground font-medium whitespace-nowrap'
          >
            <Swap swapKey={String(hasChosen)}>
              {hasChosen && thanks}
              {!hasChosen && title}
            </Swap>
          </span>
        </span>
        {!hasChosen && (
          <span className='flex items-center gap-0.5 pe-2'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label='Helpful'
              onClick={chooseHelpful}
              className='text-muted-foreground'
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label='Not helpful'
              onClick={chooseNotHelpful}
              className='text-muted-foreground'
            >
              <ThumbsUpIcon className='rotate-180' />
            </Button>
          </span>
        )}
      </AnimatedSize>
      {hasClose && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label='Close'
          onClick={onClose}
          className='text-muted-foreground me-1.5'
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

export { FeedbackBar, type FeedbackBarProps, type FeedbackChoice };
