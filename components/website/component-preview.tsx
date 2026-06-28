'use client';
import { Fragment, useState } from 'react';

import { cn } from '@/lib/utils';
import { RefreshCwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { OpenInV0Button } from './open-in-v0';

type ComponentPreviewProps = {
  component: React.ReactElement;
  hasReTrigger?: boolean;
  className?: string;
  filePath?: string;
};

export default function ComponentPreview({
  component,
  hasReTrigger = false,
  className,
  filePath,
}: ComponentPreviewProps) {
  const [replayCount, setReplayCount] = useState(0);

  const componentName = filePath?.split('/').pop()?.split('.').shift();
  const registryUrl = `https://ui.ndekocode.dev/e/${componentName}.json`;

  const replay = () => {
    setReplayCount((count) => count + 1);
  };

  return (
    <div
      className={cn(
        'group flex min-h-[350px] w-full items-center justify-center rounded-xl',
        className
      )}
    >
      <div className='absolute top-3 right-3 z-10'>
        <div className='flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'>
          <OpenInV0Button url={registryUrl} />
          {hasReTrigger && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='text-muted-foreground'
                    aria-label='Replay the animation'
                    onClick={replay}
                  />
                }
              >
                <RefreshCwIcon />
              </TooltipTrigger>
              <TooltipContent>Replay</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <Fragment key={replayCount}>{component}</Fragment>
    </div>
  );
}
