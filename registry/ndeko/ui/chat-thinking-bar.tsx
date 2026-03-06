// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { TextLoader } from '@/registry/ndeko/ui/chat-loader';

type ThinkingBarProps = {
  className?: string;
  text?: string;
  /** Lets the reader cut the thinking short and get the answer now. */
  onStop?: () => void;
  stopLabel?: string;
  /** Makes the label a button, for example to open the reasoning. */
  onClick?: () => void;
};

function ThinkingBar({
  className,
  text = 'Thinking',
  onStop,
  stopLabel = 'Answer now',
  onClick,
}: ThinkingBarProps) {
  const isClickable = onClick !== undefined;
  const isStoppable = onStop !== undefined;

  return (
    <div
      data-slot='thinking-bar'
      className={cn(
        'flex w-full items-center justify-between gap-3',
        className
      )}
    >
      {isClickable && (
        <button
          type='button'
          onClick={onClick}
          className='group/thinking focus-visible:ring-ring/25 -ms-1 inline-flex cursor-pointer items-center gap-0.5 rounded-md px-1 outline-none focus-visible:ring-[3px]'
        >
          <TextLoader text={text} />
          <ChevronRightIcon className='text-muted-foreground group-hover/thinking:text-foreground size-3.5 transition-colors' />
        </button>
      )}
      {!isClickable && <TextLoader text={text} />}
      {isStoppable && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onStop}
          className='text-muted-foreground'
        >
          {stopLabel}
        </Button>
      )}
    </div>
  );
}

export { ThinkingBar, type ThinkingBarProps };
