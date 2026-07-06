'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  LinkedinBrandIcon,
  LinkIcon,
  MailIcon,
  Share2Icon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { POST } from './data';

function encoded(text: string) {
  return encodeURIComponent(text);
}

function openInNewTab(address: string) {
  window.open(address, '_blank', 'noopener,noreferrer');
}

function shareByEmail() {
  const subject = encoded(POST.title);
  const body = encoded(POST.link);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function shareOnLinkedIn() {
  const link = encoded(POST.link);
  openInNewTab(`https://www.linkedin.com/sharing/share-offsite/?url=${link}`);
}

function shareOnX() {
  const link = encoded(POST.link);
  const text = encoded(POST.title);
  openInNewTab(`https://x.com/intent/post?url=${link}&text=${text}`);
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Link copied';
  }
  return 'Copy link';
}

type PostActionsProps = {
  isLinkCopied: boolean;
  isCopyPressed: boolean;
  onCopy: () => void;
};

export function PostActions({
  isLinkCopied,
  isCopyPressed,
  onCopy,
}: PostActionsProps) {
  return (
    <div className='flex items-center gap-2'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={onCopy}
        className={cn('w-[6.5rem]', pressedQuietOf(isCopyPressed))}
      >
        <Swap swapKey={String(isLinkCopied)}>
          {isLinkCopied && <CheckIcon className='size-3.5' />}
          {!isLinkCopied && <LinkIcon className='size-3.5' />}
        </Swap>
        <Swap swapKey={copyLabelOf(isLinkCopied)}>
          {copyLabelOf(isLinkCopied)}
        </Swap>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type='button' variant='outline' size='sm' />}
        >
          <Share2Icon className='size-3.5' />
          Share
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-44'>
          <DropdownMenuItem onClick={shareByEmail}>
            <MailIcon />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareOnLinkedIn}>
            <LinkedinBrandIcon />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareOnX}>
            <TwitterXIcon />X
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
