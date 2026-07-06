'use client';

import { useCallback, useId } from 'react';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { POPULAR, SITE, type PopularPage } from './data';
import { wordsOf } from './match';
import { PageSearch } from './page-search';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  suggestionsIn,
  type SearchState,
} from './session';
import { TrailMap } from './trail-map';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function matchLineOf(state: SearchState, count: number) {
  const hasWords = wordsOf(state.query).length > 0;
  const isListed = state.isOpen && hasWords;
  if (!isListed) {
    return '';
  }
  if (count === 0) {
    return 'No page matches';
  }
  if (count === 1) {
    return '1 suggestion';
  }
  return `${count} suggestions`;
}

function PopularRow({ page }: { page: PopularPage }) {
  const Glyph = page.icon;

  return (
    <li>
      <a
        href={page.href}
        className={cn(
          'group hover:bg-foreground/[0.04] flex items-center gap-3 rounded-xl p-2 transition-colors duration-100',
          FOCUS_RING
        )}
      >
        <span className='keycap-3d flex size-8 shrink-0 items-center justify-center rounded-lg'>
          <Glyph className='text-muted-foreground size-4' />
        </span>
        <span className='flex min-w-0 flex-col'>
          <span className='text-[13px] font-medium'>{page.title}</span>
          <span className='text-muted-foreground truncate text-xs'>
            {page.lead}
          </span>
        </span>
        <ArrowRightIcon className='text-muted-foreground ms-auto size-4 shrink-0 transition-transform duration-100 group-hover:translate-x-0.5' />
      </a>
    </li>
  );
}

export default function ErrorPages01() {
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
  const popularId = useId();
  const suggestions = suggestionsIn(state);
  const isFound = suggestions.length > 0;
  const matchLine = matchLineOf(state, suggestions.length);
  const message = spokenUnless(isAutoplaying, matchLine);
  const canReplay = isFinished && !isAutoplaying;

  const close = useCallback(() => act({ type: 'closed' }), [act]);

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container flex min-h-dvh w-full flex-col'
      >
        <header className='flex min-h-16 items-center gap-3 px-4 @2xl:px-8'>
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
          <span className='flex-1' />
          <ReplayButton isShown={canReplay} onReplay={restart} label='Replay' />
        </header>

        <main className='flex flex-1 flex-col items-center px-4 pt-4 pb-16 @2xl:pt-8'>
          <div className='flex w-full max-w-xl flex-col items-center gap-8'>
            <TrailMap isFound={isFound} />

            <div className='flex flex-col items-center gap-3 text-center'>
              <p className='text-muted-foreground text-xs tabular-nums'>
                Error 404
              </p>
              <h1 className='text-2xl font-semibold text-balance @sm:text-3xl'>
                Page not found
              </h1>
              <p className='text-muted-foreground max-w-md text-sm text-pretty'>
                The link may be old, or the guide moved when we grouped the
                routes by region. Search for it, or start from a popular page.
              </p>
              <p className='text-muted-foreground font-mono text-xs break-all'>
                {SITE.missingAddress}
              </p>
            </div>

            <PageSearch
              query={state.query}
              isOpen={state.isOpen}
              activeIndex={state.activeIndex}
              suggestions={suggestions}
              pressed={pressed}
              isDemonstrating={isAutoplaying}
              onType={(value) => act({ type: 'typed', value })}
              onFocus={() => act({ type: 'focused' })}
              onMove={(by) => act({ type: 'moved', by })}
              onEscape={() => act({ type: 'escaped' })}
              onClose={close}
            />

            <section
              aria-labelledby={popularId}
              className='flex w-full flex-col gap-2'
            >
              <h2 id={popularId} className='px-2 text-[13px] font-medium'>
                Popular pages
              </h2>
              <ul className='bg-foreground/[0.025] grid gap-1 rounded-2xl p-1.5 @md:grid-cols-2'>
                {POPULAR.map((page) => (
                  <PopularRow key={page.id} page={page} />
                ))}
              </ul>
            </section>

            <Button
              size='lg'
              nativeButton={false}
              render={<a href={SITE.homeHref} />}
            >
              Go home
            </Button>
          </div>
        </main>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
