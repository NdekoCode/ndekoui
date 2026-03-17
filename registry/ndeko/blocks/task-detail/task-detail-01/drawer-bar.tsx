'use client';

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LinkIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { SheetClose } from '@/registry/ndeko/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { Swap } from './motion-parts';
import { useCopied } from './use-copied';

type DrawerBarProps = {
  position: number;
  total: number;
  link: string;
  onPrevious: () => void;
  onNext: () => void;
};

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Link copied';
  }
  return 'Copy link';
}

export function DrawerBar({
  position,
  total,
  link,
  onPrevious,
  onNext,
}: DrawerBarProps) {
  const { isCopied, copy } = useCopied();
  const isFirst = position <= 1;
  const isLast = position >= total;

  return (
    <div className='flex h-12 shrink-0 items-center gap-1 px-3'>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Previous task'
              disabled={isFirst}
              onClick={onPrevious}
            />
          }
        >
          <ChevronUpIcon />
        </TooltipTrigger>
        <TooltipContent>
          Previous task <Kbd>K</Kbd>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Next task'
              disabled={isLast}
              onClick={onNext}
            />
          }
        >
          <ChevronDownIcon />
        </TooltipTrigger>
        <TooltipContent>
          Next task <Kbd>J</Kbd>
        </TooltipContent>
      </Tooltip>
      <span className='text-muted-foreground ms-1 text-xs tabular-nums'>
        {position} of {total}
      </span>
      <div className='ms-auto flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={copyLabelOf(isCopied)}
          onClick={() => copy(link)}
        >
          <Swap swapKey={String(isCopied)}>
            {isCopied && <CheckIcon className='text-success-foreground' />}
            {!isCopied && <LinkIcon />}
          </Swap>
        </Button>
        <SheetClose
          render={<Button variant='ghost' size='icon-sm' aria-label='Close' />}
        >
          <XIcon />
        </SheetClose>
      </div>
    </div>
  );
}
