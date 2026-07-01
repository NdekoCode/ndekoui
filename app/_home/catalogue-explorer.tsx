'use client';

import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useDeferredValue, useState, type ChangeEvent } from 'react';

import { CategoryThumbnail } from '@/app/components/_catalog/category-thumbnail';
import { countLabel } from '@/lib/site';
import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

export type ExplorerCategory = {
  slug: string;
  name: string;
  count: number;
};

export type ExplorerFamily = {
  name: string;
  count: number;
  categories: ExplorerCategory[];
};

const SHOWN_TILES = 9;

const RAIL_TRAVEL = { type: 'spring', duration: 0.3, bounce: 0 } as const;
const NO_TRAVEL = { duration: 0 } as const;

const TILE =
  'flex flex-col gap-3 rounded-xl bg-card p-2 pb-3 hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] outline-none transition-[background-color,translate] hover:bg-foreground/[0.015] focus-visible:ring-[3px] focus-visible:ring-ring/25 active:translate-y-px';

function travelOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return NO_TRAVEL;
  }
  return RAIL_TRAVEL;
}

function normalized(text: string) {
  return text.trim().toLowerCase();
}

function matchesQuery(category: ExplorerCategory, query: string) {
  const name = normalized(category.name);
  return name.includes(query);
}

function visibleCategoriesOf(
  families: ExplorerFamily[],
  activeName: string,
  query: string
) {
  const hasQuery = query.length > 0;
  if (hasQuery) {
    const allCategories = families[0]?.categories ?? [];
    return allCategories.filter((category) => matchesQuery(category, query));
  }
  const family = families.find((candidate) => candidate.name === activeName);
  return family?.categories ?? [];
}

function CategoryTile({ category }: { category: ExplorerCategory }) {
  return (
    <li>
      <Link href={`/components/${category.slug}`} className={TILE}>
        <CategoryThumbnail slug={category.slug} />
        <span className='flex items-baseline justify-between gap-2 px-1'>
          <span className='text-[13px] font-medium'>{category.name}</span>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {countLabel(category.count, 'component', 'components')}
          </span>
        </span>
      </Link>
    </li>
  );
}

type RailProps = {
  families: ExplorerFamily[];
  activeName: string;
  hasQuery: boolean;
  onPick: (name: string) => void;
};

function FamilyRail({ families, activeName, hasQuery, onPick }: RailProps) {
  const prefersReducedMotion = useReducedMotion();
  const travel = travelOf(prefersReducedMotion);

  return (
    <ul
      aria-label='Families'
      className='-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0'
    >
      {families.map((family) => {
        const isActive = family.name === activeName;
        const isShown = isActive && !hasQuery;

        function pick() {
          onPick(family.name);
        }

        return (
          <li key={family.name} className='shrink-0'>
            <button
              type='button'
              aria-pressed={isShown}
              onClick={pick}
              className={cn(
                'focus-visible:ring-ring/25 relative flex w-full items-center justify-between gap-6 rounded-lg px-3 py-2 text-left text-sm outline-none focus-visible:ring-[3px]',
                isShown && 'text-primary-ink font-medium',
                !isShown && 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isShown && (
                <motion.span
                  layoutId='explorer-family'
                  transition={travel}
                  aria-hidden='true'
                  className='bg-primary/[0.07] absolute inset-0 rounded-lg'
                />
              )}
              <span className='relative whitespace-nowrap'>{family.name}</span>
              <span className='relative text-xs tabular-nums'>
                {family.count}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Families on the left, their categories on the right, and a search across all of them. */
export function CatalogueExplorer({
  families,
}: {
  families: ExplorerFamily[];
}) {
  const [activeName, setActiveName] = useState(families[0]?.name ?? '');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const searchQuery = normalized(deferredQuery);
  const hasQuery = searchQuery.length > 0;
  const categories = visibleCategoriesOf(families, activeName, searchQuery);
  const shown = categories.slice(0, SHOWN_TILES);
  const hasNoMatch = shown.length === 0;

  function changeQuery(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function pickFamily(name: string) {
    setQuery('');
    setActiveName(name);
  }

  return (
    <div className='grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10'>
      <div className='flex min-w-0 flex-col gap-4'>
        <label className='bg-card hairline-ring ring-border focus-within:ring-ring/40 flex items-center gap-2 rounded-full px-3.5 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-within:ring-[3px]'>
          <SearchIcon className='text-muted-foreground size-4' />
          <span className='sr-only'>Search the categories</span>
          <input
            type='search'
            value={query}
            onChange={changeQuery}
            placeholder='Search categories'
            className='placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none'
          />
        </label>
        <FamilyRail
          families={families}
          activeName={activeName}
          hasQuery={hasQuery}
          onPick={pickFamily}
        />
      </div>
      <div aria-live='polite' className='min-w-0'>
        {hasNoMatch && (
          <p className='text-muted-foreground bg-foreground/[0.03] rounded-xl px-4 py-10 text-center text-sm'>
            {`No category matches “${deferredQuery.trim()}”. Try a shorter word, or browse a family.`}
          </p>
        )}
        <ul className='grid gap-x-4 gap-y-6 sm:grid-cols-2 xl:grid-cols-3'>
          {shown.map((category) => (
            <CategoryTile key={category.slug} category={category} />
          ))}
        </ul>
      </div>
    </div>
  );
}
