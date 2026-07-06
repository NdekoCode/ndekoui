'use client';

import { LayoutGroup, motion } from 'motion/react';
import { Fragment, useId } from 'react';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

import {
  SORT_COLUMNS,
  sortedCampaigns,
  sortSentenceOf,
  type SortColumn,
  type SortDirection,
  type SortKey,
} from './campaign-sort';
import { ChartCard } from './chart-card';
import {
  CAMPAIGNS,
  CHANNELS,
  type Campaign,
  type CampaignStatus,
} from './data';
import { COUNT_FORMAT, MONEY_FORMAT, PRECISE_MONEY_FORMAT } from './format';
import type { CampaignTotals, PeriodData } from './period-data';

const MotionRow = motion.create(TableRow);

const STATUS_DOT: Record<CampaignStatus, string> = {
  live: 'bg-success',
  paused: 'bg-muted-foreground/45',
};

const STATUS_WORD: Record<CampaignStatus, string> = {
  live: 'Live',
  paused: 'Paused',
};

const MONEY = new Intl.NumberFormat('en-US', MONEY_FORMAT);

const COUNT = new Intl.NumberFormat('en-US', COUNT_FORMAT);

const PRECISE_MONEY = new Intl.NumberFormat('en-US', PRECISE_MONEY_FORMAT);

function figuresOf(totals: CampaignTotals) {
  return [
    MONEY.format(totals.spend),
    COUNT.format(totals.clicks),
    COUNT.format(totals.leads),
    PRECISE_MONEY.format(totals.costPerLead),
  ];
}

function ariaSortOf(
  column: SortColumn,
  sortKey: SortKey,
  direction: SortDirection
) {
  if (column.key !== sortKey) {
    return 'none';
  }
  if (direction === 'asc') {
    return 'ascending';
  }
  return 'descending';
}

function arrowClassOf(isActive: boolean, direction: SortDirection) {
  if (!isActive) {
    return 'opacity-0 group-hover/sort:opacity-40';
  }
  if (direction === 'desc') {
    return 'rotate-180 opacity-100';
  }
  return 'opacity-100';
}

function stateOf(isSelected: boolean) {
  if (isSelected) {
    return 'selected';
  }
  return undefined;
}

/** A figure that changes is drawn again and fades in: the whole table changes with the period, and a row that travels keeps plain text. */
function Figure({ text }: { text: string }) {
  return (
    <span
      key={text}
      className='inline-block tabular-nums transition-opacity duration-300 starting:opacity-0'
    >
      {text}
    </span>
  );
}

type SortHeadProps = {
  column: SortColumn;
  sortKey: SortKey;
  direction: SortDirection;
  isPressed: boolean;
  onSort: (key: SortKey) => void;
};

function SortHead({
  column,
  sortKey,
  direction,
  isPressed,
  onSort,
}: SortHeadProps) {
  const isActive = column.key === sortKey;

  function sort() {
    onSort(column.key);
  }

  return (
    <TableHead
      aria-sort={ariaSortOf(column, sortKey, direction)}
      className='p-0'
    >
      <button
        type='button'
        onClick={sort}
        className={cn(
          'group/sort focus-visible:ring-ring/25 hover:text-foreground flex h-10 w-full cursor-pointer items-center gap-1 px-3 outline-none focus-visible:ring-[3px] focus-visible:ring-inset',
          column.isNumeric && 'justify-end',
          isActive && 'text-foreground',
          pressedQuietOf(isPressed)
        )}
      >
        {column.label}
        <ArrowUpIcon
          aria-hidden='true'
          className={cn(
            'size-3 transition-[opacity,rotate] duration-150 ease-(--ease-out-strong)',
            arrowClassOf(isActive, direction)
          )}
        />
      </button>
    </TableHead>
  );
}

type CampaignRowProps = {
  campaign: Campaign;
  totals: CampaignTotals;
  orderKey: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function CampaignRow({
  campaign,
  totals,
  orderKey,
  isSelected,
  onSelect,
}: CampaignRowProps) {
  const figures = figuresOf(totals);

  function select() {
    onSelect(campaign.id);
  }

  return (
    <MotionRow
      layout='position'
      layoutDependency={orderKey}
      data-state={stateOf(isSelected)}
      onClick={select}
      className='cursor-pointer'
    >
      <TableCell className='min-w-44'>
        <button
          type='button'
          aria-pressed={isSelected}
          className='focus-visible:ring-ring/25 flex max-w-full cursor-pointer items-center gap-2 rounded-md text-start text-[13px] font-medium outline-none focus-visible:ring-[3px]'
        >
          <span
            aria-hidden='true'
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              STATUS_DOT[campaign.status]
            )}
          />
          <span className='truncate'>{campaign.name}</span>
          <span className='sr-only'>{STATUS_WORD[campaign.status]}</span>
        </button>
      </TableCell>
      {figures.map((text, index) => (
        <TableCell key={SORT_COLUMNS[index + 1].key} className='text-end'>
          <Figure text={text} />
        </TableCell>
      ))}
    </MotionRow>
  );
}

type CampaignTableProps = {
  data: PeriodData;
  sortKey: SortKey;
  sortDirection: SortDirection;
  selectedId: string | null;
  pressed: string | null;
  onSort: (key: SortKey) => void;
  onSelect: (id: string) => void;
};

export function CampaignTable({
  data,
  sortKey,
  sortDirection,
  selectedId,
  pressed,
  onSort,
  onSelect,
}: CampaignTableProps) {
  const groupId = useId();
  const sentence = sortSentenceOf(sortKey, sortDirection);

  return (
    <ChartCard
      title='Campaigns'
      section='campaigns'
      description={
        <Swap swapKey={sentence} className='text-muted-foreground text-xs'>
          {sentence}
        </Swap>
      }
    >
      <LayoutGroup id={groupId}>
        <div className='-mx-3'>
          <Table className='min-w-[34rem]'>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                {SORT_COLUMNS.map((column) => (
                  <SortHead
                    key={column.key}
                    column={column}
                    sortKey={sortKey}
                    direction={sortDirection}
                    isPressed={pressed === `sort-${column.key}`}
                    onSort={onSort}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CHANNELS.map((channel) => {
                const members = CAMPAIGNS.filter(
                  (campaign) => campaign.channel === channel.id
                );
                const rows = sortedCampaigns(
                  members,
                  data.campaigns,
                  sortKey,
                  sortDirection
                );
                const orderKey = rows.map((row) => row.id).join(',');
                const subtotals = figuresOf(data.groups[channel.id]);
                return (
                  <Fragment key={channel.id}>
                    <TableRow className='bg-foreground/[0.03] hover:bg-foreground/[0.03]'>
                      <TableCell className='py-2'>
                        <span className='flex items-center gap-2 text-xs font-medium'>
                          <span
                            aria-hidden='true'
                            className='size-2 shrink-0 rounded-full'
                            style={{
                              backgroundColor: seriesColorOf(channel.series),
                            }}
                          />
                          {channel.name}
                          <span className='text-muted-foreground font-normal'>
                            {countOf(members.length, 'campaign')}
                          </span>
                        </span>
                      </TableCell>
                      {subtotals.map((text, index) => (
                        <TableCell
                          key={SORT_COLUMNS[index + 1].key}
                          className='text-muted-foreground py-2 text-end text-xs'
                        >
                          <Figure text={text} />
                        </TableCell>
                      ))}
                    </TableRow>
                    {rows.map((campaign) => (
                      <CampaignRow
                        key={campaign.id}
                        campaign={campaign}
                        totals={data.campaigns[campaign.id]}
                        orderKey={orderKey}
                        isSelected={campaign.id === selectedId}
                        onSelect={onSelect}
                      />
                    ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </LayoutGroup>
    </ChartCard>
  );
}
