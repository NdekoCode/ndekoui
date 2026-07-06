'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';

import { WordRoll } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { SearchIcon } from '@/registry/ndeko/lib/icons';
import {
  EASE_OUT_STRONG,
  INSTANT,
  rowPresenceOf,
  SLOW_SPRING,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { Input } from '@/registry/ndeko/ui/input';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { BLOG, TOPICS } from './data';
import { FeaturedPost, PostCard } from './post-card';
import {
  countOfTopic,
  FEATURED,
  INITIAL,
  isBrowsing,
  LOOP_AFTER_MS,
  postsIn,
  reducer,
  RESTING,
  SCRIPT,
  type TopicFilter,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const FILTERS: { id: TopicFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...TOPICS,
];

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

const ARRIVED = { opacity: 1, y: 0 };

const ARRIVING = { opacity: 0, y: 8 };

const FADED = { opacity: 0, y: 0 };

const ARRIVE: Transition = { duration: 0.25, ease: EASE_OUT_STRONG };

const LEAVE: Transition = { duration: 0.12, ease: EASE_OUT_STRONG };

function arrivingOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADED;
  }
  return ARRIVING;
}

function glideOf(shouldReduceMotion: boolean): Transition {
  if (shouldReduceMotion) {
    return { ...ARRIVE, layout: INSTANT };
  }
  return { ...ARRIVE, layout: SLOW_SPRING };
}

function filterOf(values: unknown[]) {
  const [value] = values;
  const filter = FILTERS.find((candidate) => candidate.id === value);
  return filter?.id;
}

function shownLineOf(shown: number, total: number) {
  if (total === 1) {
    return 'Showing the only post';
  }
  return `Showing ${shown} of ${total} posts`;
}

function emptyLineOf(query: string, topic: TopicFilter) {
  const trimmed = query.trim();
  const filter = FILTERS.find((candidate) => candidate.id === topic);
  const topicLabel = filter?.label ?? 'this topic';
  const hasTopic = topic !== 'all';
  if (trimmed === '') {
    return `Nothing in ${topicLabel} yet`;
  }
  if (hasTopic) {
    return `No ${topicLabel} post mentions “${trimmed}”`;
  }
  return `No post mentions “${trimmed}”`;
}

export default function Blog01() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const posts = postsIn(state);
  const shownPosts = posts.slice(0, state.visible);
  const shownCount = shownPosts.length;
  const hasMore = posts.length > shownCount;
  const isEmpty = posts.length === 0;
  const showsFeatured = isBrowsing(state);
  const layoutKey = shownPosts.map((post) => post.id).join(' ');
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;
  useKeptHeight(ref);

  function pickTopic(values: unknown[]) {
    const topic = filterOf(values);
    if (topic) {
      act({ type: 'topicPicked', topic });
    }
  }

  /** The button leaves with the empty state, so the focus goes to the search it emptied. */
  function showAll() {
    act({ type: 'cleared' });
    requestAnimationFrame(() => {
      const search = ref.current?.querySelector<HTMLElement>('[data-search]');
      search?.focus();
    });
  }

  /** The first card that arrives takes the focus, so the keyboard carries on where the reading does. */
  function loadMore() {
    const firstNew = posts[shownCount];
    act({ type: 'loadedMore' });
    if (!firstNew) {
      return;
    }
    requestAnimationFrame(() => {
      const selector = `[data-post="${firstNew.id}"] a`;
      const link = ref.current?.querySelector<HTMLElement>(selector);
      link?.focus();
    });
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-6xl flex-col px-4 py-8 @2xl:px-8 @2xl:py-12'>
          <header className='flex flex-col gap-4 pb-8'>
            <div className='flex min-h-7 items-center gap-2 text-[13px]'>
              <CompanyMark seed={BLOG.company} />
              <span className='font-medium'>{BLOG.company}</span>
              <span className='text-muted-foreground'>/ Blog</span>
              <span className='flex-1' />
              <ReplayButton
                isShown={canReplay}
                onReplay={restart}
                label='Replay'
              />
            </div>
            <div className='flex flex-col gap-2'>
              <h1 className='text-2xl font-semibold text-balance @sm:text-3xl'>
                {BLOG.name}
              </h1>
              <p className='text-muted-foreground max-w-xl text-sm text-pretty'>
                {BLOG.lead}
              </p>
            </div>
          </header>

          <AnimatePresence initial={false}>
            {showsFeatured && (
              <motion.div
                key='featured'
                className='-mx-1 -mt-1 overflow-hidden px-1 pt-1'
                {...rowPresenceOf(shouldReduceMotion)}
              >
                <div className='pb-8'>
                  <FeaturedPost post={FEATURED} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='flex flex-col gap-8'>
            <div className='flex flex-col gap-3 @2xl:flex-row @2xl:items-center'>
              <ToggleGroup
                aria-label='Topics'
                value={[state.topic]}
                onValueChange={pickTopic}
                travel
                indicatorClassName={THUMB}
                className='bg-foreground/[0.04] flex-wrap rounded-xl p-1'
              >
                {FILTERS.map((filter) => (
                  <ToggleGroupItem
                    key={filter.id}
                    value={filter.id}
                    className={cn(
                      'h-7 gap-1.5 rounded-lg px-2.5 text-xs',
                      pressedQuietOf(pressed === `topic-${filter.id}`)
                    )}
                  >
                    {filter.label}
                    <span className='text-muted-foreground tabular-nums'>
                      {countOfTopic(filter.id)}
                    </span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className='relative w-full @2xl:ms-auto @2xl:w-60'>
                <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
                <Input
                  type='search'
                  data-search
                  aria-label='Search posts'
                  placeholder='Search posts'
                  autoComplete='off'
                  value={state.query}
                  onChange={(event) =>
                    act({ type: 'searched', query: event.target.value })
                  }
                  className='ps-8'
                />
              </div>
            </div>

            {isEmpty && (
              <div className='bg-foreground/[0.025] flex flex-col items-center gap-3 rounded-2xl px-6 py-14 text-center transition-opacity duration-200 starting:opacity-0'>
                <span className='keycap-3d flex size-10 items-center justify-center rounded-xl'>
                  <SearchIcon className='text-muted-foreground size-5' />
                </span>
                <p className='text-sm font-medium text-balance'>
                  {emptyLineOf(state.query, state.topic)}
                </p>
                <p className='text-muted-foreground max-w-sm text-[13px] text-pretty'>
                  Try a shorter word, or look through every topic.
                </p>
                <Button type='button' variant='outline' onClick={showAll}>
                  Show all posts
                </Button>
              </div>
            )}

            {!isEmpty && (
              <ul className='relative grid gap-x-3 gap-y-5 @lg:grid-cols-2 @3xl:grid-cols-3'>
                <AnimatePresence mode='popLayout' initial={false}>
                  {shownPosts.map((post) => (
                    <motion.li
                      key={post.id}
                      data-post={post.id}
                      layout
                      layoutDependency={layoutKey}
                      initial={arrivingOf(shouldReduceMotion)}
                      animate={ARRIVED}
                      exit={{ opacity: 0, transition: LEAVE }}
                      transition={glideOf(shouldReduceMotion)}
                    >
                      <PostCard post={post} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {!isEmpty && (
              <div className='flex flex-col items-center gap-3'>
                <p className='text-muted-foreground text-xs tabular-nums'>
                  <WordRoll
                    text={shownLineOf(shownCount, posts.length)}
                    value={shownCount}
                  />
                </p>
                {hasMore && (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={loadMore}
                    className={pressedQuietOf(pressed === 'load-more')}
                  >
                    Load more posts
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
