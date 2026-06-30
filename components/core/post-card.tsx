import { Fragment } from 'react';

import { cn } from '@/lib/utils';
import {
  BookmarkIcon,
  BadgeCheckIcon,
  HeartIcon,
  MessageCircleIcon,
  RepeatIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

export type PostAuthor = {
  name: string;
  handle: string;
  avatar?: string;
  verified?: boolean;
};

export type PostMedia = {
  src: string;
  alt: string;
};

export type PostCounts = {
  replies?: number;
  reposts?: number;
  likes?: number;
  bookmarks?: number;
  views?: number;
};

type StatName = 'replies' | 'reposts' | 'likes' | 'bookmarks';

type StatDefinition = {
  name: StatName;
  icon: Icon;
  singular: string;
  plural: string;
};

const STATS: StatDefinition[] = [
  {
    name: 'replies',
    icon: MessageCircleIcon,
    singular: 'reply',
    plural: 'replies',
  },
  {
    name: 'reposts',
    icon: RepeatIcon,
    singular: 'repost',
    plural: 'reposts',
  },
  { name: 'likes', icon: HeartIcon, singular: 'like', plural: 'likes' },
  {
    name: 'bookmarks',
    icon: BookmarkIcon,
    singular: 'bookmark',
    plural: 'bookmarks',
  },
];

const HIGHLIGHT_PATTERN = /(@\w+|#\w+|https?:\/\/\S+)/g;

const HIGHLIGHT_TEST = /^(@\w+|#\w+|https?:\/\/\S+)$/;

const MEDIA_LAYOUTS: Record<number, string[]> = {
  1: ['col-span-2 row-span-2'],
  2: ['row-span-2', 'row-span-2'],
  3: ['row-span-2', '', ''],
  4: ['', '', '', ''],
};

const MAX_MEDIA = 4;

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/);
  const letters = words.map((word) => word.charAt(0));
  const firstTwo = letters.slice(0, 2);
  return firstTwo.join('').toUpperCase();
}

function dateOf(value: Date | string) {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

function compactOf(count: number, locale: string) {
  const format = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  return format.format(count);
}

function spokenCountOf(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

function spokenViewsOf(views: number) {
  if (views === 1) {
    return 'view';
  }
  return 'views';
}

function timeOf(date: Date, locale: string, timeZone: string) {
  const format = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
  return format.format(date);
}

function dayOf(date: Date, locale: string, timeZone: string) {
  const format = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  });
  return format.format(date);
}

function PostText({ text }: { text: string }) {
  const parts = text.split(HIGHLIGHT_PATTERN);

  return (
    <p className='mt-3 text-sm leading-relaxed text-pretty whitespace-pre-line'>
      {parts.map((part, index) => {
        const isHighlight = HIGHLIGHT_TEST.test(part);
        if (isHighlight) {
          return (
            <span key={index} className='text-primary-ink'>
              {part}
            </span>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </p>
  );
}

function PostMediaGrid({ media }: { media: PostMedia[] }) {
  const shown = media.slice(0, MAX_MEDIA);
  const layout = MEDIA_LAYOUTS[shown.length];

  return (
    <div className='hairline-ring ring-border mt-3 grid aspect-video grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-lg'>
      {shown.map((item, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist
        <img
          key={item.src}
          src={item.src}
          alt={item.alt}
          loading='lazy'
          className={cn('bg-muted size-full object-cover', layout[index])}
        />
      ))}
    </div>
  );
}

function PostStat({
  stat,
  count,
  locale,
}: {
  stat: StatDefinition;
  count: number;
  locale: string;
}) {
  const StatIcon = stat.icon;

  return (
    <li className='text-muted-foreground flex items-center gap-1.5 text-[13px]'>
      <StatIcon className='size-4' />
      <span aria-hidden='true' className='tabular-nums'>
        {compactOf(count, locale)}
      </span>
      <span className='sr-only'>
        {spokenCountOf(count, stat.singular, stat.plural)}
      </span>
    </li>
  );
}

function hasCount(count: number | undefined): count is number {
  return count !== undefined;
}

export type PostCardProps = Omit<
  React.ComponentProps<'article'>,
  'children'
> & {
  author: PostAuthor;
  text: string;
  date: Date | string;
  media?: PostMedia[];
  counts?: PostCounts;
  href?: string;
  locale?: string;
  timeZone?: string;
};

export function PostCard({
  author,
  text,
  date,
  media = [],
  counts = {},
  href,
  locale = 'en-US',
  timeZone = 'UTC',
  className,
  ...props
}: PostCardProps) {
  const postedAt = dateOf(date);
  const time = timeOf(postedAt, locale, timeZone);
  const day = dayOf(postedAt, locale, timeZone);
  const hasMedia = media.length > 0;
  const views = counts.views;
  const hasViews = hasCount(views);
  const shownStats = STATS.filter((stat) => hasCount(counts[stat.name]));
  const timestamp = (
    <time dateTime={postedAt.toISOString()}>
      {time} · {day}
    </time>
  );

  return (
    <article
      className={cn(
        'bg-card text-card-foreground hairline-ring ring-border w-full max-w-lg rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
      {...props}
    >
      <header className='flex items-center gap-3'>
        <Avatar className='size-10 text-sm'>
          {author.avatar && <AvatarImage src={author.avatar} alt='' />}
          <AvatarFallback>{initialsOf(author.name)}</AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-col'>
          <span className='flex min-w-0 items-center gap-1'>
            <span className='truncate text-sm font-semibold'>
              {author.name}
            </span>
            {author.verified && (
              <>
                <BadgeCheckIcon className='text-primary-ink size-4 shrink-0' />
                <span className='sr-only'>Verified account</span>
              </>
            )}
          </span>
          <span className='text-muted-foreground truncate text-[13px]'>
            @{author.handle}
          </span>
        </div>
      </header>
      <PostText text={text} />
      {hasMedia && <PostMediaGrid media={media} />}
      <footer>
        <p className='text-muted-foreground mt-3 text-[13px]'>
          {href && (
            <a
              href={href}
              className='hover:text-foreground focus-visible:ring-ring/25 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3'
            >
              {timestamp}
            </a>
          )}
          {!href && timestamp}
          {hasViews && (
            <>
              {' · '}
              <span className='text-foreground font-medium tabular-nums'>
                {compactOf(views, locale)}
              </span>{' '}
              {spokenViewsOf(views)}
            </>
          )}
        </p>
        {shownStats.length > 0 && (
          <ul className='mt-3 flex items-center gap-6'>
            {shownStats.map((stat) => (
              <PostStat
                key={stat.name}
                stat={stat}
                count={counts[stat.name] ?? 0}
                locale={locale}
              />
            ))}
          </ul>
        )}
      </footer>
    </article>
  );
}
