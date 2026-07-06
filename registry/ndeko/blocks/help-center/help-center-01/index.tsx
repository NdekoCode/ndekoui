'use client';

import { useCallback, useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Wash } from '@/registry/ndeko/ui/wash';

import {
  ARTICLES,
  CATEGORIES,
  CATEGORY_GLYPH,
  CONTACT,
  POPULAR_IDS,
  SITE,
  type Article,
  type Category,
} from './data';
import { HelpSearch } from './help-search';
import { countIn, matchesOf, totalIn, wordsOf } from './match';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  suggestionsIn,
  type HelpState,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const UNIT_LABELS = ['articles', 'article', 'matching'];

function isPopular(article: Article) {
  return POPULAR_IDS.includes(article.id);
}

const POPULAR = ARTICLES.filter(isPopular);

function unitOf(count: number, isSearching: boolean) {
  if (isSearching) {
    return 'matching';
  }
  if (count === 1) {
    return 'article';
  }
  return 'articles';
}

function categoryTitleOf(article: Article) {
  const category = CATEGORIES.find(
    (candidate) => candidate.id === article.category
  );
  return category?.title ?? '';
}

function matchLineOf(state: HelpState, count: number) {
  const hasWords = wordsOf(state.query).length > 0;
  const isListed = state.isOpen && hasWords;
  if (!isListed) {
    return '';
  }
  if (count === 0) {
    return 'No article matches';
  }
  if (count === 1) {
    return '1 article matches';
  }
  return `${count} articles match`;
}

type CategoryCardProps = {
  category: Category;
  count: number;
  isSearching: boolean;
};

function CategoryCard({ category, count, isSearching }: CategoryCardProps) {
  const Glyph = CATEGORY_GLYPH[category.id];
  const hasNone = isSearching && count === 0;

  return (
    <li>
      <a
        href={category.href}
        className={cn(
          CARD,
          'group hover:bg-foreground/[0.02] flex h-full items-start gap-3 p-4 transition-[opacity,background-color] duration-200',
          hasNone && 'opacity-45',
          FOCUS_RING
        )}
      >
        <span className='keycap-3d flex size-9 shrink-0 items-center justify-center rounded-lg'>
          <Glyph className='text-muted-foreground size-4' />
        </span>
        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='text-[13px] font-medium'>{category.title}</span>
          <span className='text-muted-foreground text-xs text-pretty'>
            {category.lead}
          </span>
        </span>
        <span className='text-muted-foreground flex shrink-0 items-baseline gap-1 text-xs tabular-nums'>
          <MotionNumber value={count} />
          <WordRoll text={unitOf(count, isSearching)} labels={UNIT_LABELS} />
        </span>
      </a>
    </li>
  );
}

export default function HelpCenter01() {
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
  const topicsId = useId();
  const popularId = useId();
  const matches = matchesOf(state.query);
  const suggestions = suggestionsIn(state);
  const isSearching = wordsOf(state.query).length > 0;
  const matchLine = matchLineOf(state, matches.length);
  const message = spokenUnless(isAutoplaying, matchLine);
  const canReplay = isFinished && !isAutoplaying;

  const close = useCallback(() => act({ type: 'closed' }), [act]);

  function countOf(category: Category) {
    if (isSearching) {
      return countIn(matches, category.id);
    }
    return totalIn(category.id);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-5xl flex-col gap-10 px-4 py-6 @2xl:px-8 @2xl:py-8'>
          <header className='flex min-h-8 items-center gap-2'>
            <a
              href={SITE.homeHref}
              className={cn(
                'flex items-center gap-2 rounded-md text-sm font-semibold',
                FOCUS_RING
              )}
            >
              <CompanyMark seed={SITE.name} size='lg' />
              {SITE.name}
            </a>
            <span className='text-muted-foreground text-sm'>Help</span>
            <span className='flex-1' />
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
          </header>

          <section className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] relative isolate z-10 flex flex-col items-center gap-4 rounded-2xl px-5 py-10 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04)] @2xl:py-14'>
            <Wash />
            <h1 className='text-2xl font-semibold text-balance @sm:text-3xl'>
              How can we help?
            </h1>
            <p className='text-muted-foreground max-w-md text-sm text-pretty'>
              Search the guides, or start from a topic below.
            </p>
            <HelpSearch
              query={state.query}
              isOpen={state.isOpen}
              activeIndex={state.activeIndex}
              suggestions={suggestions}
              matchCount={matches.length}
              pressed={pressed}
              isDemonstrating={isAutoplaying}
              onType={(value) => act({ type: 'typed', value })}
              onFocus={() => act({ type: 'focused' })}
              onMove={(by) => act({ type: 'moved', by })}
              onEscape={() => act({ type: 'escaped' })}
              onClose={close}
            />
          </section>

          <section aria-labelledby={topicsId} className='flex flex-col gap-3'>
            <h2 id={topicsId} className='px-1 text-[13px] font-medium'>
              Topics
            </h2>
            <ul className='grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3'>
              {CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  count={countOf(category)}
                  isSearching={isSearching}
                />
              ))}
            </ul>
          </section>

          <div className='grid gap-10 @3xl:grid-cols-[minmax(0,1fr)_20rem] @3xl:gap-8'>
            <section
              aria-labelledby={popularId}
              className='flex flex-col gap-3'
            >
              <h2 id={popularId} className='px-1 text-[13px] font-medium'>
                Popular articles
              </h2>
              <ul className={cn(CARD, 'flex flex-col p-1')}>
                {POPULAR.map((article) => (
                  <li key={article.id}>
                    <a
                      href={article.href}
                      className={cn(
                        'group hover:bg-foreground/[0.03] flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-100',
                        FOCUS_RING
                      )}
                    >
                      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                        <span className='truncate text-[13px] font-medium'>
                          {article.title}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          {categoryTitleOf(article)}
                        </span>
                      </span>
                      <ChevronRightIcon className='text-muted-foreground size-4 shrink-0 transition-transform duration-100 group-hover:translate-x-0.5' />
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-label='Contact support'
              className={cn(CARD, 'flex flex-col gap-4 self-start p-5')}
            >
              <div className='flex items-center gap-3'>
                <Avatar seed={CONTACT.person} className='size-10' />
                <div className='flex min-w-0 flex-col'>
                  <p className='text-sm font-medium'>{CONTACT.person}</p>
                  <p className='text-muted-foreground text-xs'>
                    {CONTACT.role}
                  </p>
                </div>
              </div>
              <div className='flex flex-col gap-1'>
                <p className='text-[13px] font-medium'>Still stuck?</p>
                <p className='text-muted-foreground text-[13px] text-pretty'>
                  {CONTACT.lead}
                </p>
                <p className='text-muted-foreground text-xs'>{CONTACT.hours}</p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  nativeButton={false}
                  render={<a href={CONTACT.chatHref} />}
                >
                  Start a chat
                </Button>
                <Button
                  variant='outline'
                  nativeButton={false}
                  render={<a href={CONTACT.emailHref} />}
                >
                  Email us
                </Button>
              </div>
            </section>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
