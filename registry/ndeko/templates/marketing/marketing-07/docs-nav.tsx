'use client';

import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';

import { PAGES, type PageId } from './pages';
import { wordsOf, type SearchResult } from './search';
import { SearchField } from './search-field';
import { SearchResults } from './search-results';

function currentOf(isCurrent: boolean): 'page' | undefined {
  if (isCurrent) {
    return 'page';
  }
  return undefined;
}

type DocsNavProps = {
  searchId: string;
  query: string;
  pageId: PageId;
  pressed: string | null;
  onSearch: (query: string) => void;
  onEnter: () => void;
  onOpenResult: (result: SearchResult) => void;
  onOpenPage: (pageId: PageId) => void;
};

export function DocsNav({
  searchId,
  query,
  pageId,
  pressed,
  onSearch,
  onEnter,
  onOpenResult,
  onOpenPage,
}: DocsNavProps) {
  const isSearching = wordsOf(query).length > 0;

  function clear() {
    onSearch('');
  }

  return (
    <nav aria-label='Documentation' className='flex flex-col gap-5'>
      <SearchField
        id={searchId}
        value={query}
        label='Search the docs'
        placeholder='Search the docs'
        onChange={onSearch}
        onEnter={onEnter}
      />
      {isSearching && (
        <SearchResults
          query={query}
          pressed={pressed}
          onOpen={onOpenResult}
          onClear={clear}
        />
      )}
      {!isSearching &&
        PAGES.map((page) => {
          const isCurrent = page.id === pageId;

          function open(event: React.MouseEvent<HTMLAnchorElement>) {
            event.preventDefault();
            onOpenPage(page.id);
          }

          return (
            <section key={page.id} className='flex flex-col gap-1'>
              <h3 className='text-muted-foreground px-2 text-xs font-medium'>
                {page.category}
              </h3>
              <a
                href={`#${page.id}`}
                aria-current={currentOf(isCurrent)}
                onClick={open}
                className={cn(
                  'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground block rounded-md px-2 py-1.5 text-[13px] transition-colors duration-100',
                  isCurrent && 'bg-foreground/[0.06] text-foreground',
                  FOCUS_RING
                )}
              >
                {page.title}
              </a>
            </section>
          );
        })}
    </nav>
  );
}
