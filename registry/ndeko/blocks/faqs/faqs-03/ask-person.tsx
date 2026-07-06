'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

import { PERSON } from './data';

type AskPersonProps = {
  query: string;
  topicLabel: string;
  isInOtherTopics: boolean;
  isClearPressed: boolean;
  onClear: () => void;
  onAllTopics: () => void;
};

export function AskPerson({
  query,
  topicLabel,
  isInOtherTopics,
  isClearPressed,
  onClear,
  onAllTopics,
}: AskPersonProps) {
  const title = `Nothing matches “${query}”`;
  const titleInTopic = `Nothing in ${topicLabel} matches “${query}”`;
  let heading = title;
  if (isInOtherTopics) {
    heading = titleInTopic;
  }

  return (
    <div className='bg-foreground/[0.04] flex flex-col gap-4 rounded-xl p-4 @md:flex-row @md:items-center @md:p-5'>
      <Avatar seed={PERSON.name} className='size-10' />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <p className='text-sm font-medium break-words'>{heading}</p>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {PERSON.name}, {PERSON.role}, answers by email within a day.
        </p>
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button nativeButton={false} render={<a href={PERSON.href} />}>
          Ask {PERSON.firstName}
        </Button>
        {isInOtherTopics && (
          <Button variant='outline' onClick={onAllTopics}>
            Search all topics
          </Button>
        )}
        <Button
          variant='ghost'
          onClick={onClear}
          className={cn(pressedQuietOf(isClearPressed))}
        >
          Clear search
        </Button>
      </div>
    </div>
  );
}
