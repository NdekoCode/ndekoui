'use client';
import { RotateCw } from 'lucide-react';
import { cloneElement, useState } from 'react';

import { cn } from '@/lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
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
  const [reTriggerKey, setReTriggerKey] = useState<number>(Date.now());

  const componentName = filePath?.split('/').pop()?.split('.').shift();
  const registryUrl = `https://ui.ndeko.dev/e/${componentName}.json`;

  const reTrigger = () => {
    setReTriggerKey(Date.now());
  };

  return (
    <div
      className={cn(
        'group flex min-h-[350px] w-full items-center justify-center rounded-md',
        className
      )}
    >
      <div className='absolute right-4 top-3'>
        <div className='flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100'>
          <OpenInV0Button url={registryUrl} />
          {hasReTrigger && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='cursor-pointer'
                  onClick={reTrigger}
                  type='button'
                >
                  <RotateCw className='h-4 w-4 text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white' />
                </button>
              </TooltipTrigger>
              <TooltipContent>Re-trigger</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      {hasReTrigger
        ? cloneElement(component, { key: reTriggerKey })
        : component}
    </div>
  );
}
