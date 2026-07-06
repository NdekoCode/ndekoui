'use client';

import { memo, useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon, TextQuoteIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

import {
  HEALTH_LABEL,
  ownerOf,
  PLAN_LABEL,
  REGION_LABEL,
  renewalLabelOf,
  summaryOf,
  type Account,
  type Health,
  type OwnerId,
} from './data';
import {
  ownerIdOf,
  SORT_LABEL,
  type AccountsAction,
  type Owners,
  type Sort,
  type SortColumn,
  type SortDirection,
} from './session';
import { StreamedWords } from './streamed-words';

const COLUMN_COUNT = 9;

/** How long one word of a summary takes to follow the one before it. */
const WORD_MS = 45;

const HEALTH_VARIANT: Record<Health, 'success' | 'warning' | 'destructive'> = {
  healthy: 'success',
  watch: 'warning',
  risk: 'destructive',
};

const SORT_BUTTON =
  'group/sort focus-visible:ring-ring/25 hover:bg-foreground/[0.05] hover:text-foreground -mx-1.5 inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-1.5 transition-[background-color,color,scale] duration-150 outline-none focus-visible:ring-[3px]';

/**
 * The table scrolls sideways inside its frame on a narrow page. What belongs to a whole row (its
 * summary, the empty state) stays as wide as the frame and holds to its left edge, so it is read
 * without scrolling.
 */
const FRAME_WIDE = 'sticky left-0 w-[100cqw]';

function ariaSortOf(isSorted: boolean, direction: SortDirection) {
  if (!isSorted) {
    return 'none';
  }
  if (direction === 'asc') {
    return 'ascending';
  }
  return 'descending';
}

function arrowClassOf(isSorted: boolean, direction: SortDirection) {
  if (!isSorted) {
    return 'opacity-0 group-hover/sort:opacity-40 group-focus-visible/sort:opacity-40';
  }
  if (direction === 'asc') {
    return 'opacity-100';
  }
  return 'rotate-180 opacity-100';
}

type SortHeadProps = {
  column: SortColumn;
  sort: Sort;
  pressed: string | null;
  /** A column of figures: the label ends where the figures end, the arrow sits before it. */
  isFigure?: boolean;
  onAction: (action: AccountsAction) => void;
};

function SortHead({
  column,
  sort,
  pressed,
  isFigure = false,
  onAction,
}: SortHeadProps) {
  const isSorted = sort.column === column;
  const isPressed = pressed === `sort-${column}`;

  return (
    <TableHead
      aria-sort={ariaSortOf(isSorted, sort.direction)}
      className={cn(isFigure && 'text-end')}
    >
      <button
        type='button'
        onClick={() => onAction({ type: 'sorted', column })}
        className={cn(
          SORT_BUTTON,
          isFigure && 'flex-row-reverse',
          pressedQuietOf(isPressed)
        )}
      >
        {SORT_LABEL[column]}
        <ArrowUpIcon
          aria-hidden='true'
          className={cn(
            'size-3.5 transition-[opacity,rotate] duration-200 ease-(--ease-out-strong)',
            arrowClassOf(isSorted, sort.direction)
          )}
        />
      </button>
    </TableHead>
  );
}

function selectedStateOf(isSelected: boolean) {
  if (isSelected) {
    return 'selected';
  }
  return undefined;
}

/** A row that arrives after the first change of the list fades in. Nothing fades when the page loads. */
function arrivalOf(hasChanged: boolean) {
  if (hasChanged) {
    return 'transition-[background-color,opacity] duration-[150ms,300ms] starting:opacity-0';
  }
  return undefined;
}

/** A gradient alone names nobody: the first name sits beside it, the full name once the table has room. */
function OwnerCell({ ownerId }: { ownerId: OwnerId }) {
  const owner = ownerOf(ownerId);

  return (
    <Swap swapKey={owner.id}>
      <span className='flex items-center gap-2 whitespace-nowrap'>
        <Avatar seed={owner.name} className='size-5' />
        <span className='@5xl:hidden'>{owner.firstName}</span>
        <span className='hidden @5xl:inline'>{owner.name}</span>
      </span>
    </Swap>
  );
}

type AccountRowProps = {
  account: Account;
  ownerId: OwnerId;
  isSelected: boolean;
  isSummaryOpen: boolean;
  isSummaryWritten: boolean;
  isSummaryStreaming: boolean;
  isLast: boolean;
  hasChanged: boolean;
  pressed: string | null;
  onAction: (action: AccountsAction) => void;
};

function AccountRow({
  account,
  ownerId,
  isSelected,
  isSummaryOpen,
  isSummaryWritten,
  isSummaryStreaming,
  isLast,
  hasChanged,
  pressed,
  onAction,
}: AccountRowProps) {
  const summaryId = useId();
  const isSelectPressed = pressed === `select-${account.id}`;
  const isSummarizePressed = pressed === `summarize-${account.id}`;
  const endsTheList = isLast && !isSummaryOpen;
  const hasLineUnderSummary = isSummaryOpen && !isLast;

  return (
    <>
      <TableRow
        data-state={selectedStateOf(isSelected)}
        className={cn('h-12', arrivalOf(hasChanged), endsTheList && 'border-0')}
      >
        <TableCell className='py-0'>
          <Checkbox
            checked={isSelected}
            aria-label={`Select ${account.name}`}
            onCheckedChange={() =>
              onAction({ type: 'rowToggled', id: account.id })
            }
            className={cn(
              'transition-[background-color,box-shadow,scale]',
              pressedQuietOf(isSelectPressed)
            )}
          />
        </TableCell>
        <TableCell className='w-full max-w-0 py-0'>
          <span className='flex min-w-0 items-center gap-2.5'>
            <CompanyMark seed={account.name} />
            <span className='truncate font-medium'>{account.name}</span>
          </span>
        </TableCell>
        <TableCell className='py-0 whitespace-nowrap'>
          {PLAN_LABEL[account.plan]}
        </TableCell>
        <TableCell className='text-muted-foreground hidden py-0 whitespace-nowrap @4xl:table-cell'>
          {REGION_LABEL[account.region]}
        </TableCell>
        <TableCell className='py-0 text-end tabular-nums'>
          {account.seats}
        </TableCell>
        <TableCell className='py-0 whitespace-nowrap tabular-nums'>
          {renewalLabelOf(account.renewal)}
        </TableCell>
        <TableCell className='py-0'>
          <Badge variant={HEALTH_VARIANT[account.health]}>
            {HEALTH_LABEL[account.health]}
          </Badge>
        </TableCell>
        <TableCell className='py-0'>
          <OwnerCell ownerId={ownerId} />
        </TableCell>
        <TableCell className='py-0 ps-0'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label={`Summarize ${account.name}`}
            aria-expanded={isSummaryOpen}
            aria-controls={summaryId}
            onClick={() => onAction({ type: 'summaryToggled', id: account.id })}
            className={cn(
              'text-muted-foreground',
              pressedQuietOf(isSummarizePressed)
            )}
          >
            <TextQuoteIcon />
            <span className='hidden @3xl:inline'>Summarize</span>
          </Button>
        </TableCell>
      </TableRow>
      <tr className={cn(hasLineUnderSummary && 'hairline-b border-border')}>
        <td colSpan={COLUMN_COUNT} className='p-0'>
          <div className={cn(FRAME_WIDE, 'px-1')}>
            <Fold open={isSummaryOpen} id={summaryId}>
              {isSummaryWritten && (
                <div className='bg-foreground/[0.03] my-1 flex flex-col gap-1.5 rounded-md px-3 py-2.5 @3xl:ps-[3.25rem]'>
                  <p className='max-w-prose text-[13px] leading-relaxed'>
                    <StreamedWords
                      text={summaryOf(account)}
                      isStreaming={isSummaryStreaming}
                      wordMs={WORD_MS}
                    />
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Written from this row
                  </p>
                </div>
              )}
            </Fold>
          </div>
        </td>
      </tr>
    </>
  );
}

type SelectPageBoxProps = {
  rowIds: string[];
  selected: string[];
  onAction: (action: AccountsAction) => void;
};

function SelectPageBox({ rowIds, selected, onAction }: SelectPageBoxProps) {
  const selectedOnPage = rowIds.filter((id) => selected.includes(id));
  const hasRows = rowIds.length > 0;
  const isPageSelected = hasRows && selectedOnPage.length === rowIds.length;
  const isPartlySelected = selectedOnPage.length > 0 && !isPageSelected;

  return (
    <Checkbox
      data-select-page
      checked={isPageSelected}
      indeterminate={isPartlySelected}
      disabled={!hasRows}
      aria-label='Select the accounts of this page'
      onCheckedChange={() => onAction({ type: 'pageToggled' })}
    />
  );
}

/** Under reduced motion a summary is there at once. */
function streamingIdOf(
  streamingSummary: string | null,
  shouldReduceMotion: boolean
) {
  if (shouldReduceMotion) {
    return null;
  }
  return streamingSummary;
}

export type AccountsTableProps = {
  rows: Account[];
  owners: Owners;
  sort: Sort;
  selected: string[];
  openSummaries: string[];
  writtenSummaries: string[];
  streamingSummary: string | null;
  hasChanged: boolean;
  pressed: string | null;
  onAction: (action: AccountsAction) => void;
};

/** Memoised: a key typed in the question box above does not draw the rows again. */
export const AccountsTable = memo(function AccountsTable({
  rows,
  owners,
  sort,
  selected,
  openSummaries,
  writtenSummaries,
  streamingSummary,
  hasChanged,
  pressed,
  onAction,
}: AccountsTableProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const streamingId = streamingIdOf(streamingSummary, shouldReduceMotion);
  const rowIds = rows.map((account) => account.id);
  const lastIndex = rows.length - 1;
  const isEmpty = rows.length === 0;
  const sortHead = { sort, pressed, onAction };

  return (
    <Table className='min-w-[44rem]'>
      <caption className='sr-only'>Customer accounts</caption>
      <TableHeader>
        <TableRow className='hover:bg-transparent'>
          <TableHead>
            <SelectPageBox
              rowIds={rowIds}
              selected={selected}
              onAction={onAction}
            />
          </TableHead>
          <SortHead column='name' {...sortHead} />
          <SortHead column='plan' {...sortHead} />
          <TableHead className='hidden @4xl:table-cell'>Region</TableHead>
          <SortHead column='seats' isFigure {...sortHead} />
          <SortHead column='renewal' {...sortHead} />
          <TableHead>Health</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead className='ps-0'>
            <span className='sr-only'>Summary</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((account, index) => (
          <AccountRow
            key={account.id}
            account={account}
            ownerId={ownerIdOf(owners, account)}
            isSelected={selected.includes(account.id)}
            isSummaryOpen={openSummaries.includes(account.id)}
            isSummaryWritten={writtenSummaries.includes(account.id)}
            isSummaryStreaming={streamingId === account.id}
            isLast={index === lastIndex}
            hasChanged={hasChanged}
            pressed={pressed}
            onAction={onAction}
          />
        ))}
        {isEmpty && (
          <TableRow className='hover:bg-transparent'>
            <TableCell colSpan={COLUMN_COUNT} className='p-0'>
              <div
                className={cn(
                  FRAME_WIDE,
                  'flex flex-col items-start gap-3 p-4'
                )}
              >
                <p className='text-muted-foreground text-[13px]'>
                  No account matches these filters
                </p>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => onAction({ type: 'filtersCleared' })}
                >
                  Remove the filters
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
});
