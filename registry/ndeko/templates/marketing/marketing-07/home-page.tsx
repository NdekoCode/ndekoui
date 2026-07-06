'use client';

import { AnimatePresence, motion } from 'motion/react';

import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import {
  CATEGORIES,
  PRODUCT,
  SAMPLE_NOTE,
  SUGGESTIONS,
  type Category,
} from './data';
import { pageOf, type PageId } from './pages';
import { wordsOf, type SearchResult } from './search';
import { SearchField } from './search-field';
import { SearchResults } from './search-results';

function CategoryCard({
  category,
  onOpenPage,
}: {
  category: Category;
  onOpenPage: (pageId: PageId) => void;
}) {
  const CategoryIcon = category.icon;
  const page = pageOf(category.pageId);

  function open(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onOpenPage(category.pageId);
  }

  return (
    <a
      href={`#${category.pageId}`}
      onClick={open}
      className={cn(
        'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] hover:bg-foreground/[0.02] group flex h-full flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors duration-150',
        FOCUS_RING
      )}
    >
      <span className='flex items-center gap-2.5'>
        <span className='keycap-3d text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md'>
          <CategoryIcon className='size-4' />
        </span>
        <span className='text-sm font-medium'>{category.title}</span>
      </span>
      <span className='text-muted-foreground text-[13px] leading-5 text-pretty'>
        {category.text}
      </span>
      <span className='text-primary-ink mt-auto flex items-center gap-1.5 text-xs font-medium'>
        {page.title}
        <ArrowRightIcon className='size-3.5 transition-transform duration-150 group-hover:translate-x-0.5' />
      </span>
    </a>
  );
}

type SuggestionsProps = {
  onPick: (query: string) => void;
};

function Suggestions({ onPick }: SuggestionsProps) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <span className='text-muted-foreground text-xs'>Try</span>
      {SUGGESTIONS.map((suggestion) => {
        function pick() {
          onPick(suggestion);
        }

        return (
          <button
            key={suggestion}
            type='button'
            onClick={pick}
            className={cn(
              'bg-foreground/[0.05] hover:bg-foreground/[0.08] cursor-pointer rounded-full px-3 py-1 text-xs transition-colors duration-150 active:scale-[0.97]',
              FOCUS_RING
            )}
          >
            {suggestion}
          </button>
        );
      })}
    </div>
  );
}

type HomePageProps = {
  searchId: string;
  query: string;
  pressed: string | null;
  onSearch: (query: string) => void;
  onEnter: () => void;
  onOpenResult: (result: SearchResult) => void;
  onOpenPage: (pageId: PageId) => void;
};

export function HomePage({
  searchId,
  query,
  pressed,
  onSearch,
  onEnter,
  onOpenResult,
  onOpenPage,
}: HomePageProps) {
  const fade = fadePresence();
  const isSearching = wordsOf(query).length > 0;

  function clear() {
    onSearch('');
  }

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-12 @2xl:px-8 @2xl:py-16'>
      <div className='flex flex-col items-center gap-3 text-center'>
        <h1 className='text-3xl font-semibold text-balance @2xl:text-4xl'>
          {PRODUCT.title}
        </h1>
        <p className='text-muted-foreground max-w-md text-base text-pretty'>
          {PRODUCT.lead}
        </p>
      </div>
      <div className='mx-auto flex w-full max-w-xl flex-col gap-3'>
        <SearchField
          id={searchId}
          value={query}
          label='Search the docs'
          placeholder='Search every page'
          size='lg'
          onChange={onSearch}
          onEnter={onEnter}
        />
        <AnimatedSize>
          <AnimatePresence initial={false} mode='wait'>
            {!isSearching && (
              <motion.div key='suggestions' {...fade}>
                <Suggestions onPick={onSearch} />
              </motion.div>
            )}
            {isSearching && (
              <motion.div key='results' {...fade}>
                <SearchResults
                  query={query}
                  pressed={pressed}
                  onOpen={onOpenResult}
                  onClear={clear}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatedSize>
      </div>
      <ul className='grid gap-3 @2xl:grid-cols-3'>
        {CATEGORIES.map((category) => (
          <li key={category.id}>
            <CategoryCard category={category} onOpenPage={onOpenPage} />
          </li>
        ))}
      </ul>
      <p className='text-muted-foreground text-center text-xs'>{SAMPLE_NOTE}</p>
    </div>
  );
}
