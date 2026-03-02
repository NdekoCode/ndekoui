'use client';
import { cn } from '@/lib/utils';
import { cloneElement, useState } from 'react';
import { RefreshCwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export function CardExampleLanding({
  children,
  className,
  hasReTrigger,
}: {
  children: React.ReactElement;
  className?: string;
  hasReTrigger?: boolean;
}) {
  const [replayCount, setReplayCount] = useState(0);

  const replay = () => {
    setReplayCount((count) => count + 1);
  };

  return (
    <div className='relative -mx-6 sm:mx-0'>
      <div
        className={cn(
          'bg-card hairline-ring ring-border relative w-full overflow-hidden rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
          className
        )}
      >
        {hasReTrigger && (
          <Button
            variant='ghost'
            size='icon-sm'
            className='text-muted-foreground absolute top-3 right-4'
            aria-label='Replay the animation'
            onClick={replay}
          >
            <RefreshCwIcon />
          </Button>
        )}
        <div className='flex h-[350px] items-center justify-center'>
          {hasReTrigger && cloneElement(children, { key: replayCount })}
          {!hasReTrigger && children}
        </div>
      </div>
    </div>
  );
}
