'use client';

import { useId, useRef } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { POPULAR_SEARCHES, SITE, TYPES } from './data';
import { optionIdOf, ResultList } from './results';
import {
  correctionOf,
  countOfType,
  matchesOf,
  wordsOf,
  type TypeFilter,
} from './search';
import {
  INITIAL,
  LOOP_AFTER_MS,
  pageCountOf,
  pageOfResults,
  reducer,
  RESTING,
  resultsIn,
  SCRIPT,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...TYPES,
];

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

const KEY_MOTION = 'transition-[scale] duration-150';

function filterOf(values: unknown[]) {
  const [value] = values;
  const filter = FILTERS.find((candidate) => candidate.id === value);
  return filter?.id;
}

function resultsWordOf(count: number) {
  if (count === 1) {
    return 'result';
  }
  return 'results';
}

/** Below a millisecond the clock of the browser is too coarse to say more. */
function timingOf(searchMs: number) {
  if (searchMs < 1) {
    return 'in under 1 ms';
  }
  return `in ${Math.round(searchMs)} ms`;
}

function spokenOf(count: number, hasWords: boolean) {
  if (!hasWords) {
    return '';
  }
  if (count === 0) {
    return 'No results';
  }
  return `${count} ${resultsWordOf(count)}`;
}

function pagesOf(pageCount: number) {
  return Array.from({ length: pageCount }, (_, index) => index + 1);
}

function currentPageOf(isCurrent: boolean): 'page' | undefined {
  if (isCurrent) {
    return 'page';
  }
  return undefined;
}

function activeIdOf(listId: string, activeIndex: number, hasResults: boolean) {
  const hasActive = activeIndex >= 0;
  if (!hasResults || !hasActive) {
    return undefined;
  }
  return optionIdOf(listId, activeIndex);
}

const TYPE_NOUN: Record<TypeFilter, string> = {
  all: 'page',
  guide: 'guide',
  api: 'API reference page',
  changelog: 'changelog entry',
  community: 'community thread',
};

function hiddenLineOf(type: TypeFilter, query: string) {
  const noun = TYPE_NOUN[type];
  const trimmed = query.trim();
  return `No ${noun} matches “${trimmed}”`;
}

type PopularSearchesProps = {
  onPick: (query: string, control: HTMLElement) => void;
  className?: string;
};

function PopularSearches({ onPick, className }: PopularSearchesProps) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {POPULAR_SEARCHES.map((query) => (
        <li key={query}>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={(event) => onPick(query, event.currentTarget)}
          >
            {query}
          </Button>
        </li>
      ))}
    </ul>
  );
}

export default function Search01() {
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
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const listId = useId();
  const words = wordsOf(state.query);
  const hasWords = words.length > 0;
  const matches = matchesOf(state.query);
  const results = resultsIn(state);
  const shownResults = pageOfResults(state);
  const resultCount = results.length;
  const pageCount = pageCountOf(resultCount);
  const hasResults = resultCount > 0;
  const hasMatches = matches.length > 0;
  const isNothingFound = hasWords && !hasMatches;
  const isHiddenByType = hasMatches && !hasResults;
  let correction: string | null = null;
  if (isNothingFound) {
    correction = correctionOf(state.query);
  }
  const hasPages = pageCount > 1;
  const pages = pagesOf(pageCount);
  const activeId = activeIdOf(listId, state.activeIndex, hasResults);
  const resultLine = spokenOf(resultCount, hasWords);
  const message = spokenUnless(isAutoplaying, resultLine);
  const canReplay = isFinished && !isAutoplaying;
  useKeptHeight(ref);

  function search(value: string) {
    act({ type: 'typed', value });
  }

  /** A pick replaces the part of the page that held the focus: a keyboard goes back to the field. */
  function returnKeyboardToField(control: HTMLElement) {
    const isFromKeyboard = control.matches(':focus-visible');
    if (isFromKeyboard) {
      inputRef.current?.focus();
    }
  }

  function pickSearch(value: string, control: HTMLElement) {
    search(value);
    returnKeyboardToField(control);
  }

  function showEveryType(control: HTMLElement) {
    act({ type: 'typePicked', filter: 'all' });
    returnKeyboardToField(control);
  }

  function pickFilter(values: unknown[]) {
    const filter = filterOf(values);
    if (filter) {
      act({ type: 'typePicked', filter });
    }
  }

  function openActive() {
    let index = state.activeIndex;
    if (index < 0) {
      index = 0;
    }
    const optionId = optionIdOf(listId, index);
    const option = document.getElementById(optionId);
    option?.click();
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      act({ type: 'moved', by: 1 });
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      act({ type: 'moved', by: -1 });
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      act({ type: 'cleared' });
      return;
    }
    const isEnter = event.key === 'Enter';
    if (isEnter && hasResults) {
      event.preventDefault();
      openActive();
    }
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 @2xl:px-8 @2xl:py-10'>
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
            <span className='text-muted-foreground text-sm'>Docs</span>
            <span className='flex-1' />
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
          </header>

          <div className='flex flex-col gap-3'>
            <div className='relative'>
              <label htmlFor={inputId} className='sr-only'>
                Search the docs
              </label>
              <SearchIcon className='text-muted-foreground pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2' />
              <Input
                ref={inputRef}
                id={inputId}
                type='search'
                role='combobox'
                autoComplete='off'
                spellCheck={false}
                aria-autocomplete='list'
                aria-expanded={hasResults}
                aria-controls={listId}
                aria-activedescendant={activeId}
                placeholder='Search guides, endpoints and errors'
                value={state.query}
                onChange={(event) => search(event.target.value)}
                onKeyDown={handleKeys}
                className='h-12 rounded-xl ps-11 pe-4 md:text-sm'
              />
            </div>

            <div className='flex min-h-6 flex-wrap items-center gap-x-4 gap-y-2'>
              {hasWords && (
                <p className='text-muted-foreground flex items-baseline gap-1 text-xs tabular-nums'>
                  <MotionNumber
                    value={resultCount}
                    className='text-foreground font-medium'
                  />
                  {resultsWordOf(resultCount)} {timingOf(state.searchMs)}
                </p>
              )}
              {!hasWords && (
                <p className='text-muted-foreground text-xs'>
                  Search every guide, endpoint and changelog entry
                </p>
              )}
              <p
                aria-hidden='true'
                className='text-muted-foreground ms-auto hidden items-center gap-1 text-xs @md:flex'
              >
                <Kbd
                  className={cn(
                    KEY_MOTION,
                    pressedQuietOf(pressed === 'key-down')
                  )}
                >
                  ↓
                </Kbd>
                <Kbd>Enter</Kbd>
                <Kbd
                  className={cn(
                    KEY_MOTION,
                    pressedQuietOf(pressed === 'key-escape')
                  )}
                >
                  Esc
                </Kbd>
              </p>
            </div>
          </div>

          <div className='relative -mx-4 overflow-x-auto px-4 @2xl:mx-0 @2xl:px-0'>
            <ToggleGroup
              aria-label='Type of page'
              value={[state.type]}
              onValueChange={pickFilter}
              travel
              indicatorClassName={THUMB}
              className='bg-foreground/[0.04] rounded-xl p-1'
            >
              {FILTERS.map((filter) => (
                <ToggleGroupItem
                  key={filter.id}
                  value={filter.id}
                  className={cn(
                    'h-7 gap-1.5 rounded-lg px-2.5 text-xs',
                    pressedQuietOf(pressed === `type-${filter.id}`)
                  )}
                >
                  {filter.label}
                  <MotionNumber
                    value={countOfType(matches, filter.id)}
                    className='text-muted-foreground'
                  />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {hasResults && (
            <ResultList
              listId={listId}
              results={shownResults}
              words={words}
              activeIndex={state.activeIndex}
            />
          )}

          {hasPages && (
            <nav
              aria-label='Pages of results'
              className='flex items-center justify-center gap-1'
            >
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label='Previous page'
                disabled={state.page === 1}
                focusableWhenDisabled
                onClick={() => act({ type: 'paged', page: state.page - 1 })}
              >
                <ChevronLeftIcon />
              </Button>
              {pages.map((page) => {
                const isCurrent = page === state.page;
                let variant: 'outline' | 'ghost' = 'ghost';
                if (isCurrent) {
                  variant = 'outline';
                }
                return (
                  <Button
                    key={page}
                    type='button'
                    variant={variant}
                    size='icon'
                    aria-label={`Page ${page}`}
                    aria-current={currentPageOf(isCurrent)}
                    onClick={() => act({ type: 'paged', page })}
                    className={cn(
                      'tabular-nums',
                      pressedQuietOf(pressed === `page-${page}`)
                    )}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label='Next page'
                disabled={state.page === pageCount}
                focusableWhenDisabled
                onClick={() => act({ type: 'paged', page: state.page + 1 })}
              >
                <ChevronRightIcon />
              </Button>
            </nav>
          )}

          {isNothingFound && (
            <div className='bg-foreground/[0.025] flex flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center transition-opacity duration-200 starting:opacity-0'>
              <span className='keycap-3d flex size-10 items-center justify-center rounded-xl'>
                <SearchIcon className='text-muted-foreground size-5' />
              </span>
              <div className='flex flex-col gap-1'>
                <p className='text-sm font-medium text-balance'>
                  Nothing matches “{state.query.trim()}”
                </p>
                {correction && (
                  <p className='text-muted-foreground text-[13px]'>
                    Did you mean{' '}
                    <button
                      type='button'
                      onClick={(event) =>
                        pickSearch(correction, event.currentTarget)
                      }
                      className={cn(
                        'text-primary-ink rounded-sm font-medium underline-offset-4 transition-[scale] duration-150 hover:underline',
                        pressedQuietOf(pressed === 'correction'),
                        FOCUS_RING
                      )}
                    >
                      {correction}
                    </button>
                    ?
                  </p>
                )}
              </div>
              <PopularSearches onPick={pickSearch} className='justify-center' />
            </div>
          )}

          {isHiddenByType && (
            <div className='bg-foreground/[0.025] flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center transition-opacity duration-200 starting:opacity-0'>
              <p className='text-sm font-medium text-balance'>
                {hiddenLineOf(state.type, state.query)}
              </p>
              <Button
                type='button'
                variant='outline'
                onClick={(event) => showEveryType(event.currentTarget)}
              >
                Show all {matches.length} {resultsWordOf(matches.length)}
              </Button>
            </div>
          )}

          {!hasWords && (
            <div className='flex flex-col gap-3 pt-2'>
              <p className='text-[13px] font-medium'>Popular searches</p>
              <PopularSearches onPick={pickSearch} />
            </div>
          )}
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
