'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CheckIcon,
  EllipsisIcon,
  EyeIcon,
  PencilIcon,
  Share2Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

type ActionId = 'edit' | 'share' | 'watch';

/** Edit stays in the row the longest, Watch folds first. */
const BY_PRIORITY: ActionId[] = ['edit', 'share', 'watch'];

/** In the row the primary action sits at the end, next to More. */
const ROW_ORDER: ActionId[] = ['watch', 'share', 'edit'];

/** The title keeps at least this much of the row before an action gives way. */
const TITLE_MIN_PX = 160;

const ROW_GAP_PX = 12;

const ACTION_GAP_PX = 8;

function widthOf(measure: HTMLElement, key: string) {
  const element = measure.querySelector<HTMLElement>(`[data-measure="${key}"]`);
  return element?.offsetWidth ?? 0;
}

function countThatFits(measure: HTMLElement, budget: number) {
  let used = widthOf(measure, 'more');
  let count = 0;
  for (const id of BY_PRIORITY) {
    const next = used + ACTION_GAP_PX + widthOf(measure, id);
    if (next > budget) {
      break;
    }
    used = next;
    count += 1;
  }
  return count;
}

function watchLabelOf(isWatching: boolean) {
  if (isWatching) {
    return 'Watching';
  }
  return 'Watch';
}

export type HeaderActionsProps = {
  /** The row the title shares with the actions: its width decides how many actions stay out. */
  rowRef: RefObject<HTMLDivElement | null>;
  isWatching: boolean;
  isLinkCopied: boolean;
  isArchived: boolean;
  onEdit: () => void;
  onShare: () => void;
  onWatch: () => void;
  onArchive: () => void;
};

export function HeaderActions({
  rowRef,
  isWatching,
  isLinkCopied,
  isArchived,
  onEdit,
  onShare,
  onWatch,
  onArchive,
}: HeaderActionsProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(BY_PRIORITY.length);
  const [isMeasured, setIsMeasured] = useState(false);
  const shown = BY_PRIORITY.slice(0, visibleCount);
  const folded = BY_PRIORITY.slice(visibleCount);
  const inRow = ROW_ORDER.filter((id) => shown.includes(id));
  const watchLabel = watchLabelOf(isWatching);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) {
      return;
    }
    function fit() {
      if (!row || !measure) {
        return;
      }
      const budget = row.clientWidth - TITLE_MIN_PX - ROW_GAP_PX;
      const count = countThatFits(measure, budget);
      setVisibleCount(count);
      setIsMeasured(true);
    }
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [rowRef]);

  const glyphs: Record<ActionId, React.ReactNode> = {
    edit: <PencilIcon />,
    share: (
      <Swap swapKey={String(isLinkCopied)}>
        {isLinkCopied && <CheckIcon />}
        {!isLinkCopied && <Share2Icon />}
      </Swap>
    ),
    watch: (
      <Swap swapKey={String(isWatching)}>
        {isWatching && <CheckIcon />}
        {!isWatching && <EyeIcon />}
      </Swap>
    ),
  };

  const labels: Record<ActionId, string> = {
    edit: 'Edit',
    share: 'Share',
    watch: watchLabel,
  };

  const handlers: Record<ActionId, () => void> = {
    edit: onEdit,
    share: onShare,
    watch: onWatch,
  };

  return (
    <>
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 transition-opacity duration-150',
          !isMeasured && 'opacity-0'
        )}
      >
        {inRow.map((id) => {
          const isPrimary = id === 'edit';
          let variant: 'default' | 'outline' = 'outline';
          if (isPrimary) {
            variant = 'default';
          }
          return (
            <Button
              key={id}
              type='button'
              variant={variant}
              data-action={id}
              onClick={handlers[id]}
            >
              {glyphs[id]}
              {labels[id]}
            </Button>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type='button'
                variant='outline'
                size='icon'
                data-action='more'
                aria-label='More actions'
              />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='min-w-48'>
            {folded.map((id) => (
              <DropdownMenuItem key={id} onClick={handlers[id]}>
                {glyphs[id]}
                {labels[id]}
              </DropdownMenuItem>
            ))}
            {folded.length > 0 && <DropdownMenuSeparator />}
            {!isArchived && (
              <DropdownMenuItem variant='destructive' onClick={onArchive}>
                <ArchiveIcon />
                Archive project
              </DropdownMenuItem>
            )}
            {isArchived && (
              <DropdownMenuItem onClick={onArchive}>
                <ArchiveRestoreIcon />
                Restore project
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-hidden'
      >
        <div ref={measureRef} inert className='invisible flex w-max gap-2'>
          <Button type='button' tabIndex={-1} data-measure='edit'>
            <PencilIcon />
            Edit
          </Button>
          <Button
            type='button'
            variant='outline'
            tabIndex={-1}
            data-measure='share'
          >
            <Share2Icon />
            Share
          </Button>
          <Button
            type='button'
            variant='outline'
            tabIndex={-1}
            data-measure='watch'
          >
            <EyeIcon />
            Watching
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon'
            tabIndex={-1}
            data-measure='more'
            aria-label='More actions'
          >
            <EllipsisIcon />
          </Button>
        </div>
      </div>
    </>
  );
}
