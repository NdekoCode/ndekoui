'use client';

import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import type { TextFormat } from './page-text';

type CopyPageProps = {
  isCopied: boolean;
  onCopy: (format: TextFormat) => void;
  onOpenInNewTab: () => void;
};

export function CopyPage({ isCopied, onCopy, onOpenInNewTab }: CopyPageProps) {
  return (
    <div className='inline-flex shrink-0 items-center'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => onCopy('plain')}
        className='rounded-none rounded-s-full focus-visible:z-10'
      >
        <Swap swapKey={String(isCopied)}>
          {isCopied && <CheckIcon className='size-3.5' />}
          {!isCopied && <CopyIcon className='size-3.5' />}
        </Swap>
        Copy page
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type='button'
              variant='outline'
              size='sm'
              aria-label='Other ways to use this page'
              className='-ms-px rounded-none rounded-e-full px-2 focus-visible:z-10'
            />
          }
        >
          <ChevronDownIcon className='size-3.5' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-48'>
          <DropdownMenuItem onClick={() => onCopy('markdown')}>
            <FileTextIcon />
            Copy as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenInNewTab}>
            <ExternalLinkIcon />
            Open in a new tab
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
