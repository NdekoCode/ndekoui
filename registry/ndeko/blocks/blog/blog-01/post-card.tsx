import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Wash } from '@/registry/ndeko/ui/wash';

import { Cover } from './cover';
import { topicOf, type Post } from './data';

const LINK =
  'group flex h-full rounded-xl transition-[background-color,scale] duration-150 ease-(--ease-out-strong) active:scale-[0.97]';

function TopicLine({ post }: { post: Post }) {
  const topic = topicOf(post.topic);
  const color = seriesColorOf(topic.series);

  return (
    <p className='flex items-center gap-2 text-xs'>
      <Chip color={color}>{topic.label}</Chip>
      <span className='text-muted-foreground tabular-nums'>
        {post.minutes} min read
      </span>
    </p>
  );
}

function Byline({ post }: { post: Post }) {
  return (
    <p className='flex min-w-0 items-center gap-2 text-xs'>
      <Avatar seed={post.author} className='size-5' />
      <span className='truncate'>{post.author}</span>
      <span aria-hidden='true' className='text-muted-foreground'>
        ·
      </span>
      <time dateTime={post.isoDate} className='text-muted-foreground shrink-0'>
        {post.date}
      </time>
    </p>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className='h-full'>
      <a
        href={post.href}
        className={cn(
          LINK,
          'hover:bg-foreground/[0.03] flex-col gap-3 p-2',
          FOCUS_RING
        )}
      >
        <Cover topic={post.topic} seed={post.id} />
        <div className='flex flex-1 flex-col gap-2 px-1 pb-1'>
          <TopicLine post={post} />
          <h3 className='text-base font-semibold text-balance'>{post.title}</h3>
          <p className='text-muted-foreground line-clamp-3 text-[13px] text-pretty'>
            {post.excerpt}
          </p>
          <div className='mt-auto pt-1'>
            <Byline post={post} />
          </div>
        </div>
      </a>
    </article>
  );
}

export function FeaturedPost({ post }: { post: Post }) {
  return (
    <article className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] relative isolate rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <Wash />
      <a
        href={post.href}
        className={cn(
          LINK,
          'flex-col gap-4 p-2 active:scale-[0.99] @3xl:grid @3xl:grid-cols-[1.1fr_1fr] @3xl:gap-6',
          FOCUS_RING
        )}
      >
        <Cover topic={post.topic} seed={post.id} size='featured' />
        <div className='flex flex-col gap-3 px-2 pb-2 @3xl:py-6 @3xl:pe-6'>
          <p className='text-primary-ink text-xs font-medium'>Latest post</p>
          <TopicLine post={post} />
          <h2 className='text-xl font-semibold text-balance @3xl:text-2xl'>
            {post.title}
          </h2>
          <p className='text-muted-foreground text-sm text-pretty'>
            {post.excerpt}
          </p>
          <div className='mt-auto pt-2'>
            <Byline post={post} />
          </div>
        </div>
      </a>
    </article>
  );
}
