'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  CircleDashedIcon,
  FolderIcon,
  HistoryIcon,
  LayersIcon,
  SearchIcon,
  UserIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import {
  ModalDescription,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { rowVariantsOf } from './_parts/motion';
import { Swap } from './_parts/swap';

type FilterKey = 'status' | 'assignee' | 'project';

type FilterOption = { value: string; label: string };

type Filters = Record<FilterKey, string | null>;

type RecentSearch = { id: string; text: string; scope: string };

type Suggestion = {
  id: string;
  label: string;
  line: string;
  color: string;
  icon: Icon;
};

const ANY = 'any';

const FILTERS: {
  key: FilterKey;
  label: string;
  icon: Icon;
  options: FilterOption[];
}[] = [
  {
    key: 'status',
    label: 'Status',
    icon: CircleDashedIcon,
    options: [
      { value: 'todo', label: 'Todo' },
      { value: 'in-progress', label: 'In progress' },
      { value: 'in-review', label: 'In review' },
      { value: 'done', label: 'Done' },
    ],
  },
  {
    key: 'assignee',
    label: 'Assignee',
    icon: UserIcon,
    options: [
      { value: 'amara', label: 'Amara' },
      { value: 'lucas', label: 'Lucas' },
      { value: 'priya', label: 'Priya' },
      { value: 'mateo', label: 'Mateo' },
    ],
  },
  {
    key: 'project',
    label: 'Project',
    icon: FolderIcon,
    options: [
      { value: 'onboarding', label: 'Onboarding' },
      { value: 'billing', label: 'Billing' },
      { value: 'reports', label: 'Reports' },
    ],
  },
];

const NO_FILTERS: Filters = { status: null, assignee: null, project: null };

const FIRST_RECENT: RecentSearch[] = [
  { id: 'recent-1', text: 'invoice rounding', scope: 'Billing · Mateo' },
  { id: 'recent-2', text: 'onboarding checklist', scope: 'In progress' },
  { id: 'recent-3', text: 'timesheet export', scope: 'Reports' },
  { id: 'recent-4', text: 'contrast audit', scope: 'Done · Amara' },
];

const SUGGESTIONS: Suggestion[] = [
  {
    id: 'onboarding',
    label: 'Onboarding',
    line: 'Project · 14 open tasks',
    color: 'var(--primary)',
    icon: FolderIcon,
  },
  {
    id: 'billing',
    label: 'Billing',
    line: 'Project · 6 open tasks',
    color: 'var(--success)',
    icon: FolderIcon,
  },
  {
    id: 'my-week',
    label: 'Due this week',
    line: 'Saved view · yours',
    color: 'var(--warning)',
    icon: LayersIcon,
  },
];

function labelOfOption(options: FilterOption[], value: string | null) {
  const option = options.find((candidate) => candidate.value === value);
  if (!option) {
    return null;
  }
  return option.label;
}

function pillLabelOf(label: string, pickedLabel: string | null) {
  if (!pickedLabel) {
    return label;
  }
  return `${label}: ${pickedLabel}`;
}

function scopeOf(filters: Filters) {
  const labels: string[] = [];
  for (const filter of FILTERS) {
    const picked = labelOfOption(filter.options, filters[filter.key]);
    if (picked) {
      labels.push(picked);
    }
  }
  if (labels.length === 0) {
    return 'Everywhere';
  }
  return labels.join(' · ');
}

function recentCountLabelOf(count: number) {
  if (count === 0) {
    return 'Nothing kept on this device';
  }
  if (count === 1) {
    return '1 search kept on this device';
  }
  return `${count} searches kept on this device`;
}

function FilterPill({
  label,
  icon: FilterGlyph,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: Icon;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const pickedLabel = labelOfOption(options, value);
  const isSet = pickedLabel !== null;
  const pillLabel = pillLabelOf(label, pickedLabel);
  const menuValue = value ?? ANY;

  function changeValue(nextValue: unknown) {
    const option = options.find((candidate) => candidate.value === nextValue);
    if (option) {
      onChange(option.value);
      return;
    }
    onChange(null);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='outline'
            size='sm'
            className={cn(isSet && 'text-primary-ink')}
          />
        }
      >
        <FilterGlyph />
        <AnimatedSize axis='width' as='span'>
          <Swap swapKey={pillLabel} kind='label'>
            {pillLabel}
          </Swap>
        </AnimatedSize>
        <ChevronDownIcon className='text-muted-foreground size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-48'>
        <DropdownMenuRadioGroup value={menuValue} onValueChange={changeValue}>
          <DropdownMenuRadioItem value={ANY}>
            {`Any ${label.toLowerCase()}`}
          </DropdownMenuRadioItem>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RecentRow({
  search,
  onRun,
  onRemove,
}: {
  search: RecentSearch;
  onRun: (text: string) => void;
  onRemove: (searchId: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = rowVariantsOf(shouldReduceMotion);

  function runSearch() {
    onRun(search.text);
  }

  function remove() {
    onRemove(search.id);
  }

  return (
    <motion.li
      variants={variants}
      initial='hidden'
      animate='shown'
      exit='hidden'
    >
      <div className='hover:bg-foreground/[0.03] flex h-9 items-center gap-1 rounded-md pr-1'>
        <button
          type='button'
          onClick={runSearch}
          className='focus-visible:ring-ring/25 flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md px-2 text-left outline-none focus-visible:ring-[3px]'
        >
          <HistoryIcon className='text-muted-foreground size-4 shrink-0' />
          <span className='truncate text-[13px]'>{search.text}</span>
          <span className='text-muted-foreground shrink-0 text-xs'>
            {search.scope}
          </span>
        </button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Remove “${search.text}” from recent searches`}
          onClick={remove}
          className='text-muted-foreground'
        >
          <XIcon />
        </Button>
      </div>
    </motion.li>
  );
}

function SuggestionRow({ suggestion }: { suggestion: Suggestion }) {
  const SuggestionGlyph = suggestion.icon;
  const gemStyle = { '--gem': suggestion.color } as React.CSSProperties;

  return (
    <li>
      <a
        href='#'
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex h-10 items-center gap-2.5 rounded-md px-2 outline-none focus-visible:ring-[3px]'
      >
        <span
          style={gemStyle}
          className='gem-plate flex size-5 shrink-0 items-center justify-center rounded-[5px]'
        >
          <SuggestionGlyph className='size-3' strokeWidth={2.25} />
        </span>
        <span className='flex min-w-0 flex-1 items-baseline gap-2'>
          <span className='truncate text-[13px] font-medium'>
            {suggestion.label}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {suggestion.line}
          </span>
        </span>
        <ArrowUpRightIcon className='text-muted-foreground size-4 shrink-0' />
      </a>
    </li>
  );
}

function RecentSearchesContent() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    ...NO_FILTERS,
    project: 'billing',
  });
  const [recent, setRecent] = useState<RecentSearch[]>(FIRST_RECENT);
  const [nextId, setNextId] = useState(FIRST_RECENT.length + 1);
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const typed = query.trim();
  const hasQuery = typed.length > 0;
  const hasRecent = recent.length > 0;
  const scope = scopeOf(filters);
  const matchingRecent = recent.filter((search) =>
    search.text.includes(typed.toLowerCase())
  );
  const hasMatchingRecent = matchingRecent.length > 0;
  const showsMatchingRecent = hasQuery && hasMatchingRecent;

  function changeQuery(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function changeFilter(key: FilterKey, value: string | null) {
    setFilters((previous) => ({ ...previous, [key]: value }));
  }

  function keepSearch() {
    if (!hasQuery) {
      return;
    }
    const text = typed.toLowerCase();
    const kept: RecentSearch = { id: `recent-${nextId}`, text, scope };
    setRecent((previous) => {
      const others = previous.filter((search) => search.text !== text);
      return [kept, ...others];
    });
    setNextId((previous) => previous + 1);
    setQuery('');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      keepSearch();
    }
  }

  function removeSearch(searchId: string) {
    setRecent((previous) =>
      previous.filter((search) => search.id !== searchId)
    );
  }

  function clearRecent() {
    setRecent([]);
  }

  return (
    <>
      <ModalHeader>
        <ModalTitle>Search</ModalTitle>
        <ModalDescription>
          Tasks, people and projects of the Lattice workspace
        </ModalDescription>
      </ModalHeader>
      <div className='flex flex-col gap-2'>
        <div className='relative'>
          <SearchIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
          <Input
            type='search'
            value={query}
            placeholder='Search tasks, people and projects'
            aria-label='Search the workspace'
            onChange={changeQuery}
            onKeyDown={handleKeyDown}
            className='pl-8'
          />
        </div>
        <div className='flex flex-wrap items-center gap-1.5'>
          {FILTERS.map((filter) => {
            function changeThisFilter(value: string | null) {
              changeFilter(filter.key, value);
            }

            return (
              <FilterPill
                key={filter.key}
                label={filter.label}
                icon={filter.icon}
                options={filter.options}
                value={filters[filter.key]}
                onChange={changeThisFilter}
              />
            );
          })}
        </div>
      </div>
      {hasQuery && (
        <section aria-label='Search' className='-mx-2 flex flex-col gap-0.5'>
          <button
            type='button'
            onClick={keepSearch}
            className='bg-foreground/[0.04] focus-visible:ring-ring/25 flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-left outline-none focus-visible:ring-[3px]'
          >
            <SearchIcon className='text-muted-foreground size-4 shrink-0' />
            <span className='truncate text-[13px]'>
              {`Search for “${typed}”`}
            </span>
            <span className='text-muted-foreground shrink-0 text-xs'>
              {scope}
            </span>
          </button>
          {showsMatchingRecent && (
            <ul className='flex flex-col'>
              {matchingRecent.map((search) => (
                <li key={search.id}>
                  <div className='text-muted-foreground flex h-9 items-center gap-2.5 px-2 text-[13px]'>
                    <HistoryIcon className='size-4 shrink-0' />
                    <span className='text-foreground truncate'>
                      {search.text}
                    </span>
                    <span className='shrink-0 text-xs'>{search.scope}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {!hasQuery && (
        <section aria-label='Recent searches' className='flex flex-col gap-1'>
          <div className='flex h-7 items-center gap-2'>
            <h3 className='text-muted-foreground text-xs font-medium'>
              Recent
            </h3>
            {hasRecent && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearRecent}
                className='text-muted-foreground ml-auto'
              >
                Clear all
              </Button>
            )}
          </div>
          <ul className='-mx-2 flex flex-col'>
            <AnimatePresence initial={false}>
              {recent.map((search) => (
                <RecentRow
                  key={search.id}
                  search={search}
                  onRun={setQuery}
                  onRemove={removeSearch}
                />
              ))}
            </AnimatePresence>
          </ul>
          <AnimatePresence initial={false}>
            {!hasRecent && (
              <motion.p
                key='empty'
                variants={rowVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
                className='text-muted-foreground text-[13px]'
              >
                No recent searches. What you search for with Enter shows up here
              </motion.p>
            )}
          </AnimatePresence>
        </section>
      )}
      {!hasQuery && (
        <section aria-label='Suggested' className='flex flex-col gap-1'>
          <h3 className='text-muted-foreground flex h-7 items-center text-xs font-medium'>
            Suggested
          </h3>
          <ul className='-mx-2 flex flex-col'>
            {SUGGESTIONS.map((suggestion) => (
              <SuggestionRow key={suggestion.id} suggestion={suggestion} />
            ))}
          </ul>
        </section>
      )}
      <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs'>
        <span className='flex items-center gap-1.5'>
          <Kbd>Enter</Kbd>
          to search and keep it in Recent
        </span>
        <span className='ml-auto'>{recentCountLabelOf(recent.length)}</span>
      </div>
    </>
  );
}

export default function Modal12() {
  return (
    <ModalPreview triggerLabel='Open search' size='md'>
      <RecentSearchesContent />
    </ModalPreview>
  );
}
