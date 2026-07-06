'use client';

import { RefreshCwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

type ReplayButtonProps = {
  onReplay: () => void;
};

/** Plays an animated example again from its first frame. */
export function ReplayButton({ onReplay }: ReplayButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            className='text-muted-foreground'
            aria-label='Replay the animation'
            onClick={onReplay}
          />
        }
      >
        <RefreshCwIcon />
      </TooltipTrigger>
      <TooltipContent>Replay</TooltipContent>
    </Tooltip>
  );
}
