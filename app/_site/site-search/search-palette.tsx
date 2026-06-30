'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { countLabel } from '@/lib/site';
import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Command, CommandList } from '@/registry/ndeko/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/registry/ndeko/ui/dialog';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { readRecentSearches, rememberSearch } from './recent-searches';
import {
  loadSearchIndex,
  useSearchIndex,
  type SearchIndexState,
} from './search-index-store';
import {
  isSearchTab,
  SEARCH_TABS,
  TAB_ICONS,
  TAB_LABELS,
  type SearchTab,
} from './search-kinds';
import {
  BrowsePagesView,
  BrowseSectionsView,
  EmptyView,
  ErrorView,
  LoadingView,
  ResultsView,
  StartView,
} from './search-results';
import {
  bucketsOf,
  hasSearchTerms,
  rankRecords,
  type SearchRecord,
} from './search-score';
import {
  browsePagesOf,
  browseSectionsOf,
  sectionsForTab,
  tabCountsOf,
  type TabCounts,
} from './search-sections';
import { tabFromKey } from './search-shortcuts';
import type { SearchKind } from './search-types';

type PaletteView =
  'loading' | 'error' | 'start' | 'browse' | 'results' | 'empty';

type InputRef = React.RefObject<HTMLInputElement | null>;

/** Anchored near the top, so a list that grows or shrinks never moves the field people type in. */
const PALETTE_CLASS =
  'top-3 max-h-[calc(100dvh-1.5rem)] max-w-[44rem] translate-y-0 overflow-hidden p-0 sm:top-[12dvh] sm:max-h-[76dvh]';

const LIST_CLASS =
  'max-h-[min(26rem,calc(100dvh-12rem))] p-1.5 sm:max-h-[min(26rem,calc(76dvh-8rem))]';

const INPUT_CLASS =
  'placeholder:text-muted-foreground/75 h-full min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm';

const TAB_SCROLLER_CLASS =
  'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const DESCRIPTION =
  'Type to search. The arrow keys move through the results and Enter opens one. Tab and Shift+Tab switch between kinds, and Ctrl with a number from 1 to 6 jumps to one.';

function viewOf(
  status: SearchIndexState['status'],
  hasQuery: boolean,
  tab: SearchTab,
  visibleCount: number
): PaletteView {
  if (status === 'error') {
    return 'error';
  }
  if (status !== 'ready') {
    return 'loading';
  }
  if (!hasQuery) {
    if (tab === 'all') {
      return 'start';
    }
    return 'browse';
  }
  if (visibleCount === 0) {
    return 'empty';
  }
  return 'results';
}

function countTextOf(count: number, isReady: boolean) {
  if (!isReady) {
    return '';
  }
  return String(count);
}

function statusTextOf(view: PaletteView, count: number) {
  if (view === 'results') {
    return countLabel(count, 'result', 'results');
  }
  if (view === 'empty') {
    return 'No results';
  }
  return '';
}

function SearchInputRow({
  inputRef,
  query,
  onQueryChange,
}: {
  inputRef: InputRef;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <div className='hairline-b border-border flex h-12 shrink-0 items-center gap-2.5 ps-4 pe-2 sm:pe-4'>
      <SearchIcon className='text-muted-foreground size-4 shrink-0' />
      <CommandPrimitive.Input
        ref={inputRef}
        value={query}
        onValueChange={onQueryChange}
        placeholder='Search Ndeko UI'
        className={INPUT_CLASS}
      />
      <DialogClose
        render={<Button variant='ghost' size='sm' className='sm:hidden' />}
      >
        Cancel
      </DialogClose>
    </div>
  );
}

/** A click on a tab keeps the caret in the field, so typing carries on. */
function keepFieldFocus(event: React.MouseEvent) {
  event.preventDefault();
}

function SearchTabButton({
  tab,
  count,
  isReady,
}: {
  tab: SearchTab;
  count: number;
  isReady: boolean;
}) {
  const TabIcon = TAB_ICONS[tab];
  const countText = countTextOf(count, isReady);
  return (
    <TabsTab value={tab} onMouseDown={keepFieldFocus}>
      <TabIcon />
      {TAB_LABELS[tab]}
      <span className='text-muted-foreground min-w-[3ch] text-[11px] font-normal tabular-nums'>
        {countText}
      </span>
    </TabsTab>
  );
}

function SearchTabs({
  tab,
  counts,
  isReady,
  scrollerRef,
  onTabValue,
}: {
  tab: SearchTab;
  counts: TabCounts;
  isReady: boolean;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  onTabValue: (value: unknown) => void;
}) {
  return (
    <Tabs value={tab} onValueChange={onTabValue} className='shrink-0 gap-0'>
      <div ref={scrollerRef} className={TAB_SCROLLER_CLASS}>
        <TabsList
          aria-label='Kinds of results'
          className='w-max min-w-full gap-3 px-4'
        >
          {SEARCH_TABS.map((value) => (
            <SearchTabButton
              key={value}
              tab={value}
              count={counts[value]}
              isReady={isReady}
            />
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}

function KeyHint({
  keys,
  label,
  className,
}: {
  keys: string[];
  label: string;
  className?: string;
}) {
  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      <KbdGroup>
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </KbdGroup>
      {label}
    </span>
  );
}

function KeyboardHints() {
  return (
    <div
      aria-hidden='true'
      className='bg-foreground/[0.025] text-muted-foreground hidden shrink-0 items-center gap-4 px-4 py-2 text-xs sm:flex'
    >
      <KeyHint keys={['↑', '↓']} label='Move' />
      <KeyHint keys={['Enter']} label='Open' />
      <KeyHint keys={['Tab']} label='Switch kind' />
      <KeyHint keys={['Esc']} label='Close' className='ms-auto' />
    </div>
  );
}

type PaletteBodyProps = {
  inputRef: InputRef;
  onClose: () => void;
};

/** Mounted only while the palette is open, so the query and the tab start fresh each time. */
function PaletteBody({ inputRef, onClose }: PaletteBodyProps) {
  const router = useRouter();
  const index = useSearchIndex();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('all');
  const [recentSearches] = useState(readRecentSearches);
  const tabScrollerRef = useRef<HTMLDivElement>(null);

  const isReady = index.status === 'ready';
  const hasQuery = hasSearchTerms(query);
  const ranked = useMemo(
    () => rankRecords(index.records, query),
    [index.records, query]
  );
  const buckets = useMemo(() => bucketsOf(ranked), [ranked]);
  const counts = tabCountsOf(index.records, ranked, buckets, hasQuery);
  const sections = sectionsForTab(buckets, tab);
  const view = viewOf(index.status, hasQuery, tab, counts[tab]);
  const statusText = statusTextOf(view, counts[tab]);

  useEffect(() => {
    const scroller = tabScrollerRef.current;
    const activeTab = scroller?.querySelector<HTMLElement>('[data-active]');
    activeTab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [tab]);

  function focusInput() {
    inputRef.current?.focus();
  }

  function changeTab(nextTab: SearchTab) {
    setTab(nextTab);
    focusInput();
  }

  function showKind(kind: SearchKind) {
    changeTab(kind);
  }

  function showAll() {
    changeTab('all');
  }

  function handleTabValue(value: unknown) {
    if (isSearchTab(value)) {
      changeTab(value);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) {
      return;
    }
    const nextTab = tabFromKey(event, tab);
    if (!nextTab) {
      return;
    }
    event.preventDefault();
    changeTab(nextTab);
  }

  function pickRecent(recent: string) {
    setQuery(recent);
    focusInput();
  }

  function clearQuery() {
    setQuery('');
    focusInput();
  }

  function retry() {
    loadSearchIndex();
    focusInput();
  }

  function openHref(href: string) {
    rememberSearch(query, recentSearches);
    onClose();
    router.push(href);
  }

  return (
    <Command
      label='Search Ndeko UI'
      shouldFilter={false}
      loop
      vimBindings={false}
      onKeyDown={handleKeyDown}
      className='min-h-0 rounded-none bg-transparent'
    >
      <SearchInputRow
        inputRef={inputRef}
        query={query}
        onQueryChange={setQuery}
      />
      <SearchTabs
        tab={tab}
        counts={counts}
        isReady={isReady}
        scrollerRef={tabScrollerRef}
        onTabValue={handleTabValue}
      />
      <AnimatedSize className='shrink-0'>
        <CommandList className={LIST_CLASS}>
          {view === 'loading' && <LoadingView />}
          {view === 'error' && <ErrorView onRetry={retry} />}
          {view === 'start' && (
            <StartView
              recentSearches={recentSearches}
              onPickRecent={pickRecent}
              onOpen={openHref}
            />
          )}
          {view === 'browse' && (
            <BrowseView records={index.records} tab={tab} onOpen={openHref} />
          )}
          {view === 'results' && (
            <ResultsView
              sections={sections}
              tab={tab}
              onOpen={openHref}
              onShowKind={showKind}
            />
          )}
          {view === 'empty' && (
            <EmptyView
              query={query}
              tab={tab}
              totalMatches={counts.all}
              onShowAll={showAll}
              onClear={clearQuery}
            />
          )}
        </CommandList>
      </AnimatedSize>
      <p aria-live='polite' className='sr-only'>
        {statusText}
      </p>
      <KeyboardHints />
    </Command>
  );
}

function BrowseView({
  records,
  tab,
  onOpen,
}: {
  records: SearchRecord[];
  tab: SearchTab;
  onOpen: (href: string) => void;
}) {
  if (tab === 'all') {
    return null;
  }
  const pages = browsePagesOf(records, tab);
  const hasPages = pages.length > 0;
  if (hasPages) {
    return <BrowsePagesView kind={tab} pages={pages} onOpen={onOpen} />;
  }
  const sections = browseSectionsOf(records, tab);
  return <BrowseSectionsView sections={sections} onOpen={onOpen} />;
}

type SearchPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Opens instantly: it is reached from the keyboard many times a day, so it carries no entrance motion. */
export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        instant
        animateSize={false}
        showCloseButton={false}
        initialFocus={inputRef}
        contentClassName='min-h-0 gap-0'
        className={PALETTE_CLASS}
      >
        <DialogTitle className='sr-only'>Search Ndeko UI</DialogTitle>
        <DialogDescription className='sr-only'>{DESCRIPTION}</DialogDescription>
        <PaletteBody inputRef={inputRef} onClose={close} />
      </DialogContent>
    </Dialog>
  );
}
