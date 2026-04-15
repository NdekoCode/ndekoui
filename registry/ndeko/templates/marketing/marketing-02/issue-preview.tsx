import { ClockIcon } from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Chip } from '@/registry/ndeko/ui/chip';

import { ISSUE } from './data';

function initialsOf(name: string) {
  const words = name.split(' ');
  const letters = words.map((word) => word.charAt(0));
  return letters.join('');
}

export function IssuePreview() {
  return (
    <div
      aria-hidden='true'
      className='bg-foreground/[0.025] rounded-2xl p-6 sm:p-8'
    >
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] motion-safe:animate-float flex flex-col gap-4 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.14)]'>
        <div className='flex items-center gap-2.5'>
          <Avatar className='size-7'>
            <AvatarImage src={ISSUE.author.image} alt={ISSUE.author.name} />
            <AvatarFallback>{initialsOf(ISSUE.author.name)}</AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-col'>
            <p className='truncate text-[13px] font-medium'>
              {ISSUE.publication}
            </p>
            <p className='text-muted-foreground text-xs'>{ISSUE.number}</p>
          </div>
        </div>
        <div className='flex flex-col gap-1.5'>
          <p className='text-sm font-medium text-balance'>{ISSUE.subject}</p>
          <p className='text-muted-foreground text-[13px] leading-relaxed'>
            {ISSUE.excerpt}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Chip color='var(--info)'>{ISSUE.status}</Chip>
          <span className='text-muted-foreground inline-flex items-center gap-1 text-xs tabular-nums'>
            <ClockIcon className='size-3.5' />
            {ISSUE.sendsAt}
          </span>
        </div>
      </div>
    </div>
  );
}
