'use client';

import { countLabel } from '@/lib/site';
import {
  ArrowRightIcon,
  BookOpenIcon,
  HistoryIcon,
  LayoutGridIcon,
  RefreshCwIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { CommandGroup, CommandItem } from '@/registry/ndeko/ui/command';
import { Skeleton } from '@/registry/ndeko/ui/skeleton';

import { KIND_COPY, TAB_LABELS, type SearchTab } from './search-kinds';
import type { SearchRecord } from './search-score';
import type {
  BrowsePage,
  BrowseSection,
  ResultSection,
} from './search-sections';
import type { SearchKind } from './search-types';

type OpenHref = (href: string) => void;

type StartingPoint = {
  title: string;
  description: string;
  href: string;
  glyph: Icon;
};

const STARTING_POINTS: StartingPoint[] = [
  {
    title: 'Installation',
    description: 'Set up the shadcn CLI and the theme, then add any item',
    href: '/docs/installation',
    glyph: BookOpenIcon,
  },
  {
    title: 'Primitives',
    description: 'Every primitive on one page, in light and dark',
    href: '/kit',
    glyph: KIND_COPY.primitive.Icon,
  },
  {
    title: 'Components',
    description: 'Ready-made components grouped by family',
    href: '/components',
    glyph: KIND_COPY.component.Icon,
  },
  {
    title: 'Blocks',
    description: 'Whole sections of a product, built with fictional data',
    href: '/blocks',
    glyph: KIND_COPY.block.Icon,
  },
  {
    title: 'Templates',
    description: 'Complete pages assembled from the blocks',
    href: '/templates',
    glyph: KIND_COPY.template.Icon,
  },
  {
    title: 'Motion',
    description: 'Animated components and how to use them',
    href: '/docs',
    glyph: KIND_COPY.motion.Icon,
  },
];

const ROW_CLASS = 'h-auto min-h-11 gap-3 py-1.5';

const QUIET_ROW_CLASS = 'h-auto min-h-9 gap-3 py-1 text-muted-foreground';

const TILE_CLASS =
  'keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md';

const SKELETON_WIDTHS = ['w-2/5', 'w-1/2', 'w-1/3', 'w-3/5'];

function IconTile({ glyph: Glyph }: { glyph: Icon }) {
  return (
    <span aria-hidden='true' className={TILE_CLASS}>
      <Glyph />
    </span>
  );
}

function TileSpacer() {
  return <span aria-hidden='true' className='size-7 shrink-0' />;
}

type RowTextProps = {
  title: string;
  meta?: string;
  description?: string;
};

function RowText({ title, meta, description }: RowTextProps) {
  const hasMeta = Boolean(meta);
  const hasDescription = Boolean(description);
  return (
    <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
      <span className='flex min-w-0 items-baseline gap-3'>
        <span className='text-foreground truncate font-medium'>{title}</span>
        {hasMeta && (
          <span className='text-muted-foreground ms-auto max-w-[45%] shrink-0 truncate text-xs'>
            {meta}
          </span>
        )}
      </span>
      {hasDescription && (
        <span className='text-muted-foreground truncate text-xs'>
          {description}
        </span>
      )}
    </span>
  );
}

function ResultRow({
  record,
  onOpen,
}: {
  record: SearchRecord;
  onOpen: OpenHref;
}) {
  const { entry } = record;
  const copy = KIND_COPY[entry.kind];

  function open() {
    onOpen(entry.href);
  }

  return (
    <CommandItem value={record.id} onSelect={open} className={ROW_CLASS}>
      <IconTile glyph={copy.Icon} />
      <RowText
        title={entry.title}
        meta={entry.group}
        description={entry.description}
      />
    </CommandItem>
  );
}

function SeeAllRow({
  kind,
  total,
  onShowKind,
}: {
  kind: SearchKind;
  total: number;
  onShowKind: (kind: SearchKind) => void;
}) {
  const copy = KIND_COPY[kind];
  const count = countLabel(total, copy.singular, copy.plural);

  function showKind() {
    onShowKind(kind);
  }

  return (
    <CommandItem
      value={`see-all:${kind}`}
      onSelect={showKind}
      className={QUIET_ROW_CLASS}
    >
      <TileSpacer />
      <span className='flex-1 truncate'>See all {count}</span>
      <ArrowRightIcon />
    </CommandItem>
  );
}

function MoreNote({ section }: { section: ResultSection }) {
  const copy = KIND_COPY[section.kind];
  const total = countLabel(section.total, copy.singular, copy.plural);
  return (
    <p className='text-muted-foreground px-2 py-2 text-xs'>
      The {section.items.length} best of {total}. Add a word to narrow them
    </p>
  );
}

function ResultSectionGroup({
  section,
  isAllTab,
  onOpen,
  onShowKind,
}: {
  section: ResultSection;
  isAllTab: boolean;
  onOpen: OpenHref;
  onShowKind: (kind: SearchKind) => void;
}) {
  const hasMore = section.total > section.items.length;
  const offersSeeAll = isAllTab && hasMore;
  const showsMoreNote = !isAllTab && hasMore;
  const heading = headingOf(section.kind, isAllTab);
  return (
    <CommandGroup heading={heading}>
      {section.items.map((item) => (
        <ResultRow key={item.record.id} record={item.record} onOpen={onOpen} />
      ))}
      {offersSeeAll && (
        <SeeAllRow
          kind={section.kind}
          total={section.total}
          onShowKind={onShowKind}
        />
      )}
      {showsMoreNote && <MoreNote section={section} />}
    </CommandGroup>
  );
}

function headingOf(kind: SearchKind, isAllTab: boolean) {
  if (isAllTab) {
    return KIND_COPY[kind].label;
  }
  return undefined;
}

export function ResultsView({
  sections,
  tab,
  onOpen,
  onShowKind,
}: {
  sections: ResultSection[];
  tab: SearchTab;
  onOpen: OpenHref;
  onShowKind: (kind: SearchKind) => void;
}) {
  const isAllTab = tab === 'all';
  return sections.map((section) => (
    <ResultSectionGroup
      key={section.kind}
      section={section}
      isAllTab={isAllTab}
      onOpen={onOpen}
      onShowKind={onShowKind}
    />
  ));
}

export function StartView({
  recentSearches,
  onPickRecent,
  onOpen,
}: {
  recentSearches: string[];
  onPickRecent: (query: string) => void;
  onOpen: OpenHref;
}) {
  const hasRecent = recentSearches.length > 0;
  return (
    <>
      {hasRecent && (
        <CommandGroup heading='Recent searches'>
          {recentSearches.map((recent) => (
            <CommandItem
              key={recent}
              value={`recent:${recent}`}
              onSelect={() => onPickRecent(recent)}
              className={ROW_CLASS}
            >
              <IconTile glyph={HistoryIcon} />
              <RowText title={recent} />
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      <CommandGroup heading='Start here'>
        {STARTING_POINTS.map((point) => (
          <CommandItem
            key={point.href}
            value={`start:${point.href}`}
            onSelect={() => onOpen(point.href)}
            className={ROW_CLASS}
          >
            <IconTile glyph={point.glyph} />
            <RowText title={point.title} description={point.description} />
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}

export function BrowsePagesView({
  kind,
  pages,
  onOpen,
}: {
  kind: SearchKind;
  pages: BrowsePage[];
  onOpen: OpenHref;
}) {
  const copy = KIND_COPY[kind];
  return (
    <CommandGroup>
      {pages.map((page) => (
        <CommandItem
          key={page.href}
          value={`page:${page.href}`}
          onSelect={() => onOpen(page.href)}
          className={ROW_CLASS}
        >
          <IconTile glyph={copy.Icon} />
          <RowText
            title={page.name}
            meta={countLabel(page.count, copy.singular, copy.plural)}
          />
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

export function BrowseSectionsView({
  sections,
  onOpen,
}: {
  sections: BrowseSection[];
  onOpen: OpenHref;
}) {
  return sections.map((section) => (
    <CommandGroup key={section.name} heading={section.name}>
      {section.records.map((record) => (
        <ResultRow key={record.id} record={record} onOpen={onOpen} />
      ))}
    </CommandGroup>
  ));
}

function StateMessage({ title, hint }: { title: string; hint: string }) {
  return (
    <div className='flex flex-col gap-0.5 px-2 pt-3 pb-2'>
      <p className='text-foreground font-medium break-words'>{title}</p>
      <p className='text-muted-foreground text-xs'>{hint}</p>
    </div>
  );
}

function ActionRow({
  value,
  glyph,
  label,
  onSelect,
}: {
  value: string;
  glyph: Icon;
  label: string;
  onSelect: () => void;
}) {
  return (
    <CommandItem value={value} onSelect={onSelect} className={ROW_CLASS}>
      <IconTile glyph={glyph} />
      <RowText title={label} />
    </CommandItem>
  );
}

export function EmptyView({
  query,
  tab,
  totalMatches,
  onShowAll,
  onClear,
}: {
  query: string;
  tab: SearchTab;
  totalMatches: number;
  onShowAll: () => void;
  onClear: () => void;
}) {
  const quoted = `“${query.trim()}”`;
  const isKindTab = tab !== 'all';
  const hasMatchesElsewhere = totalMatches > 0;
  const canShowAll = isKindTab && hasMatchesElsewhere;

  if (canShowAll) {
    const results = countLabel(totalMatches, 'result', 'results');
    return (
      <>
        <StateMessage
          title={`Nothing in ${TAB_LABELS[tab]} matches ${quoted}`}
          hint='The other kinds have results for it'
        />
        <ActionRow
          value='action:show-all'
          glyph={LayoutGridIcon}
          label={`Show the ${results} in All`}
          onSelect={onShowAll}
        />
      </>
    );
  }

  return (
    <>
      <StateMessage
        title={`No results for ${quoted}`}
        hint='Check the spelling, or search for a category such as dialog or pricing'
      />
      <ActionRow
        value='action:clear'
        glyph={XIcon}
        label='Clear the search'
        onSelect={onClear}
      />
    </>
  );
}

export function ErrorView({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <StateMessage
        title='The search index could not load'
        hint='Check your connection, then try again'
      />
      <ActionRow
        value='action:retry'
        glyph={RefreshCwIcon}
        label='Try again'
        onSelect={onRetry}
      />
    </>
  );
}

export function LoadingView() {
  return (
    <div
      role='status'
      aria-label='Loading the search index'
      className='flex flex-col'
    >
      {SKELETON_WIDTHS.map((width) => (
        <div key={width} className='flex items-center gap-3 px-2 py-2'>
          <Skeleton className='size-7 shrink-0' />
          <div className='flex flex-1 flex-col gap-1.5'>
            <Skeleton className={`h-3 ${width}`} />
            <Skeleton className='h-2.5 w-3/4' />
          </div>
        </div>
      ))}
    </div>
  );
}
