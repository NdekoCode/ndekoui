import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { NEWSROOM_ANCHOR, NEWSROOM_SECTION, STORIES, type Story } from './data';
import { Reveal } from './reveal';

function StoryRow({ story }: { story: Story }) {
  return (
    <li className='hairline-b border-border last:border-b-0'>
      <a
        href='#'
        className='group/story focus-visible:ring-ring/25 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 rounded-md py-5 outline-none focus-visible:ring-[3px] @2xl:grid-cols-[4rem_minmax(0,1fr)_auto]'
      >
        <span className='text-muted-foreground order-2 text-xs tabular-nums @2xl:order-none'>
          {story.age}
        </span>
        <span className='group-hover/story:text-primary-ink col-span-2 text-lg font-medium text-balance transition-colors duration-200 @2xl:col-span-1 @2xl:text-2xl'>
          {story.headline}
        </span>
        <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          {story.desk}, {story.place}
          <ArrowUpRightIcon className='size-3.5 transition-transform duration-200 group-hover/story:translate-x-0.5 group-hover/story:-translate-y-0.5' />
        </span>
      </a>
    </li>
  );
}

export function Newsroom() {
  return (
    <section
      id={NEWSROOM_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-10'
      >
        <SettleItem className='flex flex-wrap items-end justify-between gap-4'>
          <div className='flex max-w-2xl flex-col gap-3'>
            <h2 className='text-3xl font-semibold text-balance @2xl:text-4xl'>
              {NEWSROOM_SECTION.title}
            </h2>
            <p className='text-muted-foreground text-base text-pretty'>
              {NEWSROOM_SECTION.description}
            </p>
          </div>
          <Button
            variant='outline'
            nativeButton={false}
            render={<a href='#' />}
          >
            {NEWSROOM_SECTION.action}
          </Button>
        </SettleItem>
        <SettleItem>
          <ul className='border-border hairline-t'>
            {STORIES.map((story) => (
              <StoryRow key={story.id} story={story} />
            ))}
          </ul>
        </SettleItem>
      </Reveal>
    </section>
  );
}
