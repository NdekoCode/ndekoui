import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import { segmentsOf, type CommentItem } from './comment-model';
import { actorNameOf, personOf, type Person } from './people';
import { relativeTimeOf } from './time';

export const MENTION_CHIP =
  'rounded-[4px] bg-primary/10 px-0.5 font-medium text-primary-ink dark:bg-primary/20';

export const TEXT_ACTION =
  'text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 inline-flex h-6 cursor-pointer items-center gap-1 rounded-md text-xs font-medium transition-colors outline-none focus-visible:ring-[3px]';

export function PersonAvatar({
  person,
  className,
}: {
  person: Person;
  className?: string;
}) {
  return (
    <Avatar className={cn('size-7 text-[10px]', className)}>
      {person.avatar && <AvatarImage src={person.avatar} alt='' />}
      <AvatarFallback>{person.initials}</AvatarFallback>
    </Avatar>
  );
}

/** A comment's words, with each mention of a known person drawn as a tinted chip. */
export function CommentText({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
  const segments = segmentsOf(body);
  return (
    <p
      className={cn(
        'text-[13px] leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap',
        className
      )}
    >
      {segments.map((segment, index) => {
        const key = `${index}-${segment.text}`;
        if (segment.isMention) {
          return (
            <span key={key} className={MENTION_CHIP}>
              {segment.text}
            </span>
          );
        }
        return <span key={key}>{segment.text}</span>;
      })}
    </p>
  );
}

export function CommentMeta({
  comment,
  children,
}: {
  comment: CommentItem;
  children?: React.ReactNode;
}) {
  return (
    <p className='flex min-w-0 items-baseline gap-1.5 text-[13px]'>
      <span className='truncate font-medium'>
        {actorNameOf(comment.authorId)}
      </span>
      <span aria-hidden='true' className='text-muted-foreground'>
        ·
      </span>
      <time
        dateTime={comment.at}
        className='text-muted-foreground shrink-0 text-xs tabular-nums'
      >
        {relativeTimeOf(comment.at)}
      </time>
      {children}
    </p>
  );
}

type CommentBlockProps = {
  comment: CommentItem;
  avatarClassName?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

/** Avatar, author and time, then the words aligned under the name. */
export function CommentBlock({
  comment,
  avatarClassName,
  meta,
  actions,
  children,
  className,
}: CommentBlockProps) {
  return (
    <div className={cn('flex gap-3', className)}>
      <PersonAvatar
        person={personOf(comment.authorId)}
        className={avatarClassName}
      />
      <div className='min-w-0 flex-1'>
        <div className='flex min-h-7 items-center justify-between gap-2'>
          <CommentMeta comment={comment}>{meta}</CommentMeta>
          {actions}
        </div>
        {children}
        {!children && <CommentText body={comment.body} />}
      </div>
    </div>
  );
}
