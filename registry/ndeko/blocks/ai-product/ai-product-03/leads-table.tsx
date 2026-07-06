'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
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

import { LandedValue, ShimmerBar } from './cell-states';
import { ownerOf, STATUS_LABEL, type Lead, type LeadStatus } from './data';
import {
  cellKeyOf,
  isLanded,
  type Field,
  type LeadsAction,
  type LeadsState,
  type Sort,
  type SortColumn,
  type SortDirection,
} from './session';

const COLUMN_COUNT = 8;

const STATUS_VARIANT: Record<LeadStatus, 'secondary' | 'info' | 'success'> = {
  new: 'secondary',
  contacted: 'info',
  qualified: 'success',
};

const SORT_BUTTON =
  'group/sort focus-visible:ring-ring/25 hover:bg-foreground/[0.05] hover:text-foreground -mx-1.5 inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-1.5 transition-[background-color,color,scale] duration-150 outline-none focus-visible:ring-[3px]';

const FRAME_WIDE = 'sticky left-0 w-[100cqw]';

const SORT_LABEL: Record<SortColumn, string> = {
  name: 'Lead',
  company: 'Company',
  status: 'Status',
  size: 'Employees',
};

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
  sort: Sort | null;
  isFigure?: boolean;
  onSort: (column: SortColumn) => void;
};

function SortHead({ column, sort, isFigure = false, onSort }: SortHeadProps) {
  const isSorted = sort?.column === column;
  const direction = sort?.direction ?? 'asc';

  return (
    <TableHead
      aria-sort={ariaSortOf(isSorted, direction)}
      className={cn(isFigure && 'text-end')}
    >
      <button
        type='button'
        onClick={() => onSort(column)}
        className={cn(SORT_BUTTON, isFigure && 'flex-row-reverse')}
      >
        {SORT_LABEL[column]}
        <ArrowUpIcon
          aria-hidden='true'
          className={cn(
            'size-3.5 transition-[opacity,rotate] duration-200 ease-(--ease-out-strong)',
            arrowClassOf(isSorted, direction)
          )}
        />
      </button>
    </TableHead>
  );
}

type CellPhase = 'empty' | 'fetching' | 'landed';

function phaseOf(state: LeadsState, id: string, field: Field): CellPhase {
  if (isLanded(state, id, field)) {
    return 'landed';
  }
  const filling = state.filling;
  if (filling === null) {
    return 'empty';
  }
  const isThisLead = filling.id === id;
  const isThisField = filling.field === field;
  if (isThisLead && isThisField) {
    return 'fetching';
  }
  return 'empty';
}

type EnrichedCellProps = {
  phase: CellPhase;
  isLanding: boolean;
  isActive: boolean;
  shimmerClassName: string;
  label: string;
  className?: string;
  children: React.ReactNode;
};

function EnrichedCell({
  phase,
  isLanding,
  isActive,
  shimmerClassName,
  label,
  className,
  children,
}: EnrichedCellProps) {
  return (
    <TableCell className={cn('py-0', className)}>
      {phase === 'landed' && (
        <LandedValue isLanding={isLanding}>{children}</LandedValue>
      )}
      {phase === 'fetching' && (
        <>
          <ShimmerBar isActive={isActive} className={shimmerClassName} />
          <span className='sr-only'>Fetching {label}</span>
        </>
      )}
      {phase === 'empty' && (
        <>
          <span aria-hidden='true' className='text-muted-foreground/60'>
            -
          </span>
          <span className='sr-only'>Not enriched yet</span>
        </>
      )}
    </TableCell>
  );
}

function selectedStateOf(isSelected: boolean) {
  if (isSelected) {
    return 'selected';
  }
  return undefined;
}

type LeadRowProps = {
  lead: Lead;
  state: LeadsState;
  isActive: boolean;
  pressed: string | null;
  onAction: (action: LeadsAction) => void;
};

function LeadRow({ lead, state, isActive, pressed, onAction }: LeadRowProps) {
  const owner = ownerOf(lead.owner);
  const isSelected = state.selected.includes(lead.id);
  const isLit = state.litId === lead.id;
  const emailKey = cellKeyOf(lead.id, 'email');
  const sizeKey = cellKeyOf(lead.id, 'size');
  const isSelectPressed = pressed === `select-${lead.id}`;

  return (
    <TableRow
      data-state={selectedStateOf(isSelected)}
      data-lit={isLit}
      className='data-[lit=true]:bg-info/10 h-12'
    >
      <TableCell className='py-0'>
        <Checkbox
          checked={isSelected}
          aria-label={`Select ${lead.name}`}
          onCheckedChange={() => onAction({ type: 'rowToggled', id: lead.id })}
          className={cn(
            'transition-[background-color,box-shadow,scale]',
            pressedQuietOf(isSelectPressed)
          )}
        />
      </TableCell>
      <TableCell className='py-0'>
        <span className='flex items-center gap-2.5 whitespace-nowrap'>
          <Avatar seed={lead.name} className='size-6' />
          <span className='font-medium'>{lead.name}</span>
        </span>
      </TableCell>
      <TableCell className='py-0'>
        <span className='flex items-center gap-2 whitespace-nowrap'>
          <CompanyMark seed={lead.company} />
          {lead.company}
        </span>
      </TableCell>
      <TableCell className='py-0'>
        <Badge variant={STATUS_VARIANT[lead.status]}>
          {STATUS_LABEL[lead.status]}
        </Badge>
      </TableCell>
      <TableCell className='py-0'>
        <span className='flex items-center gap-2 whitespace-nowrap'>
          <Avatar seed={owner.name} className='size-5' />
          {owner.firstName}
        </span>
      </TableCell>
      <TableCell className='text-muted-foreground py-0 whitespace-nowrap'>
        {lead.city}
      </TableCell>
      <EnrichedCell
        phase={phaseOf(state, lead.id, 'email')}
        isLanding={state.settling === emailKey}
        isActive={isActive}
        shimmerClassName='w-40'
        label='the work email'
        className='min-w-56'
      >
        <span className='whitespace-nowrap'>{lead.email}</span>
      </EnrichedCell>
      <EnrichedCell
        phase={phaseOf(state, lead.id, 'size')}
        isLanding={state.settling === sizeKey}
        isActive={isActive}
        shimmerClassName='ms-auto w-8'
        label='the number of employees'
        className='text-end tabular-nums'
      >
        {lead.employees}
      </EnrichedCell>
    </TableRow>
  );
}

type SelectPageBoxProps = {
  rowIds: string[];
  selected: string[];
  onAction: (action: LeadsAction) => void;
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
      aria-label='Select the leads of this page'
      onCheckedChange={() => onAction({ type: 'pageToggled' })}
    />
  );
}

type LeadsTableProps = {
  rows: Lead[];
  state: LeadsState;
  isActive: boolean;
  pressed: string | null;
  onAction: (action: LeadsAction) => void;
};

export function LeadsTable({
  rows,
  state,
  isActive,
  pressed,
  onAction,
}: LeadsTableProps) {
  const rowIds = rows.map((lead) => lead.id);
  const isEmpty = rows.length === 0;

  function sortBy(column: SortColumn) {
    onAction({ type: 'sorted', column });
  }

  return (
    <Table className='min-w-[56rem]'>
      <caption className='sr-only'>Leads</caption>
      <TableHeader>
        <TableRow className='hover:bg-transparent'>
          <TableHead>
            <SelectPageBox
              rowIds={rowIds}
              selected={state.selected}
              onAction={onAction}
            />
          </TableHead>
          <SortHead column='name' sort={state.sort} onSort={sortBy} />
          <SortHead column='company' sort={state.sort} onSort={sortBy} />
          <SortHead column='status' sort={state.sort} onSort={sortBy} />
          <TableHead>Owner</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Work email</TableHead>
          <SortHead column='size' sort={state.sort} isFigure onSort={sortBy} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((lead) => (
          <LeadRow
            key={lead.id}
            lead={lead}
            state={state}
            isActive={isActive}
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
                  No lead matches these filters
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
}
