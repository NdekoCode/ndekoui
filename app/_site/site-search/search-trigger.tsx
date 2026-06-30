'use client';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd } from '@/registry/ndeko/ui/kbd';

const SEARCH_LABEL = 'Search the library';

const KEY_SHORTCUTS = 'Meta+K Control+K /';

type SearchTriggerProps = {
  onOpen: () => void;
};

export function SearchField({
  shortcutLabel,
  onOpen,
}: SearchTriggerProps & { shortcutLabel: string | null }) {
  const hasShortcut = shortcutLabel !== null;
  return (
    <button
      type='button'
      onClick={onOpen}
      aria-label={SEARCH_LABEL}
      aria-keyshortcuts={KEY_SHORTCUTS}
      className={cn(
        CONTROL_RECIPE,
        'text-muted-foreground hover:text-foreground me-1 hidden h-8 w-56 cursor-pointer items-center gap-2 ps-2.5 pe-1.5 text-left lg:flex'
      )}
    >
      <SearchIcon className='size-4 shrink-0' />
      <span className='min-w-0 flex-1 truncate'>Search</span>
      {hasShortcut && <Kbd>{shortcutLabel}</Kbd>}
    </button>
  );
}

export function SearchIconButton({ onOpen }: SearchTriggerProps) {
  return (
    <Button
      variant='ghost'
      size='icon-sm'
      onClick={onOpen}
      aria-label={SEARCH_LABEL}
      aria-keyshortcuts={KEY_SHORTCUTS}
      className='lg:hidden'
    >
      <SearchIcon />
    </Button>
  );
}
